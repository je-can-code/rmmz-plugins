//region plugins/abs/ext/allyai/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI Game_Actor (unit, all downstream dependencies mocked)', () =>
{
  let originalInitMembers;
  let originalSetup;
  let FakeJABS_AllyAI;

  beforeAll(async () =>
  {
    vi.resetModules();

    const DEFAULT_AI_REGEX = Symbol('DefaultAi');
    globalThis.J = { ABS: { EXT: { ALLYAI: { Aliased: { Game_Actor: new Map() }, RegExp: { DefaultAi: DEFAULT_AI_REGEX } } } } };
    globalThis.RPGManager = { getStringFromNoteByRegex: vi.fn() };

    FakeJABS_AllyAI = vi.fn(function(presetKey)
    {
      this.presetKey = presetKey;
      this.applyPreset = vi.fn();
    });
    FakeJABS_AllyAI.presets = { GENERALIST: { key: 'generalist' } };
    FakeJABS_AllyAI.validatePreset = vi.fn(() => true);

    vi.doMock('../../../../../../src/plugins/abs/ext/allyai/_models/JABS_AllyAI.js', () => ({ default: FakeJABS_AllyAI }));

    function Game_Actor()
    {
    }

    originalInitMembers = vi.fn();
    originalSetup = vi.fn();
    Game_Actor.prototype.initMembers = originalInitMembers;
    Game_Actor.prototype.setup = originalSetup;
    // vanilla accessor the allyai layer reads through.
    Game_Actor.prototype.actorId = function() { return this._actorId; };

    globalThis.Game_Actor = Game_Actor;

    await import('../../../../../../src/plugins/abs/ext/allyai/objects/Game_Actor.js');
  });

  beforeEach(() =>
  {
    originalInitMembers.mockReset();
    originalSetup.mockReset();
    globalThis.RPGManager.getStringFromNoteByRegex.mockReset();
    FakeJABS_AllyAI.validatePreset.mockReset().mockReturnValue(true);
  });

  function buildActor(overrides = {})
  {
    const actor = Object.create(globalThis.Game_Actor.prototype);
    actor.initMembers();
    return Object.assign(actor, overrides);
  }

  describe('initMembers / initAllyAiMembers', () =>
  {
    it('calls the original then defaults the ally AI mode to a generalist preset', () =>
    {
      const actor = Object.create(globalThis.Game_Actor.prototype);
      actor.initMembers();
      expect(originalInitMembers).toHaveBeenCalledTimes(1);
      expect(actor.getAllyAI().presetKey).toBe('generalist');
    });
  });

  describe('setup / initAllyAI', () =>
  {
    it('performs the original logic then applies the resolved default ally AI preset', () =>
    {
      const actor = buildActor();
      actor.getDefaultAllyAI = () => 'aggressive';
      actor.setup(3);
      expect(originalSetup).toHaveBeenCalledWith(3);
      expect(actor.getAllyAI().applyPreset).toHaveBeenCalledWith('aggressive');
    });
  });

  describe('getAllyAI', () =>
  {
    it('lazily initializes ally AI members when the _j._abs namespace exists but ally AI was never added (e.g. stale save data predating this extension)', () =>
    {
      // real characters always have initMembers run their _j._abs namespace into being before
      // anything else touches them; the only reachable "missing" case is this namespace existing
      // without the allyAi branch specifically.
      const actor = Object.create(globalThis.Game_Actor.prototype);
      actor._j = { _abs: {} };
      const result = actor.getAllyAI();
      expect(result).toBeDefined();
    });

    it('returns the same instance on repeated calls', () =>
    {
      const actor = buildActor();
      const first = actor.getAllyAI();
      const second = actor.getAllyAI();
      expect(second).toBe(first);
    });
  });

  describe('setAllyAIPreset', () =>
  {
    it('applies the given preset key to the current ally AI mode', () =>
    {
      const actor = buildActor();
      actor.setAllyAIPreset('defensive');
      expect(actor.getAllyAI().applyPreset).toHaveBeenCalledWith('defensive');
    });
  });

  describe('getDefaultAllyAI', () =>
  {
    it('returns null when there is no actor id yet', () =>
    {
      const actor = buildActor({ _actorId: 0 });
      expect(actor.getDefaultAllyAI()).toBeNull();
    });

    it('prefers the class-tagged mode over the actor-tagged mode', () =>
    {
      const actor = buildActor({ _actorId: 1, actor: () => ({}), currentClass: () => ({}) });
      globalThis.RPGManager.getStringFromNoteByRegex
        .mockReturnValueOnce('actor-mode')
        .mockReturnValueOnce('class-mode');

      expect(actor.getDefaultAllyAI()).toBe('class-mode');
    });

    it('falls back to the actor-tagged mode when the class has none', () =>
    {
      const actor = buildActor({ _actorId: 1, actor: () => ({}), currentClass: () => ({}) });
      globalThis.RPGManager.getStringFromNoteByRegex
        .mockReturnValueOnce('actor-mode')
        .mockReturnValueOnce(null);

      expect(actor.getDefaultAllyAI()).toBe('actor-mode');
    });

    it('falls back to the generalist preset when the resolved mode fails validation', () =>
    {
      const actor = buildActor({ _actorId: 1, actor: () => ({}), currentClass: () => ({}) });
      globalThis.RPGManager.getStringFromNoteByRegex.mockReturnValue('bogus-mode');
      FakeJABS_AllyAI.validatePreset.mockReturnValue(false);

      expect(actor.getDefaultAllyAI()).toBe('generalist');
    });
  });

  describe('getValidSkillSlotsForAlly', () =>
  {
    it('reads the equipped ally slots from the skill slot manager', () =>
    {
      const slots = [ { key: 'mainhand' } ];
      const getEquippedAllySlots = vi.fn(() => slots);
      const actor = buildActor({ getSkillSlotManager: () => ({ getEquippedAllySlots }) });

      const result = actor.getValidSkillSlotsForAlly();

      expect(result).toBe(slots);
    });
  });
});
//endregion plugins/abs/ext/allyai/objects/game-actor.test.js
