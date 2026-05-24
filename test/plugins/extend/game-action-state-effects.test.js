//region plugins/extend/game-action-state-effects.test.js
import vm from 'node:vm';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { loadSkillExtendPluginVm } from './extend-vm.js';
import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';

describe('J-SkillExtend Game_Action state effects (out/extend/J-SkillExtend.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadSkillExtendPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
    sandbox.J.ABS = null;
  });

  /**
   * Builds a skill row with the given note.
   * @param {string} note The note to assign to the skill.
   * @returns {RPG_Skill}
   */
  function buildSkill(note)
  {
    return vm.runInContext(`
      (() =>
      {
        const skill = Object.create(RPG_Skill.prototype);
        skill.id = 1;
        skill.note = ${JSON.stringify(note)};
        return skill;
      })()
    `, sandbox);
  }

  /**
   * Builds a state row with the given note.
   * @param {string} note The note to assign to the state.
   * @returns {RPG_State}
   */
  function buildState(note)
  {
    return vm.runInContext(`
      (() =>
      {
        const state = Object.create(RPG_State.prototype);
        state.id = 1;
        state.note = ${JSON.stringify(note)};
        return state;
      })()
    `, sandbox);
  }

  /**
   * Builds a battler-like object for exercising state hooks.
   * @param {RPG_State[]} states The active states on this battler.
   * @returns {object}
   */
  function buildBattler(states = [])
  {
    return {
      __addedStates: [],
      __decrementedStates: [],
      __removedStates: [],
      allStates()
      {
        return states;
      },
      addState(stateId)
      {
        this.__addedStates.push(stateId);
      },
      decrementStateStacks(stateId, stacksRemoved = 1)
      {
        this.__decrementedStates.push({ stateId, stacksRemoved });
      },
      removeState(stateId)
      {
        this.__removedStates.push(stateId);
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
      result()
      {
        return result;
      },
      addState(stateId)
      {
        this.__addedStates.push(stateId);
      },
      decrementStateStacks(stateId, stacksRemoved = 1)
      {
        this.__decrementedStates.push({ stateId, stacksRemoved });
      },
      removeState(stateId)
      {
        this.__removedStates.push(stateId);
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
    const action = new sandbox.Game_Action();
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
    sandbox.J.ABS = {};

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

  it('applies all on-cast state effect types through applyItemUserEffect', () =>
  {
    // emulate the presence of JABS so lose-state effects consume stacks.
    sandbox.J.ABS = {};

    // define the skill and passive state contributions to the on-cast behavior.
    const skill = buildSkill('<onCastSelfState:[11,100]>\n<onCastLoseState:[12,100]>\n<onCastStripState:[13,100]>\n<onCastRemoveState:[14,100]>');
    const passiveState = buildState('<onCastSelfState:[15,100]>\n<onCastLoseState:[16,100]>\n<onCastStripState:[17,100]>\n<onCastRemoveState:[18,100]>');

    // build the action participants.
    const caster = buildBattler([ passiveState ]);
    const target = buildTarget(true);
    const action = buildAction(caster, skill);

    // execute the on-cast flow through the aliased user-effect entrypoint.
    action.applyItemUserEffect(target);

    // confirm both the skill and state sources contributed their effects.
    expect(caster.__addedStates).toEqual([ 11, 15 ]);
    expect(caster.__decrementedStates).toEqual([
      { stateId: 12, stacksRemoved: 1 },
      { stateId: 16, stacksRemoved: 1 },
    ]);
    expect(caster.__removedStates).toEqual([]);
    expect(target.__decrementedStates).toEqual([
      { stateId: 13, stacksRemoved: 1 },
      { stateId: 17, stacksRemoved: 1 },
    ]);
    expect(target.__removedStates).toEqual([ 14, 18 ]);
  });

  it('respects zero-percent on-hit state effects across all effect types', () =>
  {
    // emulate the presence of JABS so lose-state effects would consume stacks if triggered.
    sandbox.J.ABS = {};

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
    sandbox.J.ABS = {};

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

    // execute both lose-state paths.
    action.apply(target);
    action.applyItemUserEffect(target);

    // confirm the lose-state effects fell back to normal removal.
    expect(caster.__decrementedStates).toEqual([]);
    expect(caster.__removedStates).toEqual([ 41, 42 ]);
    expect(target.__decrementedStates).toEqual([]);
    expect(target.__removedStates).toEqual([ 43, 44 ]);
  });
});
//endregion plugins/extend/game-action-state-effects.test.js
