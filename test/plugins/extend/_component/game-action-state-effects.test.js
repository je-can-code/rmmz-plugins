//region plugins/extend/_component/game-action-state-effects.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installExtendHostGlobals, setPluginContextToJBase, setPluginContextToJExtend } from './fixtures/install-extend-host-globals.js';

describe('J-SkillExtend Game_Action state effects (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/_base/database/implementations/RPG_Skill.js').default} */
  let RPG_Skill;

  /** @type {typeof import('../../../../src/plugins/_base/database/implementations/RPG_State.js').default} */
  let RPG_State;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.JCache } = await import('../../../../src/plugins/_base/core/JCache.js'));
    ({ default: RPG_Skill } = await import('../../../../src/plugins/_base/database/implementations/RPG_Skill.js'));
    ({ default: RPG_State } = await import('../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    setPluginContextToJExtend();
    await import('../../../../src/plugins/extend/core/_metadata/initialization.js');

    // applyOnHitApplyStates instantiates this as a bare global; a minimal stand-in is enough
    // since only the constructor args (duration, stacks) matter to the tests below.
    function JABS_StateOverrides(duration, stacks)
    {
      this.duration = duration;
      this.stacks = stacks;
    }

    globalThis.JABS_StateOverrides = JABS_StateOverrides;

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../src/plugins/extend/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    globalThis.J.ABS = null;
  });

  /**
   * Builds a skill row with the given note.
   * @param {string} note The note to assign to the skill.
   * @returns {RPG_Skill}
   */
  function buildSkill(note)
  {
    const skill = Object.create(RPG_Skill.prototype);
    skill.id = 1;
    skill.note = note;
    return skill;
  }

  /**
   * Builds a state row with the given note.
   * @param {string} note The note to assign to the state.
   * @returns {RPG_State}
   */
  function buildState(note)
  {
    const state = Object.create(RPG_State.prototype);
    state.id = 1;
    state.note = note;
    return state;
  }

  /**
   * Builds a battler-like object for exercising state hooks.
   * @param {RPG_State[]} states The active states on this battler.
   * @returns {object}
   */
  function buildBattler(states = [], affectedStateIds = [], allNotes = [])
  {
    return {
      __addedStates: [],
      __decrementedStates: [],
      __removedStates: [],
      __affectedStateIds: [ ...affectedStateIds ],
      allStates()
      {
        return states;
      },
      getAllNotes()
      {
        return allNotes;
      },
      isStateAffected(stateId)
      {
        return this.__affectedStateIds.includes(stateId);
      },
      addState(stateId)
      {
        this.__addedStates.push(stateId);
        this.__affectedStateIds.push(stateId);
      },
      decrementStateStacks(stateId, stacksRemoved = 1)
      {
        this.__decrementedStates.push({ stateId, stacksRemoved });
      },
      removeState(stateId)
      {
        this.__removedStates.push(stateId);
        this.__affectedStateIds = this.__affectedStateIds.filter(id => id !== stateId);
      },
      getPositiveRollsForSkill()
      {
        return 0;
      },
      getNegativeRolls()
      {
        return 0;
      },
      getNegativeRollsForSkill()
      {
        return 0;
      },
      isVeryLucky()
      {
        return false;
      },
      isVeryCursed()
      {
        return false;
      },
      isAccumulating()
      {
        return false;
      },
      getEncoreRepeats()
      {
        return 0;
      },
    };
  }

  /**
   * Builds a target-like object with a configurable hit result.
   * @param {boolean} hit Whether or not this target was hit.
   * @returns {object}
   */
  function buildTarget(hit = true)
  {
    const result = {
      parried: hit === false,
      isHit()
      {
        return hit;
      },
    };

    return {
      __addedStates: [],
      __decrementedStates: [],
      __removedStates: [],
      __addedStatesWithOverrides: [],
      result()
      {
        return result;
      },
      addState(stateId)
      {
        this.__addedStates.push(stateId);
      },
      addStateWithOverrides(stateId, attacker, overrides)
      {
        this.__addedStatesWithOverrides.push({ stateId, attacker, overrides });
      },
      decrementStateStacks(stateId, stacksRemoved = 1)
      {
        this.__decrementedStates.push({ stateId, stacksRemoved });
      },
      removeState(stateId)
      {
        this.__removedStates.push(stateId);
      },
      getPositiveRollsForSkill()
      {
        return 0;
      },
      getNegativeRolls()
      {
        return 0;
      },
      getNegativeRollsForSkill()
      {
        return 0;
      },
      isVeryLucky()
      {
        return false;
      },
      isVeryCursed()
      {
        return false;
      },
      isAccumulating()
      {
        return false;
      },
      getEncoreRepeats()
      {
        return 0;
      },
    };
  }

  /**
   * Builds an action with the given caster and skill.
   * @param {object} caster The battler executing the action.
   * @param {RPG_Skill} skill The skill to assign to the action.
   * @returns {Game_Action}
   */
  function buildAction(caster, skill)
  {
    const action = new globalThis.Game_Action();
    action.subject = function()
    {
      return caster;
    };

    action.setItemObject(skill);
    return action;
  }

  it('applies all on-hit state effect types when the action lands', () =>
  {
    // emulate the presence of JABS so lose-state effects consume stacks.
    globalThis.J.ABS = {};

    // define the skill and passive state contributions to the on-hit behavior.
    const skill = buildSkill('<onHitSelfState:[3,100]>\n<onHitLoseState:[4,100]>\n<onHitStripState:[5,100]>\n<onHitRemoveState:[6,100]>');
    const passiveState = buildState('<onHitSelfState:[7,100]>\n<onHitLoseState:[8,100]>\n<onHitStripState:[9,100]>\n<onHitRemoveState:[10,100]>');

    // build the action participants.
    const caster = buildBattler([ passiveState ]);
    const target = buildTarget(true);
    const action = buildAction(caster, skill);

    // execute the on-hit flow through the aliased apply entrypoint.
    action.apply(target);

    // confirm both the skill and state sources contributed their effects.
    expect(caster.__addedStates).toEqual([ 3, 7 ]);
    expect(caster.__decrementedStates).toEqual([
      { stateId: 4, stacksRemoved: 1 },
      { stateId: 8, stacksRemoved: 1 },
    ]);
    expect(caster.__removedStates).toEqual([]);
    expect(target.__decrementedStates).toEqual([
      { stateId: 5, stacksRemoved: 1 },
      { stateId: 9, stacksRemoved: 1 },
    ]);
    expect(target.__removedStates).toEqual([ 6, 10 ]);
  });

  it('skips all on-hit state effects when the action does not land', () =>
  {
    // define on-hit effects that would fire if the action connected.
    const skill = buildSkill('<onHitSelfState:[3,100]>\n<onHitLoseState:[4,100]>\n<onHitStripState:[5,100]>\n<onHitRemoveState:[6,100]>');
    const passiveState = buildState('<onHitSelfState:[7,100]>\n<onHitLoseState:[8,100]>\n<onHitStripState:[9,100]>\n<onHitRemoveState:[10,100]>');

    // simulate an avoided or parried result by reporting no hit.
    const caster = buildBattler([ passiveState ]);
    const target = buildTarget(false);
    const action = buildAction(caster, skill);

    // execute the on-hit flow.
    action.apply(target);

    // confirm none of the on-hit effects resolved.
    expect(caster.__addedStates).toEqual([]);
    expect(caster.__decrementedStates).toEqual([]);
    expect(caster.__removedStates).toEqual([]);
    expect(target.__decrementedStates).toEqual([]);
    expect(target.__removedStates).toEqual([]);
  });

  it('applies target-facing on-cast state effects through applyItemUserEffect', () =>
  {
    // emulate the presence of JABS so lose-state effects consume stacks.
    globalThis.J.ABS = {};

    // define the skill and passive state contributions; only strip/remove target the opponent.
    const skill = buildSkill('<onCastStripState:[13,100]>\n<onCastRemoveState:[14,100]>');
    const passiveState = buildState('<onCastStripState:[17,100]>\n<onCastRemoveState:[18,100]>');

    // build the action participants.
    const caster = buildBattler([ passiveState ]);
    const target = buildTarget(true);
    const action = buildAction(caster, skill);

    // execute the on-cast flow through the aliased user-effect entrypoint.
    action.applyItemUserEffect(target);

    // caster is unaffected; only target-facing effects fire here.
    expect(caster.__addedStates).toEqual([]);
    expect(caster.__decrementedStates).toEqual([]);
    expect(caster.__removedStates).toEqual([]);
    expect(target.__decrementedStates).toEqual([
      { stateId: 13, stacksRemoved: 1 },
      { stateId: 17, stacksRemoved: 1 },
    ]);
    expect(target.__removedStates).toEqual([ 14, 18 ]);
  });

  it('applies caster-facing on-cast state effects through applyOnCastSelfStates and applyOnCastLoseStates', () =>
  {
    // emulate the presence of JABS so lose-state effects consume stacks.
    globalThis.J.ABS = {};

    // define the skill and passive state contributions; self/lose target the caster.
    const skill = buildSkill('<onCastSelfState:[11,100]>\n<onCastLoseState:[12,100]>');
    const passiveState = buildState('<onCastSelfState:[15,100]>\n<onCastLoseState:[16,100]>');

    // build the action participants.
    const caster = buildBattler([ passiveState ]);
    const target = buildTarget(true);
    const action = buildAction(caster, skill);

    // these are now called at press-time by JABS_Engine.handleOnCastStateEffects, not per hit.
    action.applyOnCastSelfStates();
    action.applyOnCastLoseStates();

    // confirm both the skill and state sources contributed their effects.
    expect(caster.__addedStates).toEqual([ 11, 15 ]);
    expect(caster.__decrementedStates).toEqual([
      { stateId: 12, stacksRemoved: 1 },
      { stateId: 16, stacksRemoved: 1 },
    ]);
    expect(caster.__removedStates).toEqual([]);
    expect(target.__addedStates).toEqual([]);
    expect(target.__decrementedStates).toEqual([]);
    expect(target.__removedStates).toEqual([]);
  });

  it('respects zero-percent on-hit state effects across all effect types', () =>
  {
    // emulate the presence of JABS so lose-state effects would consume stacks if triggered.
    globalThis.J.ABS = {};

    // define on-hit effects that should never trigger.
    const skill = buildSkill('<onHitSelfState:[21,0]>\n<onHitLoseState:[22,0]>\n<onHitStripState:[23,0]>\n<onHitRemoveState:[24,0]>');
    const passiveState = buildState('<onHitSelfState:[25,0]>\n<onHitLoseState:[26,0]>\n<onHitStripState:[27,0]>\n<onHitRemoveState:[28,0]>');

    // build the action participants.
    const caster = buildBattler([ passiveState ]);
    const target = buildTarget(true);
    const action = buildAction(caster, skill);

    // execute the on-hit flow.
    action.apply(target);

    // confirm the effect rolls were honored.
    expect(caster.__addedStates).toEqual([]);
    expect(caster.__decrementedStates).toEqual([]);
    expect(caster.__removedStates).toEqual([]);
    expect(target.__decrementedStates).toEqual([]);
    expect(target.__removedStates).toEqual([]);
  });

  it('respects zero-percent on-cast state effects across all effect types', () =>
  {
    // emulate the presence of JABS so lose-state effects would consume stacks if triggered.
    globalThis.J.ABS = {};

    // define on-cast effects that should never trigger.
    const skill = buildSkill('<onCastSelfState:[31,0]>\n<onCastLoseState:[32,0]>\n<onCastStripState:[33,0]>\n<onCastRemoveState:[34,0]>');
    const passiveState = buildState('<onCastSelfState:[35,0]>\n<onCastLoseState:[36,0]>\n<onCastStripState:[37,0]>\n<onCastRemoveState:[38,0]>');

    // build the action participants.
    const caster = buildBattler([ passiveState ]);
    const target = buildTarget(true);
    const action = buildAction(caster, skill);

    // execute the on-cast flow.
    action.applyItemUserEffect(target);

    // confirm the effect rolls were honored.
    expect(caster.__addedStates).toEqual([]);
    expect(caster.__decrementedStates).toEqual([]);
    expect(caster.__removedStates).toEqual([]);
    expect(target.__decrementedStates).toEqual([]);
    expect(target.__removedStates).toEqual([]);
  });

  it('falls back to normal state removal for lose-state effects without JABS', () =>
  {
    // define lose/strip-state effects without enabling the JABS namespace.
    const skill = buildSkill('<onHitLoseState:[41,100]>\n<onCastLoseState:[42,100]>\n<onHitStripState:[43,100]>\n<onCastStripState:[44,100]>');

    // build the action participants.
    const caster = buildBattler();
    const target = buildTarget(true);
    const action = buildAction(caster, skill);

    // execute the on-hit path (onHitLoseState and onHitStripState).
    action.apply(target);
    // execute the target-facing on-cast path (onCastStripState).
    action.applyItemUserEffect(target);
    // execute the caster-facing on-cast path (onCastLoseState); now called at press-time by JABS_Engine.
    action.applyOnCastLoseStates();

    // confirm the lose-state effects fell back to normal removal.
    expect(caster.__decrementedStates).toEqual([]);
    expect(caster.__removedStates).toEqual([ 41, 42 ]);
    expect(target.__decrementedStates).toEqual([]);
    expect(target.__removedStates).toEqual([ 43, 44 ]);
  });

  describe('applyOnHitApplyStates', () =>
  {
    it('applies a caster-wide <applyState:[...]> tag to the target', () =>
    {
      // define a caster-wide applyState tag on one of the caster's note sources (e.g. an equip).
      const casterEquipNote = { note: '<applyState:[12, 100, 600]>' };
      const caster = buildBattler([], [], [ casterEquipNote ]);
      const skill = buildSkill('');
      const target = buildTarget(true);
      const action = buildAction(caster, skill);

      // execute the on-hit apply-state flow directly.
      action.applyOnHitApplyStates(target);

      // confirm the state applied to the target with the tag's duration/stacks overrides.
      expect(target.__addedStatesWithOverrides).toHaveLength(1);
      const [ applied ] = target.__addedStatesWithOverrides;
      expect(applied.stateId).toBe(12);
      expect(applied.overrides.duration).toBe(600);
      expect(applied.overrides.stacks).toBeNull();
    });

    it('applies a skill-scoped <thisApplyState:[...]> tag to the target', () =>
    {
      // define a skill-scoped thisApplyState tag on the executing skill only.
      const caster = buildBattler();
      const skill = buildSkill('<thisApplyState:[13, 100, 300, 2]>');
      const target = buildTarget(true);
      const action = buildAction(caster, skill);

      // execute the on-hit apply-state flow directly.
      action.applyOnHitApplyStates(target);

      // confirm the state applied with both the duration and stacks overrides.
      expect(target.__addedStatesWithOverrides).toHaveLength(1);
      const [ applied ] = target.__addedStatesWithOverrides;
      expect(applied.stateId).toBe(13);
      expect(applied.overrides.duration).toBe(300);
      expect(applied.overrides.stacks).toBe(2);
    });

    it('does not apply when the chance roll is 0%', () =>
    {
      // define a caster-wide applyState tag with a 0% chance.
      const casterEquipNote = { note: '<applyState:[12, 0, 600]>' };
      const caster = buildBattler([], [], [ casterEquipNote ]);
      const skill = buildSkill('');
      const target = buildTarget(true);
      const action = buildAction(caster, skill);

      // execute the on-hit apply-state flow directly.
      action.applyOnHitApplyStates(target);

      // confirm nothing applied.
      expect(target.__addedStatesWithOverrides).toEqual([]);
    });

    it('parses a 0-sentinel DURATION alongside an explicit STACKS value', () =>
    {
      // 0 means "no duration override"- this is what lets an author set STACKS
      // without being forced to also hardcode a duration on the tag.
      const casterEquipNote = { note: '<applyState:[12, 100, 0, 3]>' };
      const caster = buildBattler([], [], [ casterEquipNote ]);
      const skill = buildSkill('');
      const target = buildTarget(true);
      const action = buildAction(caster, skill);

      // execute the on-hit apply-state flow directly.
      action.applyOnHitApplyStates(target);

      // confirm the tuple parsed through with duration 0 and stacks 3.
      expect(target.__addedStatesWithOverrides).toHaveLength(1);
      const [ applied ] = target.__addedStatesWithOverrides;
      expect(applied.overrides.duration).toBe(0);
      expect(applied.overrides.stacks).toBe(3);
    });

    it('parses a -1-sentinel DURATION on a caster-wide <applyState:[...]> tag', () =>
    {
      // -1 means "force indefinite"- the regex must accept a leading minus sign here.
      const casterEquipNote = { note: '<applyState:[12, 100, -1]>' };
      const caster = buildBattler([], [], [ casterEquipNote ]);
      const skill = buildSkill('');
      const target = buildTarget(true);
      const action = buildAction(caster, skill);

      // execute the on-hit apply-state flow directly.
      action.applyOnHitApplyStates(target);

      // confirm the negative sentinel parsed through intact.
      expect(target.__addedStatesWithOverrides).toHaveLength(1);
      const [ applied ] = target.__addedStatesWithOverrides;
      expect(applied.overrides.duration).toBe(-1);
      expect(applied.overrides.stacks).toBeNull();
    });

    it('parses a -1-sentinel DURATION on a skill-scoped <thisApplyState:[...]> tag', () =>
    {
      const caster = buildBattler();
      const skill = buildSkill('<thisApplyState:[13, 100, -1, 2]>');
      const target = buildTarget(true);
      const action = buildAction(caster, skill);

      // execute the on-hit apply-state flow directly.
      action.applyOnHitApplyStates(target);

      // confirm the negative sentinel and trailing stacks both parsed through.
      expect(target.__addedStatesWithOverrides).toHaveLength(1);
      const [ applied ] = target.__addedStatesWithOverrides;
      expect(applied.overrides.duration).toBe(-1);
      expect(applied.overrides.stacks).toBe(2);
    });
  });

  describe('applyToggleOnExecuteStates', () =>
  {
    it('adds a tagged state the caster does not have', () =>
    {
      // define a skill toggling a state the caster lacks.
      const skill = buildSkill('<toggleOnExecute:12>');

      // build the action participants; caster has no states.
      const caster = buildBattler();
      const action = buildAction(caster, skill);

      // execute the toggle.
      action.applyToggleOnExecuteStates();

      // confirm the state was added, not removed.
      expect(caster.__addedStates).toEqual([ 12 ]);
      expect(caster.__removedStates).toEqual([]);
    });

    it('removes a tagged state the caster already has', () =>
    {
      // define a skill toggling a state the caster already carries.
      const skill = buildSkill('<toggleOnExecute:12>');

      // build the action participants; caster already has state 12 active.
      const caster = buildBattler([], [ 12 ]);
      const action = buildAction(caster, skill);

      // execute the toggle.
      action.applyToggleOnExecuteStates();

      // confirm the state was removed, not added.
      expect(caster.__addedStates).toEqual([]);
      expect(caster.__removedStates).toEqual([ 12 ]);
    });

    it('toggles multiple tagged states independently in one execution', () =>
    {
      // define a skill with two independent scalar toggles.
      const skill = buildSkill('<toggleOnExecute:12>\n<toggleOnExecute:13>');

      // caster has state 12 (will be removed) but not 13 (will be added).
      const caster = buildBattler([], [ 12 ]);
      const action = buildAction(caster, skill);

      // execute the toggle.
      action.applyToggleOnExecuteStates();

      // confirm each state id was resolved independently of the other.
      expect(caster.__addedStates).toEqual([ 13 ]);
      expect(caster.__removedStates).toEqual([ 12 ]);
    });
  });

  describe('applyToggleGroupOnExecuteStates', () =>
  {
    it('activates the first entry when none of the group is active', () =>
    {
      // define a two-state cycle group; caster starts with neither.
      const skill = buildSkill('<toggleGroupOnExecute:[12, 13]>');
      const caster = buildBattler();
      const action = buildAction(caster, skill);

      // execute the cycle.
      action.applyToggleGroupOnExecuteStates();

      // confirm the first entry in the group was activated.
      expect(caster.__addedStates).toEqual([ 12 ]);
      expect(caster.__removedStates).toEqual([]);
    });

    it('advances from the active entry to the next one in the list', () =>
    {
      // define a two-state cycle group; caster currently has the first entry active.
      const skill = buildSkill('<toggleGroupOnExecute:[12, 13]>');
      const caster = buildBattler([], [ 12 ]);
      const action = buildAction(caster, skill);

      // execute the cycle.
      action.applyToggleGroupOnExecuteStates();

      // confirm the swap: 12 removed, 13 added.
      expect(caster.__removedStates).toEqual([ 12 ]);
      expect(caster.__addedStates).toEqual([ 13 ]);
    });

    it('wraps back to the first entry after the last one in a longer cycle', () =>
    {
      // define a three-state cycle group; caster currently has the last entry active.
      const skill = buildSkill('<toggleGroupOnExecute:[12, 13, 14]>');
      const caster = buildBattler([], [ 14 ]);
      const action = buildAction(caster, skill);

      // execute the cycle.
      action.applyToggleGroupOnExecuteStates();

      // confirm the wrap: 14 removed, 12 (the first entry) added.
      expect(caster.__removedStates).toEqual([ 14 ]);
      expect(caster.__addedStates).toEqual([ 12 ]);
    });

    it('resyncs to the first entry when more than one group member is active at once', () =>
    {
      // define a three-state cycle group; caster has drifted into two active members at once.
      const skill = buildSkill('<toggleGroupOnExecute:[12, 13, 14]>');
      const caster = buildBattler([], [ 13, 14 ]);
      const action = buildAction(caster, skill);

      // execute the cycle.
      action.applyToggleGroupOnExecuteStates();

      // confirm the repair: both stray actives removed, first entry added.
      expect(caster.__removedStates).toEqual([ 13, 14 ]);
      expect(caster.__addedStates).toEqual([ 12 ]);
    });

    it('cycles multiple independent groups in one execution', () =>
    {
      // define two independent cycle groups on the same skill.
      const skill = buildSkill('<toggleGroupOnExecute:[12, 13]>\n<toggleGroupOnExecute:[20, 21]>');

      // caster has the first entry of each group active.
      const caster = buildBattler([], [ 12, 20 ]);
      const action = buildAction(caster, skill);

      // execute both cycles.
      action.applyToggleGroupOnExecuteStates();

      // confirm each group advanced independently of the other.
      expect(caster.__removedStates).toEqual([ 12, 20 ]);
      expect(caster.__addedStates).toEqual([ 13, 21 ]);
    });
  });
});
//endregion plugins/extend/_component/game-action-state-effects.test.js
