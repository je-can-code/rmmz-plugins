//region plugins/abs/ext/input/objects/game-system.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Game_System.js is a prototype-patch file (aliases and adds methods onto the real RMMZ
 * `Game_System.prototype`), so this file direct-imports it against a placeholder `Game_System`
 * global rather than nesting a vm context. JABS_StandardController is imported for JSDoc typing
 * only (never referenced as a value), so it gets a trivial empty stub. `JABS_InputAdapter` and
 * `Input` are bare globals this file reads, stubbed directly per the unit-tier convention.
 */
describe('J-ABS-Input Game_System (unit, all downstream dependencies mocked)', () =>
{
  let originalInitMembers;
  let originalOnBeforeSave;
  let originalOnAfterLoad;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { INPUT: { Aliased: { Game_System: new Map() } } } } };

    function Game_System()
    {
    }
    originalInitMembers = vi.fn();
    originalOnBeforeSave = vi.fn();
    originalOnAfterLoad = vi.fn();
    Game_System.prototype.initMembers = originalInitMembers;
    Game_System.prototype.onBeforeSave = originalOnBeforeSave;
    Game_System.prototype.onAfterLoad = originalOnAfterLoad;
    globalThis.Game_System = Game_System;

    vi.doMock('../../../../../../src/plugins/abs/ext/input/_models/JABS_StandardController.js', () => ({ default: class {} }));

    await import('../../../../../../src/plugins/abs/ext/input/objects/Game_System.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockClear();
    originalOnBeforeSave.mockClear();
    originalOnAfterLoad.mockClear();
    globalThis.JABS_InputAdapter = { getAllControllers: vi.fn(() => []) };

    // keybinds are installation scope now, so the stores these methods read live on ConfigManager.
    globalThis.ConfigManager = {
      jabsInputMappings: {},
      jabsInputBindings: {},
      save: vi.fn(),
    };
    globalThis.Input = {
      exportAllBindingsForSave: vi.fn(() => ({})),
      importAllBindingsFromSave: vi.fn(),
      ensureRemapBootstrapped: vi.fn(),
    };
  });

  /**
   * Builds a real Game_System-prototype-backed instance.
   * @returns {object} A stubbed Game_System instance.
   */
  function buildSystem()
  {
    return Object.create(globalThis.Game_System.prototype);
  }

  /**
   * Builds a fake input controller test double.
   * @param {object} [overrides] Overrides.
   * @returns {object} A fake controller.
   */
  function buildController(overrides = {})
  {
    return {
      exportAllInputs: () => ({ Main: [ 'ok' ] }),
      setAllInputs: vi.fn(),
      buildDefaultMapping: () => ({ Main: [ 'ok' ] }),
      ...overrides,
    };
  }

  describe('initMembers()/initJabsInputConfigMembers()', () =>
  {
    it('performs the original logic then seeds the jabs input namespace', () =>
    {
      const system = buildSystem();

      system.initMembers();

      expect(originalInitMembers).toHaveBeenCalled();
      expect(system.getJabsInputMappings()).toEqual({});
      expect(system.getInputBindingsSnapshot()).toEqual({});
    });

    it('does not clobber existing data when called again', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      system.setJabsInputMappings({ player1: {} });

      system.initJabsInputConfigMembers();

      expect(system.getJabsInputMappings()).toEqual({ player1: {} });
    });
  });

  describe('getJabsInputMappings()/setJabsInputMappings()', () =>
  {
    it('round-trips the mappings dictionary', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      const mappings = { player1: { Main: [ 'ok' ] } };

      system.setJabsInputMappings(mappings);

      expect(system.getJabsInputMappings()).toEqual(mappings);
    });
  });

  describe('setJabsInputConfig()/getJabsInputConfig()', () =>
  {
    it('stores a shallow copy under the controller key- reassigning a key on the original does not affect the stored copy', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      const mapping = { Main: [ 'ok' ] };

      system.setJabsInputConfig('player1', mapping);
      mapping.Main = [ 'reassigned' ];

      expect(system.getJabsInputConfig('player1').Main).toEqual([ 'ok' ]);
    });

    it('returns null for an unknown controller key', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();

      expect(system.getJabsInputConfig('unknown')).toBeNull();
    });

    it('returns a defensive copy so external mutation does not affect stored state', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      system.setJabsInputConfig('player1', { Main: [ 'ok' ] });

      const fetched = system.getJabsInputConfig('player1');
      fetched.Main = [ 'mutated' ];

      expect(system.getJabsInputConfig('player1').Main).toEqual([ 'ok' ]);
    });
  });

  describe('getInputBindingsSnapshot()/setInputBindingsSnapshot()', () =>
  {
    it('deep-clones the snapshot on write, decoupling it from the source object', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      const source = { JABS: { Main: [ 'ok' ] } };

      system.setInputBindingsSnapshot(source);
      source.JABS.Main.push('intruder');

      expect(system.getInputBindingsSnapshot().JABS.Main).toEqual([ 'ok' ]);
    });

    it('coerces a non-array binding value to an empty array', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();

      system.setInputBindingsSnapshot({ JABS: { Main: 'not-an-array' } });

      expect(system.getInputBindingsSnapshot().JABS.Main).toEqual([]);
    });

    it('handles a missing/null snapshot gracefully', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();

      expect(() => system.setInputBindingsSnapshot(null)).not.toThrow();
      expect(system.getInputBindingsSnapshot()).toEqual({});
    });

    it('handles a namespace with a missing map gracefully', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();

      system.setInputBindingsSnapshot({ JABS: null });

      expect(system.getInputBindingsSnapshot().JABS).toEqual({});
    });
  });

  describe('applyJabsInputConfigToController()', () =>
  {
    it('does nothing when no mapping is stored for the key', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      const controller = buildController();

      system.applyJabsInputConfigToController('player1', controller);

      expect(controller.setAllInputs).not.toHaveBeenCalled();
    });

    it('applies the stored mapping to the controller', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      system.setJabsInputConfig('player1', { Main: [ 'ok' ] });
      const controller = buildController();

      system.applyJabsInputConfigToController('player1', controller);

      expect(controller.setAllInputs).toHaveBeenCalledWith({ Main: [ 'ok' ] });
    });
  });

  describe('saveAllJabsInputConfigs()', () =>
  {
    it('exports and stores every registered controller under its resolved key', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      const controller = buildController();
      globalThis.JABS_InputAdapter.getAllControllers.mockReturnValue([ controller ]);

      system.saveAllJabsInputConfigs();

      expect(system.getJabsInputConfig('player1')).toEqual({ Main: [ 'ok' ] });
    });
  });

  describe('applyAllJabsInputConfigs()', () =>
  {
    it('applies stored configs to every registered controller by resolved key', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      system.setJabsInputConfig('player1', { Main: [ 'ok' ] });
      const controller = buildController();
      globalThis.JABS_InputAdapter.getAllControllers.mockReturnValue([ controller ]);

      system.applyAllJabsInputConfigs();

      expect(controller.setAllInputs).toHaveBeenCalledWith({ Main: [ 'ok' ] });
    });
  });

  describe('resetJabsInputConfigToDefaults()', () =>
  {
    it('builds and applies defaults, then persists them', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      const controller = buildController();
      globalThis.JABS_InputAdapter.getAllControllers.mockReturnValue([ controller ]);

      system.resetJabsInputConfigToDefaults(0);

      expect(controller.setAllInputs).toHaveBeenCalledWith({ Main: [ 'ok' ] });
      expect(system.getJabsInputConfig('player1')).toEqual({ Main: [ 'ok' ] });
    });
  });

  describe('saveAllInputBindingsFromInput()', () =>
  {
    it('exports the live Input registry and persists the snapshot', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      globalThis.Input.exportAllBindingsForSave.mockReturnValue({ JABS: { Main: [ 'ok' ] } });

      system.saveAllInputBindingsFromInput();

      expect(system.getInputBindingsSnapshot()).toEqual({ JABS: { Main: [ 'ok' ] } });
    });
  });

  describe('applyAllInputBindingsToInput()', () =>
  {
    it('bootstraps defaults then imports the persisted snapshot', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      system.setInputBindingsSnapshot({ JABS: { Main: [ 'ok' ] } });

      system.applyAllInputBindingsToInput();

      expect(globalThis.Input.ensureRemapBootstrapped).toHaveBeenCalled();
      expect(globalThis.Input.importAllBindingsFromSave).toHaveBeenCalledWith({ JABS: { Main: [ 'ok' ] } });
    });
  });

  describe('resolveJabsControllerKey()', () =>
  {
    it('resolves a stable player-index key', () =>
    {
      const system = buildSystem();

      expect(system.resolveJabsControllerKey({}, 0)).toEqual('player1');
      expect(system.resolveJabsControllerKey({}, 1)).toEqual('player2');
    });
  });

  describe('initializeJabsInputIfMissing()', () =>
  {
    it('seeds defaults for every controller when neither mappings nor bindings exist', () =>
    {
      const system = buildSystem();
      const controller = buildController();
      globalThis.JABS_InputAdapter.getAllControllers.mockReturnValue([ controller ]);

      system.initializeJabsInputIfMissing();

      expect(globalThis.Input.ensureRemapBootstrapped).toHaveBeenCalled();
      expect(controller.setAllInputs).toHaveBeenCalledWith({ Main: [ 'ok' ] });
      expect(system.getJabsInputConfig('player1')).toEqual({ Main: [ 'ok' ] });
    });

    it('does nothing further when mappings already exist', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      system.setJabsInputConfig('player1', { Main: [ 'ok' ] });
      const controller = buildController();
      globalThis.JABS_InputAdapter.getAllControllers.mockReturnValue([ controller ]);

      system.initializeJabsInputIfMissing();

      expect(globalThis.Input.ensureRemapBootstrapped).not.toHaveBeenCalled();
    });

    it('does nothing further when bindings already exist', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      system.setInputBindingsSnapshot({ JABS: { Main: [ 'ok' ] } });
      const controller = buildController();
      globalThis.JABS_InputAdapter.getAllControllers.mockReturnValue([ controller ]);

      system.initializeJabsInputIfMissing();

      expect(globalThis.Input.ensureRemapBootstrapped).not.toHaveBeenCalled();
    });

    it('seeds defaults from a completely uninitialized instance (no _j namespace at all yet)', () =>
    {
      // covers the method running before anything has seeded the config stores it reads.
      const system = buildSystem();
      globalThis.JABS_InputAdapter.getAllControllers.mockReturnValue([]);

      expect(() => system.initializeJabsInputIfMissing()).not.toThrow();
      expect(globalThis.Input.ensureRemapBootstrapped).toHaveBeenCalled();
    });
  });

  describe('onBeforeSave()', () =>
  {
    it('performs original logic then snapshots configs and bindings', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      const saveConfigsSpy = vi.spyOn(system, 'saveAllJabsInputConfigs').mockImplementation(() => {});
      const saveBindingsSpy = vi.spyOn(system, 'saveAllInputBindingsFromInput').mockImplementation(() => {});

      system.onBeforeSave();

      expect(originalOnBeforeSave).toHaveBeenCalled();
      expect(saveConfigsSpy).toHaveBeenCalled();
      expect(saveBindingsSpy).toHaveBeenCalled();
    });
  });

  describe('onAfterLoad()', () =>
  {
    it('performs original logic then seeds missing defaults, bindings, and controller configs', () =>
    {
      const system = buildSystem();
      system.initJabsInputConfigMembers();
      const legacySpy = vi.spyOn(system, 'initializeJabsInputIfMissing').mockImplementation(() => {});
      const applyBindingsSpy = vi.spyOn(system, 'applyAllInputBindingsToInput').mockImplementation(() => {});
      const applyConfigsSpy = vi.spyOn(system, 'applyAllJabsInputConfigs').mockImplementation(() => {});

      system.onAfterLoad();

      expect(originalOnAfterLoad).toHaveBeenCalled();
      expect(legacySpy).toHaveBeenCalled();
      expect(applyBindingsSpy).toHaveBeenCalled();
      expect(applyConfigsSpy).toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/input/objects/game-system.test.js
