//region plugins/extend/_component/game-action-state-effects.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { installExtendHostGlobals, setPluginContextToJBase, setPluginContextToJExtend } from './fixtures/install-extend-host-globals.js';
import { buildFateBattlerStub } from '../../_base/core/_component/fixtures/install-jabs-fate.js';

describe('J-SkillExtend Game_Action state effects (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js').default} */
  let RPG_Skill;

  /** @type {typeof import('../../../../src/plugins/_base/core/database/implementations/RPG_State.js').default} */
  let RPG_State;

  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.JCache } = await import('../../../../src/plugins/_base/core/core/JCache.js'));
    ({ default: RPG_Skill } = await import('../../../../src/plugins/_base/core/database/implementations/RPG_Skill.js'));
    ({ default: RPG_State } = await import('../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));

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
    // J-Base owns the rawItem() accessor extend's Game_Action reads through.
    await import('../../../../src/plugins/_base/core/objects/Game_Action.js');

    await import('../../../../src/plugins/extend/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
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
   * Builds a battler-like object for exercising state hooks. It carries every primitive the shared state roll reads,
   * each neutral unless replaced: no luck gap, no resistance, no lucky or cursed rolls, no fate overrides.
   * @param {RPG_State[]} states The active states on this battler.
   * @param {number[]} affectedStateIds The states this battler starts out carrying.
   * @param {object[]} allNotes The note sources a caster-wide tag is read from.
   * @param {object} [members] Roll primitives to replace, by name.
   * @returns {object}
   */
  function buildBattler(states = [], affectedStateIds = [], allNotes = [], members = {})
  {
    return buildFateBattlerStub({
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
      ...members,
    });
  }

  /**
   * Builds a target-like object with a configurable hit result. It carries every primitive the shared state roll
   * reads, each neutral unless replaced.
   * @param {boolean} hit Whether or not this target was hit.
   * @param {object} [members] Roll primitives to replace, by name.
   * @returns {object}
   */
  function buildTarget(hit = true, members = {})
  {
    const result = {
      parried: hit === false,
      isHit()
      {
        return hit;
      },
    };

    return buildFateBattlerStub({
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
      addStateWithOverrides(stateId, attacker, overrides, sourceSkill)
      {
        this.__addedStatesWithOverrides.push({ stateId, attacker, overrides, sourceSkill });
      },
      decrementStateStacks(stateId, stacksRemoved = 1)
      {
        this.__decrementedStates.push({ stateId, stacksRemoved });
      },
      removeState(stateId)
      {
        this.__removedStates.push(stateId);
      },
      ...members,
    });
  }

  /**
   * Builds an action with the given caster and skill.
   * @param {object} caster The battler executing the action.
   * @param {RPG_Skill} skill The skill to assign to the action.
   * @param {boolean} [isForOpponent] Whether the skill is aimed at the caster's opponents; defaults to true.
   * @returns {Game_Action}
   */
  function buildAction(caster, skill, isForOpponent = true)
  {
    const action = new globalThis.Game_Action();
    action.subject = function()
    {
      return caster;
    };

    // the shared state roll asks how the action is aimed, which this realm's Game_Action stand-in cannot answer.
    action.isForOpponent = function()
    {
      return isForOpponent;
    };

    action.setItemObject(skill);
    return action;
  }

  it('applies all on-hit state effect types when the action lands', () =>
  {
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
    // define the skill and passive state contributions; self/lose target the caster.
    const skill = buildSkill('<onCastSelfState:[11,100]>\n<onCastLoseState:[12,100]>');
    const passiveState = buildState('<onCastSelfState:[15,100]>\n<onCastLoseState:[16,100]>');

    // build the action participants.
    const caster = buildBattler([ passiveState ]);
    const target = buildTarget(true);
    const action = buildAction(caster, skill);

    // these run at press-time through this plugin's extension of JABS_Engine#handleOnCastStateEffects, not per hit.
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

    it('fires caster-wide entries first and skill-scoped entries last', () =>
    {
      // Arrange- both variants name the same state, so the order they land in decides which one wins.
      const casterEquipNote = { note: '<applyState:[12, 100, 600]>' };
      const caster = buildBattler([], [], [ casterEquipNote ]);
      const skill = buildSkill('<thisApplyState:[12, 100, 300, 2]>');
      const target = buildTarget(true);
      const action = buildAction(caster, skill, true);

      // Act
      action.applyOnHitApplyStates(target);

      // Assert- the caster-wide duration lands first, then the skill-scoped duration and stacks.
      const landings = target.__addedStatesWithOverrides
        .map(({ stateId, overrides }) => [ stateId, overrides.duration, overrides.stacks ]);
      expect(landings).toEqual([ [ 12, 600, null ], [ 12, 300, 2 ] ]);
    });

    it('delivers the authored DURATION and STACKS on every landing under Accumulate Mode', () =>
    {
      // Arrange- a caster in Accumulate Mode with two lucky rolls rolls three times and counts every landing, and at
      // 100% all three land. a 0% sibling on the same skill rolls just as often and never lands.
      const caster = buildBattler([], [], [], {
        isAccumulating: () => true,
        getPositiveRollsForSkill: () => 2,
      });
      const skill = buildSkill('<thisApplyState:[13, 100, 300, 2]>\n<thisApplyState:[15, 0, 120, 5]>');
      const target = buildTarget(true);
      const action = buildAction(caster, skill, true);

      // Act
      action.applyOnHitApplyStates(target);

      // Assert- each landing carries the same overrides, the caster's attribution and the executing skill.
      const landings = target.__addedStatesWithOverrides
        .map(({ stateId, attacker, overrides, sourceSkill }) =>
          ({ stateId, attacker, duration: overrides.duration, stacks: overrides.stacks, sourceSkill }));
      const landing = { stateId: 13, attacker: caster, duration: 300, stacks: 2, sourceSkill: skill };
      expect(landings).toEqual([ landing, landing, landing ]);
    });

    it('lets the target\'s resistance keep a sure chance from landing while an unresisted sibling lands', () =>
    {
      // Arrange- both states are authored at 100%, and the target resists state 12 completely through its State
      // Rate, so its resistance is the only thing that can keep that one off.
      const casterNotes = [ { note: '<applyState:[12, 100]>' }, { note: '<applyState:[14, 100]>' } ];
      const caster = buildBattler([], [], casterNotes);
      const target = buildTarget(true, { stateRate: stateId => (stateId === 12 ? 0 : 1) });
      const action = buildAction(caster, buildSkill(''), true);

      // Act
      action.applyOnHitApplyStates(target);

      // Assert
      const landedStateIds = target.__addedStatesWithOverrides.map(({ stateId }) => stateId);
      expect(landedStateIds).toEqual([ 14 ]);
    });

    describe('the roll each entry makes', () =>
    {
      let resolveProcCount;

      beforeEach(() =>
      {
        // watch the roll every entry makes; a test that needs a set count answers it as well.
        resolveProcCount = vi.spyOn(globalThis.RPGManager, 'resolveProcCount');
      });

      afterEach(() =>
      {
        resolveProcCount.mockRestore();
      });

      it('rolls a mid chance against the target\'s partial resistances, their luck gap and the action\'s fate', () =>
      {
        // Arrange- 40% against half State Rate and a quarter type resistance, from a caster holding 60 LUK over the
        // target: 40 x 0.5 x 0.75 x 1.06 = 15.9, which rounds to 16. the state is harm, so that luck gap weighs in.
        // the caster resists differently, and the target resists no other state, so reading the wrong battler or the
        // wrong state shows in the chance. the skill is aimed at the caster's opponents, so the target's two curses
        // are two more chances for the state to land.
        resolveProcCount.mockReturnValue(1);
        const casterEquipNote = { note: '<applyState:[12, 40]>' };
        const caster = buildBattler([], [], [ casterEquipNote ], {
          luk: 110,
          stateRate: () => 0.9,
          stateTypeResistRate: () => 0.9,
        });
        const target = buildTarget(true, {
          luk: 50,
          stateRate: stateId => (stateId === 12 ? 0.5 : 1),
          stateTypeResistRate: stateId => (stateId === 12 ? 0.75 : 1),
          state: stateId => ({ isNegativeType: () => stateId === 12, isImmuneToFate: () => false }),
          getNegativeRolls: () => 2,
        });
        const action = buildAction(caster, buildSkill(''), true);

        // Act
        action.applyOnHitApplyStates(target);

        // Assert- the caster rolls the whole percent with its one chance plus the target's two curses and no
        // hurdles, and the state lands once.
        expect(resolveProcCount).toHaveBeenCalledTimes(1);
        expect(resolveProcCount).toHaveBeenCalledWith(caster, 16, 3, 0);
        expect(target.__addedStatesWithOverrides).toHaveLength(1);
      });

      it('does not apply when the chance roll is 0%', () =>
      {
        // Arrange- a caster-wide applyState tag with a 0% chance against a target that resists nothing.
        const casterEquipNote = { note: '<applyState:[12, 0, 600]>' };
        const caster = buildBattler([], [], [ casterEquipNote ]);
        const target = buildTarget(true);
        const action = buildAction(caster, buildSkill(''), true);

        // Act
        action.applyOnHitApplyStates(target);

        // Assert- the roll ran against a chance of nothing, and nothing applied.
        expect(resolveProcCount).toHaveBeenCalledWith(caster, 0, 1, 0);
        expect(target.__addedStatesWithOverrides).toEqual([]);
      });
    });
  });

  describe('the afflicted-gated apply-states', () =>
  {
    /**
     * Builds a target that remembers which states it carries, so the gate has something real to judge. Every state
     * added to it is recorded with what it was added by, and is carried from then on.
     * @param {number[]} afflictedStateIds The states the target carries before the hit.
     * @param {boolean} [hit] Whether or not the hit lands; defaults to landing.
     * @returns {object}
     */
    function buildAfflictedTarget(afflictedStateIds, hit = true)
    {
      return buildTarget(hit, {
        __afflictedStateIds: [ ...afflictedStateIds ],
        __addedStateCalls: [],
        isStateAffected(stateId)
        {
          return this.__afflictedStateIds.includes(stateId);
        },
        addState(stateId, attacker, sourceSkill)
        {
          this.__addedStates.push(stateId);
          this.__addedStateCalls.push({ stateId, attacker, sourceSkill });
          this.__afflictedStateIds.push(stateId);
        },
      });
    }

    it('lands on a target that already carried the necessary state, and skips a sibling whose state is missing', () =>
    {
      // Arrange- both entries are sure chances on the executing skill. the target carries 72 but not 99, so only the
      // gate can tell the two entries apart.
      const caster = buildBattler();
      const skill = buildSkill('<thisApplyStateWhenAfflicted:[73, 72, 100]>\n<thisApplyStateWhenAfflicted:[74, 99, 100]>');
      const target = buildAfflictedTarget([ 72 ]);
      const action = buildAction(caster, skill);

      // Act
      action.apply(target);

      // Assert
      expect(target.__addedStates).toEqual([ 73 ]);
    });

    it('judges the target before the hit, so a necessary state the same hit lands does not count', () =>
    {
      // Arrange- the original logic lands state 72 partway through the hit, the way a skill's own Add State effect
      // does. the target carried nothing before the hit.
      const caster = buildBattler();
      const skill = buildSkill('<thisApplyStateWhenAfflicted:[73, 72, 100]>');
      const target = buildAfflictedTarget([]);
      const action = buildAction(caster, skill);
      const originalApply = globalThis.J.EXTEND.Aliased.Game_Action.get('apply');
      globalThis.J.EXTEND.Aliased.Game_Action.set('apply', aimedAt => aimedAt.addState(72));

      // Act
      try
      {
        action.apply(target);
      }
      finally
      {
        globalThis.J.EXTEND.Aliased.Game_Action.set('apply', originalApply);
      }

      // Assert- the hit's own state landed, and the gated one did not follow it.
      expect(target.__addedStates).toEqual([ 72 ]);
    });

    it('lands the caster-wide variant from any note source the caster carries, ahead of the skill-scoped one', () =>
    {
      // Arrange- a weapon carries the caster-wide variant and the executing skill carries the skill-scoped one, and
      // the target carries both necessary states.
      const weaponNote = { note: '<applyStateWhenAfflicted:[37, 15, 100]>' };
      const caster = buildBattler([], [], [ weaponNote ]);
      const skill = buildSkill('<thisApplyStateWhenAfflicted:[73, 72, 100]>');
      const target = buildAfflictedTarget([ 15, 72 ]);
      const action = buildAction(caster, skill);

      // Act
      action.apply(target);

      // Assert
      expect(target.__addedStates).toEqual([ 37, 73 ]);
    });

    it('reads the skill-scoped variant from the executing skill alone, never from another skill the caster knows', () =>
    {
      // Arrange- another skill the caster knows sits among its note sources carrying the skill-scoped variant, and
      // the target carries the state both entries need.
      const otherSkillNote = { note: '<thisApplyStateWhenAfflicted:[75, 72, 100]>' };
      const caster = buildBattler([], [], [ otherSkillNote ]);
      const skill = buildSkill('<thisApplyStateWhenAfflicted:[73, 72, 100]>');
      const target = buildAfflictedTarget([ 72 ]);
      const action = buildAction(caster, skill);

      // Act
      action.apply(target);

      // Assert
      expect(target.__addedStates).toEqual([ 73 ]);
    });

    it('rolls each entry\'s own chance for its own state, and adds it once per landing from the caster and skill', () =>
    {
      // Arrange- the necessary state, the applied state and the chance are all different numbers, so a roll handed
      // the wrong slot shows. the roll answers two landings.
      const caster = buildBattler();
      const skill = buildSkill('<thisApplyStateWhenAfflicted:[73, 72, 40]>');
      const target = buildAfflictedTarget([ 72 ]);
      const action = buildAction(caster, skill);
      action.resolveStateProcCountAgainst = vi.fn(() => 2);

      // Act
      action.apply(target);

      // Assert
      const landing = { stateId: 73, attacker: caster, sourceSkill: skill };
      expect(action.resolveStateProcCountAgainst.mock.calls).toEqual([ [ target, 73, 40 ] ]);
      expect(target.__addedStateCalls).toEqual([ landing, landing ]);
    });

    it('adds nothing when the roll never lands', () =>
    {
      // Arrange- the target qualifies, and the roll answers no landings.
      const caster = buildBattler();
      const skill = buildSkill('<thisApplyStateWhenAfflicted:[73, 72, 100]>');
      const target = buildAfflictedTarget([ 72 ]);
      const action = buildAction(caster, skill);
      action.resolveStateProcCountAgainst = vi.fn(() => 0);

      // Act
      action.apply(target);

      // Assert- the state was rolled for, and nothing was added.
      expect(action.resolveStateProcCountAgainst).toHaveBeenCalledTimes(1);
      expect(target.__addedStates).toEqual([]);
    });

    it('lands nothing when the hit misses, even on a target that qualifies', () =>
    {
      // Arrange- a sure chance against a target carrying the necessary state, so the miss is the only thing left that
      // can keep it off.
      const caster = buildBattler();
      const skill = buildSkill('<thisApplyStateWhenAfflicted:[73, 72, 100]>');
      const target = buildAfflictedTarget([ 72 ], false);
      const action = buildAction(caster, skill);

      // Act
      action.apply(target);

      // Assert
      expect(target.__addedStates).toEqual([]);
    });
  });

  describe('applyStates', () =>
  {
    let resolveProcCount;

    beforeEach(() =>
    {
      // answer the roll with a single landing, so only what it was handed is under test.
      resolveProcCount = vi.spyOn(globalThis.RPGManager, 'resolveProcCount')
        .mockReturnValue(1);
    });

    afterEach(() =>
    {
      resolveProcCount.mockRestore();
    });

    it('shrinks an on-hit self-state by the caster\'s own resistances, with no luck edge and its fate once', () =>
    {
      // Arrange- 40% against the caster's own half State Rate and quarter type resistance is 40 x 0.5 x 0.75 = 15.
      // the struck target resists differently, trails the caster's LUK and carries a curse, and the caster's
      // battler-wide curse differs from its curse with this skill, so reading any of those shows in the roll.
      const skill = buildSkill('<onHitSelfState:[3,40]>');
      const caster = buildBattler([], [], [], {
        luk: 110,
        stateRate: stateId => (stateId === 3 ? 0.5 : 1),
        stateTypeResistRate: stateId => (stateId === 3 ? 0.75 : 1),
        getPositiveRollsForSkill: () => 2,
        getNegativeRolls: () => 5,
        getNegativeRollsForSkill: () => 1,
      });
      const target = buildTarget(true, {
        luk: 50,
        stateRate: () => 0.25,
        stateTypeResistRate: () => 0.25,
        getNegativeRolls: () => 2,
      });
      const action = buildAction(caster, skill, true);

      // Act
      action.apply(target);

      // Assert- the caster rolls against itself: 15 percent, its one chance plus two lucky rolls, and one curse.
      expect(resolveProcCount).toHaveBeenCalledTimes(1);
      expect(resolveProcCount).toHaveBeenCalledWith(caster, 15, 3, 1);
      expect(caster.__addedStates).toEqual([ 3 ]);
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
