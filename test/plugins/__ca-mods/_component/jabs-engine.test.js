//region plugins/__ca-mods/_component/jabs-engine.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import PluginMetadata from '../../../../src/plugins/_base/core/models/PluginMetadata.js';

describe('CAMods JABS_Engine (direct src import, hand-rolled JABS stand-in)', () =>
{
  /** @type {{canGainReward: Function, addLootDropToMap: Function, handleDefeatedEnemy: Function,
   *  handleDefeatedPlayer: Function, postExecuteSkillEffects: Function, executeMapAction: Function,
   *  handlePartyCycleMemberChanges: Function}} */
  let originals;

  beforeAll(async () =>
  {
    // JABS_Engine is a real ES class defined in the (separately-bundled) J-ABS plugin; by the time
    // the shipped __ca-mods bundle runs, it's already a bare global. Stand in the minimal method
    // surface __ca-mods aliases/extends, matching the shape used by
    // test/plugins/crit/fixtures/crit-companion-stubs.js for the same kind of cross-plugin dependency.
    originals = {
      canGainReward: vi.fn(() => 'original-can-gain-reward'),
      addLootDropToMap: vi.fn(() => 'original-add-loot'),
      handleDefeatedEnemy: vi.fn(),
      handleDefeatedPlayer: vi.fn(),
      postExecuteSkillEffects: vi.fn(),
      executeMapAction: vi.fn(),
      handlePartyCycleMemberChanges: vi.fn(),
    };

    function JABS_Engine() {}

    Object.assign(JABS_Engine.prototype, originals);

    globalThis.JABS_Engine = JABS_Engine;

    // JABS_Button is likewise a bare global from J-ABS; only the three cooldown-type constants
    // trackActionData()/postExecuteSkillEffects() branch on are needed here.
    globalThis.JABS_Button = { Mainhand: 'Main', Offhand: 'Offhand', Tool: 'Tool' };

    globalThis.PluginManager = { parameters: () => '[]' };
    globalThis.PluginMetadata = PluginMetadata;
    globalThis.__PLUGIN_NAME__ = 'Test-Plugin';
    globalThis.__PLUGIN_VERSION__ = '0.0.0-test';

    // J-Base first- gives us J.BASE.Helpers.modVariable(), which reads/writes $gameVariables.
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../src/plugins/__ca-mods/core/_metadata/initialization.js');

    // the file under test- aliases and extends the stand-in methods above.
    await import('../../../../src/plugins/__ca-mods/core/managers/JABS_Engine.js');
  });

  afterAll(() =>
  {
    delete globalThis.JABS_Engine;
    delete globalThis.JABS_Button;
    delete globalThis.PluginManager;
    delete globalThis.PluginMetadata;
    delete globalThis.__PLUGIN_NAME__;
    delete globalThis.__PLUGIN_VERSION__;
    delete globalThis.J;
  });

  beforeEach(() =>
  {
    globalThis.$gameVariables = {
      _values: {},
      value(id)
      {
        return this._values[id] ?? 0;
      },
      setValue(id, value)
      {
        this._values[id] = value;
      },
    };
  });

  afterEach(() =>
  {
    delete globalThis.$gameVariables;
    delete globalThis.$gameParty;
    delete globalThis.$gamePlayer;
    vi.clearAllMocks();
  });

  describe('canGainReward', () =>
  {
    it('returns false without calling the original when the defeated enemy is inanimate', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const defeatedEnemy = { isInanimate: () => true };

      expect(engine.canGainReward(defeatedEnemy, {})).toBe(false);
      expect(originals.canGainReward).not.toHaveBeenCalled();
    });

    it('defers to the original logic for animate enemies', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const defeatedEnemy = { isInanimate: () => false };
      const victoriousActor = {};

      expect(engine.canGainReward(defeatedEnemy, victoriousActor)).toBe('original-can-gain-reward');
      expect(originals.canGainReward).toHaveBeenCalledWith(defeatedEnemy, victoriousActor);
    });
  });

  describe('addLootDropToMap', () =>
  {
    it('shifts the drop\'s Y coordinate up by one before delegating to the original', () =>
    {
      const engine = new globalThis.JABS_Engine();

      engine.addLootDropToMap(5, 10, 'item');

      expect(originals.addLootDropToMap).toHaveBeenCalledWith(5, 11, 'item');
    });
  });

  describe('handleDefeatedEnemy', () =>
  {
    it('tracks destructibles destroyed when the target is inanimate', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const defeatedTarget = { isInanimate: () => true };

      engine.handleDefeatedEnemy(defeatedTarget, {});

      expect(originals.handleDefeatedEnemy).toHaveBeenCalledWith(defeatedTarget, {});
      expect(globalThis.$gameVariables.value(102)).toBe(1);
      expect(globalThis.$gameVariables.value(101)).toBe(0);
    });

    it('tracks enemies defeated when the target is animate', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const defeatedTarget = { isInanimate: () => false };

      engine.handleDefeatedEnemy(defeatedTarget, {});

      expect(globalThis.$gameVariables.value(101)).toBe(1);
      expect(globalThis.$gameVariables.value(102)).toBe(0);
    });
  });

  describe('handleDefeatedPlayer', () =>
  {
    it('tracks the death count before deferring to the original', () =>
    {
      const engine = new globalThis.JABS_Engine();

      engine.handleDefeatedPlayer();

      expect(globalThis.$gameVariables.value(117)).toBe(1);
      expect(originals.handleDefeatedPlayer).toHaveBeenCalledTimes(1);
    });
  });

  describe('postExecuteSkillEffects', () =>
  {
    /**
     * Builds a minimal action stub reporting the given cooldown type.
     * @param {string} cooldownType
     * @returns {object}
     */
    function buildAction(cooldownType)
    {
      return { getCooldownType: () => cooldownType };
    }

    it('tracks attack data when the target is an enemy and the action is not a tool', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const target = {
        isEnemy: () => true,
        isActor: () => false,
        getBattler: () => ({ result: () => ({ hpDamage: 50, critical: false }) }),
      };

      engine.postExecuteSkillEffects(buildAction(globalThis.JABS_Button.Mainhand), target);

      expect(originals.postExecuteSkillEffects).toHaveBeenCalledTimes(1);
      expect(globalThis.$gameVariables.value(103)).toBe(50);
    });

    it('tracks defensive data when the target is an actor', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const target = {
        isEnemy: () => false,
        isActor: () => true,
        getBattler: () => ({ result: () => ({ hpDamage: 25, critical: false, parried: false, preciseParried: false }) }),
      };

      engine.postExecuteSkillEffects(buildAction(globalThis.JABS_Button.Mainhand), target);

      expect(globalThis.$gameVariables.value(109)).toBe(25);
    });

    it('skips tracking entirely when the action is a tool', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const target = {
        isEnemy: () => true,
        isActor: () => false,
        getBattler: () => ({ result: () => ({ hpDamage: 999, critical: false }) }),
      };

      engine.postExecuteSkillEffects(buildAction(globalThis.JABS_Button.Tool), target);

      expect(globalThis.$gameVariables.value(103)).toBe(0);
    });
  });

  describe('executeMapAction', () =>
  {
    it('tracks action usage data only when the caster is the player', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const caster = { isPlayer: () => true };
      const action = { getCooldownType: () => globalThis.JABS_Button.Mainhand };

      engine.executeMapAction(caster, action, 1, 2);

      expect(originals.executeMapAction).toHaveBeenCalledWith(caster, action, 1, 2);
      expect(globalThis.$gameVariables.value(113)).toBe(1);
    });

    it('does not track action usage data for non-player casters', () =>
    {
      const engine = new globalThis.JABS_Engine();
      const caster = { isPlayer: () => false };
      const action = { getCooldownType: () => globalThis.JABS_Button.Mainhand };

      engine.executeMapAction(caster, action, 1, 2);

      expect(globalThis.$gameVariables.value(113)).toBe(0);
    });
  });

  describe('handlePartyCycleMemberChanges', () =>
  {
    it('moves the previous leader from the front of the party to the second slot', () =>
    {
      const engine = new globalThis.JABS_Engine();
      engine.refreshPlayer1Data = vi.fn();

      globalThis.$gameParty = { _actors: [ 1, 2, 3 ] };
      globalThis.$gamePlayer = { refresh: vi.fn() };

      // the original stub itself performs no reordering- __ca-mods reads _actors.at(0) both
      // before and after calling it, so the "original" leader is captured before any mutation.
      engine.handlePartyCycleMemberChanges();

      expect(originals.handlePartyCycleMemberChanges).toHaveBeenCalledTimes(1);

      // former leader (actorId 1) removed from index 0 and reinserted at index 1.
      expect(globalThis.$gameParty._actors).toEqual([ 2, 1, 3 ]);
      expect(globalThis.$gamePlayer.refresh).toHaveBeenCalledTimes(1);
      expect(engine.refreshPlayer1Data).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/__ca-mods/_component/jabs-engine.test.js
