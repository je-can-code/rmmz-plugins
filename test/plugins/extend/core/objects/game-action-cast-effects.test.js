//region plugins/extend/core/objects/game-action-cast-effects.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installExtendHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJExtend,
} from '../../_component/fixtures/install-extend-host-globals.js';
import { buildFateBattlerStub } from '../../../_base/core/_component/fixtures/install-jabs-fate.js';

describe('Game_Action ext/extend cast effects (direct src import)', () =>
{
  let proto;
  let aliasMap;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    ({ default: globalThis.JCache } = await import('../../../../../src/plugins/_base/core/core/JCache.js'));
    ({ default: globalThis.ArrayHelper } = await import('../../../../../src/plugins/_base/core/_utilities/ArrayHelper.js'));
    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.TraitResolver } = await import('../../../../../src/plugins/_base/core/managers/TraitResolver.js'));

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJExtend();
    await import('../../../../../src/plugins/extend/core/_metadata/initialization.js');

    // J-Base owns the rawItem() accessor extend's Game_Action reads through.
    await import('../../../../../src/plugins/_base/core/objects/Game_Action.js');

    await import('../../../../../src/plugins/extend/core/objects/Game_Action.js');

    proto = globalThis.Game_Action.prototype;
    aliasMap = globalThis.J.EXTEND.Aliased.Game_Action;
  });

  /**
   * Builds an action stand-in with a caster and an executing skill. The caster carries every primitive J-ABS's fate
   * reads, each neutral, so a payload's roll is left to its chance alone unless a test says otherwise.
   * @param {object} [overrides] Members to replace.
   * @returns {object}
   */
  const buildAction = (overrides = {}) => Object.assign(Object.create(proto), {
    _item: { setObject: vi.fn(), object: () => null },
    subject: () => buildFateBattlerStub({ isStateAffected: () => false }),
    item: () => ({ note: '' }),
    reactiveStateSources: () => [],
  }, overrides);

  describe('setSkill', () =>
  {
    it('performs original logic when there is no caster to resolve extensions against', () =>
    {
      // Arrange- extension is defined relative to a caster, so with none the base behaviour stands.
      const original = vi.fn();
      const realOriginal = aliasMap.get('setSkill');
      aliasMap.set('setSkill', original);
      const action = buildAction({ subject: () => null });

      // Act
      proto.setSkill.call(action, 7);

      // Assert
      expect(original).toHaveBeenCalledWith(7);

      aliasMap.set('setSkill', realOriginal);
    });
  });

  describe('setItemObject', () =>
  {
    it('performs original logic when there is no caster', () =>
    {
      // Arrange
      const original = vi.fn();
      const realOriginal = aliasMap.get('setItemObject');
      aliasMap.set('setItemObject', original);
      const action = buildAction({ subject: () => null });
      const item = { id: 3 };

      // Act
      proto.setItemObject.call(action, item);

      // Assert
      expect(original).toHaveBeenCalledWith(item);

      aliasMap.set('setItemObject', realOriginal);
    });

    it('assigns the object directly when a caster is present', () =>
    {
      // Arrange- see finding F1 in the overnight report: this branch deliberately does not apply
      // extension overlays, which is the open question flagged there. The original engine method
      // assigns the object through the very same setObject call this branch does, so it has to be
      // swapped for a spy that does nothing- otherwise it stands in as a backstop and the two paths
      // become indistinguishable from the outside.
      const original = vi.fn();
      const realOriginal = aliasMap.get('setItemObject');
      aliasMap.set('setItemObject', original);
      const action = buildAction();
      const item = { id: 3 };

      // Act
      proto.setItemObject.call(action, item);

      // Assert- the caster-present path assigns directly and never defers to the original.
      expect(action._item.setObject).toHaveBeenCalledWith(item);
      expect(original).not.toHaveBeenCalled();

      aliasMap.set('setItemObject', realOriginal);
    });
  });

  describe('applyOnCastSelfStatesIfAfflicted', () =>
  {
    let getArraysSpy;

    beforeEach(() =>
    {
      getArraysSpy = vi.spyOn(globalThis.RPGManager, 'getArraysFromNotesByRegex');
    });

    afterEach(() =>
    {
      getArraysSpy.mockRestore();
    });

    it('does nothing when the skill carries no conditional self-state tags', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue([]);
      const applyStates = vi.fn();
      const action = buildAction({ reactiveStateSources: () => [ { note: '' } ], applyStates });

      // Act
      proto.applyOnCastSelfStatesIfAfflicted.call(action);

      // Assert
      expect(applyStates).not.toHaveBeenCalled();
    });

    it('tolerates a source whose tag lookup yields nothing at all', () =>
    {
      // Arrange- the note reader answers null rather than an empty array when the tag is absent.
      getArraysSpy.mockReturnValue(null);
      const applyStates = vi.fn();
      const action = buildAction({ reactiveStateSources: () => [ { note: '' } ], applyStates });

      // Act
      proto.applyOnCastSelfStatesIfAfflicted.call(action);

      // Assert
      expect(applyStates).not.toHaveBeenCalled();
    });

    it('applies a self-state whose required affliction is active on the caster', () =>
    {
      // Arrange- the gate is the whole point of the tag: apply state 10 only while state 99 is up.
      getArraysSpy.mockReturnValue([ [ 10, 100, 99 ] ]);
      const applyStates = vi.fn();
      const caster = { isStateAffected: stateId => stateId === 99 };
      const action = buildAction({
        subject: () => caster,
        reactiveStateSources: () => [ { note: '' } ],
        applyStates,
      });

      // Act
      proto.applyOnCastSelfStatesIfAfflicted.call(action);

      // Assert- routed through applyStates rather than addState directly so the JABS engine registers
      // the tracker the HUD reads from.
      expect(applyStates).toHaveBeenCalledTimes(1);
      const [ [ target, effects ] ] = applyStates.mock.calls;
      expect(target).toBe(caster);
      expect(effects).toHaveLength(1);
      expect(effects[0].skillId).toBe(10);
    });

    it('skips a self-state whose required affliction is missing', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue([ [ 10, 100, 99 ] ]);
      const applyStates = vi.fn();
      const action = buildAction({
        subject: () => ({ isStateAffected: () => false }),
        reactiveStateSources: () => [ { note: '' } ],
        applyStates,
      });

      // Act
      proto.applyOnCastSelfStatesIfAfflicted.call(action);

      // Assert- applyStates still runs, but with nothing to apply.
      expect(applyStates).toHaveBeenCalledWith(expect.anything(), []);
    });

    it('keeps only the self-states whose required affliction is active, out of several', () =>
    {
      // Arrange- two tags gated on different states, and only one of those states is active on the caster.
      getArraysSpy.mockReturnValue([ [ 10, 40, 99 ], [ 11, 60, 98 ] ]);
      const applyStates = vi.fn();
      const action = buildAction({
        subject: () => ({ isStateAffected: stateId => stateId === 99 }),
        reactiveStateSources: () => [ { note: '' } ],
        applyStates,
      });

      // Act
      proto.applyOnCastSelfStatesIfAfflicted.call(action);

      // Assert- only the tag whose gate holds survives, naming its own state and its percent chance as authored.
      const [ [ , effects ] ] = applyStates.mock.calls;
      const kept = effects.map(({ skillId, chance }) => [ skillId, chance ]);
      expect(kept).toEqual([ [ 10, 40 ] ]);
    });

    it('gathers tags from every reactive source, not just the skill', () =>
    {
      // Arrange- active states can contribute these tags too, which is what makes them reactive.
      const skillSource = { note: 'skill' };
      const stateSource = { note: 'state' };
      getArraysSpy.mockReturnValue([ [ 10, 100, 99 ] ]);
      const action = buildAction({
        subject: () => ({ isStateAffected: () => true }),
        reactiveStateSources: () => [ skillSource, stateSource ],
        applyStates: vi.fn(),
      });

      // Act
      proto.applyOnCastSelfStatesIfAfflicted.call(action);

      // Assert
      expect(getArraysSpy).toHaveBeenCalledWith(skillSource, expect.anything());
      expect(getArraysSpy).toHaveBeenCalledWith(stateSource, expect.anything());
    });
  });

  describe('onCastExecuteSkill dispatch', () =>
  {
    let getArraysSpy;
    let fateSpy;
    let forceMapAction;

    beforeEach(() =>
    {
      getArraysSpy = vi.spyOn(globalThis.RPGManager, 'getArraysFromNotesByRegex');

      // every payload's roll lands unless a test says otherwise; how the roll is made is covered further down.
      fateSpy = vi.spyOn(globalThis.RPGManager, 'fateOf100').mockReturnValue(true);

      forceMapAction = vi.fn();
      globalThis.$jabsEngine = { forceMapAction };
    });

    afterEach(() =>
    {
      getArraysSpy.mockRestore();
      fateSpy.mockRestore();
      delete globalThis.$jabsEngine;
    });

    it('reads the executing skill note for unconditional payloads', () =>
    {
      // Arrange- this tag is skill-scoped rather than reactive, so only the skill's own note counts.
      const skill = { note: 'the skill' };
      getArraysSpy.mockReturnValue([]);
      const action = buildAction({ item: () => skill });

      // Act
      proto.onCastExecuteSkills.call(action);

      // Assert
      expect(getArraysSpy).toHaveBeenCalledWith(skill, expect.anything());
    });

    it('answers with an empty list when the note reader yields nothing', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue(null);
      const action = buildAction();

      // Act
      const result = proto.onCastExecuteSkills.call(action);

      // Assert
      expect(result).toEqual([]);
    });

    it('forces the payload skill when its roll succeeds', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue([ [ 42, 100 ] ]);
      const action = buildAction();
      const caster = { id: 'caster' };

      // Act
      proto.applyOnCastExecuteSkills.call(action, caster);

      // Assert- forced as an independent map action, not folded into the current one.
      expect(forceMapAction).toHaveBeenCalledWith(caster, 42, false);
    });

    it('does not force the payload skill when its roll fails', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue([ [ 42, 5 ] ]);
      fateSpy.mockReturnValue(false);
      const action = buildAction();

      // Act
      proto.applyOnCastExecuteSkills.call(action, {});

      // Assert
      expect(forceMapAction).not.toHaveBeenCalled();
    });

    it('rolls each payload independently so one cast can chain several', () =>
    {
      // Arrange- the first tag fails its roll and the second succeeds.
      getArraysSpy.mockReturnValue([ [ 1, 50 ], [ 2, 50 ] ]);
      fateSpy.mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      const action = buildAction();

      // Act
      proto.applyOnCastExecuteSkills.call(action, {});

      // Assert
      expect(forceMapAction).toHaveBeenCalledTimes(1);
      expect(forceMapAction).toHaveBeenCalledWith({}, 2, false);
    });

    it('does nothing at all when there are no payloads', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue([]);
      const action = buildAction();

      // Act
      proto.applyOnCastExecuteSkills.call(action, {});

      // Assert
      expect(forceMapAction).not.toHaveBeenCalled();
    });

    it('stops a self-referential chain at the nesting limit instead of looping forever', () =>
    {
      // Arrange- a skill whose forced payload is itself. Without the depth guard this recurses until
      // the stack blows; with it, the chain is cut after a bounded number of hops.
      getArraysSpy.mockReturnValue([ [ 42, 100 ] ]);
      const action = buildAction();

      // every forced execution re-enters the dispatcher, exactly as a real cyclic pair of skills
      // would once JABS ran the forced action.
      forceMapAction.mockImplementation(() =>
      {
        proto.applyOnCastExecuteSkills.call(action, {});
      });

      // Act
      proto.applyOnCastExecuteSkills.call(action, {});

      // Assert- bounded rather than unbounded is the property that matters.
      expect(forceMapAction).toHaveBeenCalledTimes(2);
    });

    it('unwinds the depth counter even when a forced execution throws', () =>
    {
      // Arrange- a throw mid-chain must not leave the guard permanently tripped, which would
      // silently disable the feature for the rest of the session.
      getArraysSpy.mockReturnValue([ [ 42, 100 ] ]);
      const action = buildAction();
      forceMapAction.mockImplementationOnce(() =>
      {
        throw new Error('forced action blew up');
      });

      // Act
      expect(() => proto.applyOnCastExecuteSkills.call(action, {})).toThrow('forced action blew up');
      proto.applyOnCastExecuteSkills.call(action, {});

      // Assert- the second dispatch still works, proving the counter was restored.
      expect(forceMapAction).toHaveBeenCalledTimes(2);
    });

    it('reads the executing skill note for state-gated payloads', () =>
    {
      // Arrange
      const skill = { note: 'the skill' };
      getArraysSpy.mockReturnValue([]);
      const action = buildAction({ item: () => skill });

      // Act
      proto.onCastExecuteSkillsIfAfflicted.call(action);

      // Assert
      expect(getArraysSpy).toHaveBeenCalledWith(skill, expect.anything());
    });

    it('answers with an empty list when the state-gated note reader yields nothing', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue(null);
      const action = buildAction();

      // Act
      const result = proto.onCastExecuteSkillsIfAfflicted.call(action);

      // Assert
      expect(result).toEqual([]);
    });

    it('forces a state-gated payload when the caster carries the required state', () =>
    {
      // Arrange- this is what lets one button fire a different follow-up depending on the caster's
      // current state, without rolling the branches that do not apply.
      getArraysSpy.mockReturnValue([ [ 42, 100, 99 ] ]);
      const subject = buildFateBattlerStub({ isStateAffected: stateId => stateId === 99 });
      const action = buildAction({ subject: () => subject });
      const caster = { id: 'caster' };

      // Act
      proto.applyOnCastExecuteSkillsIfAfflicted.call(action, caster);

      // Assert- the requirement slot is dropped before dispatch, and the caster rolls the payload itself.
      expect(fateSpy).toHaveBeenCalledWith(subject, 100, 1, 0);
      expect(forceMapAction).toHaveBeenCalledWith(caster, 42, false);
    });

    it('skips a state-gated payload when the required state is absent', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue([ [ 42, 100, 99 ] ]);
      const action = buildAction({ subject: () => buildFateBattlerStub({ isStateAffected: () => false }) });

      // Act
      proto.applyOnCastExecuteSkillsIfAfflicted.call(action, {});

      // Assert- no roll is even attempted for a branch that does not apply.
      expect(fateSpy).not.toHaveBeenCalled();
      expect(forceMapAction).not.toHaveBeenCalled();
    });

    it('selects only the qualifying branch out of several gated payloads', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue([ [ 1, 100, 10 ], [ 2, 100, 20 ], [ 3, 100, 30 ] ]);
      const subject = buildFateBattlerStub({ isStateAffected: stateId => stateId === 20 });
      const action = buildAction({ subject: () => subject });

      // Act
      proto.applyOnCastExecuteSkillsIfAfflicted.call(action, {});

      // Assert
      expect(forceMapAction).toHaveBeenCalledTimes(1);
      expect(forceMapAction).toHaveBeenCalledWith({}, 2, false);
    });
  });

  describe('rollOnCastExecuteSkill', () =>
  {
    let getArraysSpy;
    let fateSpy;
    let forceMapAction;

    beforeEach(() =>
    {
      getArraysSpy = vi.spyOn(globalThis.RPGManager, 'getArraysFromNotesByRegex');

      // watch every roll without answering it, so the caster's real fate and the real dice decide.
      fateSpy = vi.spyOn(globalThis.RPGManager, 'fateOf100');

      forceMapAction = vi.fn();
      globalThis.$jabsEngine = { forceMapAction };
    });

    afterEach(() =>
    {
      getArraysSpy.mockRestore();
      fateSpy.mockRestore();
      delete globalThis.$jabsEngine;
    });

    it('rolls a mid chance once, by the caster, with its own lucky and cursed rolls for the skill being cast', () =>
    {
      // Arrange- the caster carries 2 lucky rolls and 1 curse with this skill, 50 of each with any other, and 7 and 9
      // battler-wide, so a roll reading the wrong skill or the battler-wide totals alone shows in the counts.
      getArraysSpy.mockReturnValue([ [ 42, 40 ] ]);
      fateSpy.mockReturnValue(false);
      const skill = { id: 30, note: '' };
      const caster = buildFateBattlerStub({
        getPositiveRolls: () => 7,
        getNegativeRolls: () => 9,
        getPositiveRollsForSkill: rolledWith => (rolledWith === skill ? 2 : 50),
        getNegativeRollsForSkill: rolledWith => (rolledWith === skill ? 1 : 50),
      });
      const action = buildAction({ subject: () => caster, item: () => skill });

      // Act
      proto.applyOnCastExecuteSkills.call(action, { id: 'caster' });

      // Assert- the authored 40 as it stands, the caster's one chance plus its 2 lucky rolls, and its 1 curse.
      expect(fateSpy.mock.calls).toEqual([ [ caster, 40, 3, 1 ] ]);
      expect(forceMapAction).not.toHaveBeenCalled();
    });

    it('never executes a sure payload for a very cursed caster, while a sibling caster without the curse does', () =>
    {
      // Arrange- the same 100% payload cast by two casters; only <veryCursed> sets the first apart.
      getArraysSpy.mockReturnValue([ [ 42, 100 ] ]);
      const cursedCaster = buildFateBattlerStub({ isVeryCursed: () => true });
      const openCaster = buildFateBattlerStub();
      const cursedAction = buildAction({ subject: () => cursedCaster });
      const openAction = buildAction({ subject: () => openCaster });
      const cursedJabs = { id: 'cursed' };
      const openJabs = { id: 'open' };

      // Act
      proto.applyOnCastExecuteSkills.call(cursedAction, cursedJabs);
      proto.applyOnCastExecuteSkills.call(openAction, openJabs);

      // Assert
      expect(forceMapAction.mock.calls).toEqual([ [ openJabs, 42, false ] ]);
    });

    it('executes a payload no chance could land for a very lucky caster, once, whatever Accumulate and Encore say', () =>
    {
      // Arrange- a 0% payload cast by two casters; only <veryLucky> sets the first apart. It also rolls in Accumulate
      // Mode with 3 lucky rolls and 2 Encore repeats, which would land a repeatable action 12 times.
      getArraysSpy.mockReturnValue([ [ 42, 0 ] ]);
      const luckyCaster = buildFateBattlerStub({
        isVeryLucky: () => true,
        isAccumulating: () => true,
        getEncoreRepeats: () => 2,
        getPositiveRollsForSkill: () => 3,
      });
      const plainCaster = buildFateBattlerStub();
      const luckyAction = buildAction({ subject: () => luckyCaster });
      const plainAction = buildAction({ subject: () => plainCaster });
      const luckyJabs = { id: 'lucky' };
      const plainJabs = { id: 'plain' };

      // Act
      proto.applyOnCastExecuteSkills.call(luckyAction, luckyJabs);
      proto.applyOnCastExecuteSkills.call(plainAction, plainJabs);

      // Assert- the lucky caster's payload executes exactly once, and the 0% chance alone stops the other.
      expect(forceMapAction.mock.calls).toEqual([ [ luckyJabs, 42, false ] ]);
    });
  });

  describe('bulk state operations', () =>
  {
    it('does nothing when asked to lose an empty set of states', () =>
    {
      // Arrange- the early return avoids touching the subject at all, which matters because callers
      // routinely pass the empty result of a note lookup.
      const subject = vi.fn();
      const action = buildAction({ subject });

      // Act
      proto.loseStates.call(action, {}, []);

      // Assert
      expect(subject).not.toHaveBeenCalled();
    });

    it('does nothing when asked to strip an empty set of states', () =>
    {
      // Arrange
      const subject = vi.fn();
      const action = buildAction({ subject });

      // Act
      proto.stripStates.call(action, {}, []);

      // Assert
      expect(subject).not.toHaveBeenCalled();
    });

    it('does nothing when asked to apply an empty set of states, never resolving the caster or its skill', () =>
    {
      // Arrange- every on-hit and on-cast self-state family hands its note lookup straight here, empty or not.
      const subject = vi.fn();
      const item = vi.fn();
      const target = { addState: vi.fn() };
      const action = buildAction({ subject, item });

      // Act
      proto.applyStates.call(action, target, []);

      // Assert
      expect(subject).not.toHaveBeenCalled();
      expect(item).not.toHaveBeenCalled();
      expect(target.addState).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/extend/core/objects/game-action-cast-effects.test.js
