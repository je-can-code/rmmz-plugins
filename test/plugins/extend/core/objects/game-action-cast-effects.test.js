//region plugins/extend/core/objects/game-action-cast-effects.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installExtendHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJExtend,
} from '../../_component/fixtures/install-extend-host-globals.js';

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
   * Builds an action stand-in with a caster and an executing skill.
   * @param {object} [overrides] Members to replace.
   * @returns {object}
   */
  const buildAction = (overrides = {}) => Object.assign(Object.create(proto), {
    _item: { setObject: vi.fn(), object: () => null },
    subject: () => ({ isStateAffected: () => false }),
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
      // extension overlays, which is the open question flagged there.
      const action = buildAction();
      const item = { id: 3 };

      // Act
      proto.setItemObject.call(action, item);

      // Assert
      expect(action._item.setObject).toHaveBeenCalledWith(item);
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
    let chanceSpy;
    let forceMapAction;

    beforeEach(() =>
    {
      getArraysSpy = vi.spyOn(globalThis.RPGManager, 'getArraysFromNotesByRegex');
      chanceSpy = vi.spyOn(globalThis.RPGManager, 'chanceIn100').mockReturnValue(true);

      forceMapAction = vi.fn();
      globalThis.$jabsEngine = { forceMapAction };
    });

    afterEach(() =>
    {
      getArraysSpy.mockRestore();
      chanceSpy.mockRestore();
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
      chanceSpy.mockReturnValue(false);
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
      chanceSpy.mockReturnValueOnce(false)
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
      const action = buildAction({ subject: () => ({ isStateAffected: stateId => stateId === 99 }) });
      const caster = { id: 'caster' };

      // Act
      proto.applyOnCastExecuteSkillsIfAfflicted.call(action, caster);

      // Assert- the requirement slot is dropped before dispatch.
      expect(forceMapAction).toHaveBeenCalledWith(caster, 42, false);
    });

    it('skips a state-gated payload when the required state is absent', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue([ [ 42, 100, 99 ] ]);
      const action = buildAction({ subject: () => ({ isStateAffected: () => false }) });

      // Act
      proto.applyOnCastExecuteSkillsIfAfflicted.call(action, {});

      // Assert- no roll is even attempted for a branch that does not apply.
      expect(forceMapAction).not.toHaveBeenCalled();
    });

    it('selects only the qualifying branch out of several gated payloads', () =>
    {
      // Arrange
      getArraysSpy.mockReturnValue([ [ 1, 100, 10 ], [ 2, 100, 20 ], [ 3, 100, 30 ] ]);
      const action = buildAction({ subject: () => ({ isStateAffected: stateId => stateId === 20 }) });

      // Act
      proto.applyOnCastExecuteSkillsIfAfflicted.call(action, {});

      // Assert
      expect(forceMapAction).toHaveBeenCalledTimes(1);
      expect(forceMapAction).toHaveBeenCalledWith({}, 2, false);
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
  });
});
//endregion plugins/extend/core/objects/game-action-cast-effects.test.js
