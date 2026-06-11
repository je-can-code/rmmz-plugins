//region plugins/passive/j-passive-conditional.test.js
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { loadPassiveConditionalPluginVm } from './passive-conditional-vm.js';

/**
 * Builds a test actor whose skill notes carry passive grants and rule tags.
 *
 * @param {object} sandbox
 * @param {string[]} skillNotes
 * @returns {object}
 */
function buildConditionalTestActor(sandbox, skillNotes)
{
  const actor = new sandbox.Game_Actor();

  actor.initMembers();

  const emptyRow = new sandbox.RPG_BaseItem({
    id: 1,
    meta: {},
    name: String.empty,
    note: String.empty,
    description: String.empty,
    iconIndex: 0,
  }, 1);

  actor.__actorDb = emptyRow;

  actor.class = function()
  {
    return emptyRow;
  };

  actor.currentClass = function()
  {
    return emptyRow;
  };

  actor._hp = 1;
  actor._mhp = 100;

  Object.defineProperties(actor, {
    hp: {
      get()
      {
        return this._hp;
      },
      configurable: true,
    },
    mhp: {
      get()
      {
        return this._mhp;
      },
      configurable: true,
    },
  });

  const skillRows = skillNotes.map(note =>
  {
    const payload = {
      id: -1,
      meta: {},
      name: String.empty,
      note,
      description: String.empty,
      iconIndex: 0,
    };

    return new sandbox.RPG_BaseItem(payload, -1);
  });

  actor.skills = function()
  {
    return skillRows;
  };

  actor.databaseData = function()
  {
    return emptyRow;
  };

  actor.allStates = function()
  {
    return [];
  };

  actor.equippedEquips = function()
  {
    return [];
  };

  return actor;
}

/**
 * Actor with passive conditional runtime members ready for move/stand/skill-removal tests.
 *
 * @param {object} sandbox
 * @param {string[]} skillNotes
 * @returns {object}
 */
function buildMomentumToolkitActor(sandbox, skillNotes = [])
{
  const actor = buildConditionalTestActor(sandbox, skillNotes);

  actor.initPassiveStatesMembers();

  return actor;
}

/**
 * Registers one hydrated state row for combat-state removal tests.
 *
 * @param {object} sandbox
 * @param {number} stateId
 * @param {string} note
 * @returns {object}
 */
function stubMomentumStateRow(sandbox, stateId, note)
{
  const row = Object.assign(Object.create(sandbox.RPG_State.prototype), {
    id: stateId,
    meta: {},
    name: 'TestState',
    note,
    description: String.empty,
    iconIndex: 0,
  });

  sandbox.$dataStates = sandbox.$dataStates || [];
  sandbox.$dataStates[stateId] = row;

  return row;
}

describe('J-Passive-Conditional (out/passive/ext/J-Passive-Conditional.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPassiveConditionalPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
  });

  it('exposes metadata defaults from plugin parameters', () =>
  {
    expect(sandbox.J.PASSIVE.EXT.CONDITIONAL.Metadata.reconcileDelayFrames).toBe(15);
    expect(sandbox.J.PASSIVE.EXT.CONDITIONAL.Metadata.defaultProximityTiles).toBe(5);
  });

  it('gates passiveStateRule thresholds with inclusive Above/Below semantics', () =>
  {
    const actor = buildConditionalTestActor(sandbox, [
      '<passive:[42]>\n<passiveStateRule:[42, hpBelow, 25]>',
      '<passive:[43]>\n<passiveStateRule:[43, hpAbove, 50]>',
    ]);

    actor._hp = 20;
    actor.refreshPassiveStates();

    expect(actor.getPassiveStateIds()).toContain(42);
    expect(actor.getPassiveStateIds()).not.toContain(43);

    actor._hp = 60;
    actor.refreshPassiveStates();

    expect(actor.getPassiveStateIds()).not.toContain(42);
    expect(actor.getPassiveStateIds()).toContain(43);
  });

  it('includes passive state ids at threshold boundaries (inclusive compare)', () =>
  {
    const actor = buildConditionalTestActor(sandbox, [
      '<passive:[99]>\n<passiveStateRule:[99, hpAbove, 50]>',
    ]);

    actor._hp = 50;
    actor.refreshPassiveStates();

    expect(actor.getPassiveStateIds()).toContain(99);
  });

  it('scales stackable passives via passiveStateCount', () =>
  {
    const actor = buildConditionalTestActor(sandbox, [
      '<passive:[77]>\n<passiveStateCount:[77, moreIsMoreHp, 25]>',
    ]);

    actor._hp = 100;
    actor.refreshPassiveStates();

    const stacks = actor.getPassiveStateIds().filter(id => id === 77);

    expect(stacks.length).toBe(4);
  });

  it('parses conditional tags on RPG_BaseBattler rows (actor/enemy notes)', () =>
  {
    const row = Object.assign(Object.create(sandbox.RPG_BaseBattler.prototype), {
      id: 1,
      meta: {},
      name: 'Test',
      note: '<autoApplyState:[16, time, 180]>\n<passiveSourceRule:[hpBelow, 25]>',
      description: String.empty,
      iconIndex: 0,
    });

    expect(row.autoApplyStateRules.length).toBe(1);
    expect(row.autoApplyStateRules[0][0]).toBe(16);
    expect(row.passiveSourceRules.length).toBe(1);
  });

  describe('momentum toolkit (move / stand / removeOnSkillExecution)', () =>
  {
    beforeEach(() =>
    {
      sandbox.$jabsEngine = {
        absEnabled: true,
        getJabsStateByUuidAndStateId()
        {
          return null;
        },
      };
      sandbox.Graphics.frameCount = 600;
    });

    it('parses move autoApplyState and removeOnSkillExecution tags', () =>
    {
      const itemRow = Object.assign(Object.create(sandbox.RPG_BaseItem.prototype), {
        id: 1,
        meta: {},
        name: 'Src',
        note: '<autoApplyState:[42, move, 2]>',
        description: String.empty,
        iconIndex: 0,
      });

      expect(itemRow.autoApplyStateRules[0][1]).toBe('move');
      expect(itemRow.autoApplyStateRules[0][2]).toBe(2);

      const stateRow = Object.assign(Object.create(sandbox.RPG_State.prototype), {
        id: 50,
        meta: {},
        name: 'Momentum',
        note: '<removeOnSkillExecution:[7, 100]>',
        description: String.empty,
        iconIndex: 0,
      });

      expect(stateRow.removeOnSkillExecutionRules.length).toBe(1);
      expect(stateRow.removeOnSkillExecutionRules[0][0]).toBe(7);
      expect(stateRow.removeOnSkillExecutionRules[0][1]).toBe(100);
    });

    it('credits move auto-apply only after the configured whole-tile count', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoApplyState:[42, move, 2]>',
      ]);

      const applied = [];

      actor.isStateAddable = function()
      {
        return true;
      };

      actor.addState = function(stateId)
      {
        applied.push(stateId);
      };

      sandbox.AutoApplyStateManager.creditTileStep(actor);
      expect(applied.length).toBe(0);

      sandbox.AutoApplyStateManager.creditTileStep(actor);
      expect(applied).toEqual([ 42 ]);
    });

    it('does not apply move rules through the frame-cooldown tryApply path', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoApplyState:[42, move, 1]>',
      ]);

      const applied = [];

      actor.isStateAddable = function()
      {
        return true;
      };

      actor.addState = function(stateId)
      {
        applied.push(stateId);
      };

      sandbox.AutoApplyStateManager.tryApply(actor, 'move');

      expect(applied.length).toBe(0);
    });

    it('forwards Game_CharacterBase.updatePixelStepping to tile credit on the linked battler', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoApplyState:[42, move, 1]>',
      ]);

      const applied = [];

      actor.isStateAddable = function()
      {
        return true;
      };

      actor.addState = function(stateId)
      {
        applied.push(stateId);
      };

      const character = Object.create(sandbox.Game_CharacterBase.prototype);

      character.moveDistance = function()
      {
        return 1;
      };

      character.stepDistance = function()
      {
        return 1;
      };

      character.getJabsBattler = function()
      {
        return {
          getBattler()
          {
            return actor;
          },
        };
      };

      character.updatePixelStepping();

      expect(applied).toEqual([ 42 ]);
    });

    it('skips stand auto-apply when the battler moved this frame', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoApplyState:[43, stand, 1]>',
      ]);

      const applied = [];

      actor.isStateAddable = function()
      {
        return true;
      };

      actor.addState = function(stateId)
      {
        applied.push(stateId);
      };

      actor.stampPassiveRuleMovedFrame();

      sandbox.AutoApplyStateManager.processStandRules(actor);

      expect(applied.length).toBe(0);
    });

    it('applies stand auto-apply while idle after the frame interval', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoApplyState:[43, stand, 1]>',
      ]);

      const applied = [];

      actor.isStateAddable = function()
      {
        return true;
      };

      actor.addState = function(stateId)
      {
        applied.push(stateId);
      };

      actor._j._passive._conditional._lastMovedFrame = 598;

      sandbox.AutoApplyStateManager.processStandRules(actor);

      expect(applied).toEqual([ 43 ]);
    });

    it('respects stand cooldown between applications', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoApplyState:[43, stand, 60]>',
      ]);

      const applied = [];

      actor.isStateAddable = function()
      {
        return true;
      };

      actor.addState = function(stateId)
      {
        applied.push(stateId);
      };

      actor._j._passive._conditional._lastMovedFrame = 500;

      sandbox.AutoApplyStateManager.processStandRules(actor);
      sandbox.AutoApplyStateManager.processStandRules(actor);

      expect(applied).toEqual([ 43 ]);
    });

    it('tracks cooldown separately for duplicate autoApplyState tuples on one row', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoApplyState:[43, time, 1]>\n<autoApplyState:[43, time, 1]>',
      ]);

      const applied = [];

      actor.isStateAddable = function()
      {
        return true;
      };

      actor.addState = function(stateId)
      {
        applied.push(stateId);
      };

      sandbox.AutoApplyStateManager.processTimeRules(actor);

      expect(applied).toEqual([ 43, 43 ]);
    });

    it('decrements stacks when removeOnSkillExecution stype matches', () =>
    {
      const stateId = 50;

      stubMomentumStateRow(sandbox, stateId, '<removeOnSkillExecution:[7, 100]>');

      const actor = buildMomentumToolkitActor(sandbox, []);

      actor._states = [ stateId ];
      actor.getUuid = function()
      {
        return 'test-actor';
      };

      const decrements = [];

      actor.decrementStateStacks = function(id, count)
      {
        decrements.push({ id, count });
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[99] = { id: 99, stypeId: 7 };

      const prevChance = sandbox.RPGManager.chanceIn100;

      sandbox.RPGManager.chanceIn100 = function()
      {
        return true;
      };

      sandbox.SkillExecutionStateRemovalManager.process(actor, 99);

      sandbox.RPGManager.chanceIn100 = prevChance;

      expect(decrements).toEqual([ { id: stateId, count: 1 } ]);
    });

    it('matches removeOnSkillExecution stype 0 against any executed skill', () =>
    {
      const stateId = 51;

      stubMomentumStateRow(sandbox, stateId, '<removeOnSkillExecution:[0, 100]>');

      const actor = buildMomentumToolkitActor(sandbox, []);

      actor._states = [ stateId ];
      actor.getUuid = function()
      {
        return 'test-actor';
      };

      const decrements = [];

      actor.decrementStateStacks = function(id, count)
      {
        decrements.push({ id, count });
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[12] = { id: 12, stypeId: 99 };

      const prevChance = sandbox.RPGManager.chanceIn100;

      sandbox.RPGManager.chanceIn100 = function()
      {
        return true;
      };

      sandbox.SkillExecutionStateRemovalManager.process(actor, 12);

      sandbox.RPGManager.chanceIn100 = prevChance;

      expect(decrements).toEqual([ { id: stateId, count: 1 } ]);
    });

    it('skips removeOnSkillExecution when executed skill stype does not match', () =>
    {
      const stateId = 52;

      stubMomentumStateRow(sandbox, stateId, '<removeOnSkillExecution:[3, 100]>');

      const actor = buildMomentumToolkitActor(sandbox, []);

      actor._states = [ stateId ];
      actor.getUuid = function()
      {
        return 'test-actor';
      };

      const decrements = [];

      actor.decrementStateStacks = function(id, count)
      {
        decrements.push({ id, count });
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[20] = { id: 20, stypeId: 8 };

      const prevChance = sandbox.RPGManager.chanceIn100;

      sandbox.RPGManager.chanceIn100 = function()
      {
        return true;
      };

      sandbox.SkillExecutionStateRemovalManager.process(actor, 20);

      sandbox.RPGManager.chanceIn100 = prevChance;

      expect(decrements.length).toBe(0);
    });

    it('skips removeOnSkillExecution when the chance roll fails', () =>
    {
      const stateId = 53;

      stubMomentumStateRow(sandbox, stateId, '<removeOnSkillExecution:[0, 100]>');

      const actor = buildMomentumToolkitActor(sandbox, []);

      actor._states = [ stateId ];
      actor.getUuid = function()
      {
        return 'test-actor';
      };

      const decrements = [];

      actor.decrementStateStacks = function(id, count)
      {
        decrements.push({ id, count });
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[30] = { id: 30, stypeId: 1 };

      const prevChance = sandbox.RPGManager.chanceIn100;

      sandbox.RPGManager.chanceIn100 = function()
      {
        return false;
      };

      sandbox.SkillExecutionStateRemovalManager.process(actor, 30);

      sandbox.RPGManager.chanceIn100 = prevChance;

      expect(decrements.length).toBe(0);
    });

    it('peels every stack when the state row uses loseAllStacksAtOnce', () =>
    {
      const stateId = 54;

      const stateRow = stubMomentumStateRow(
        sandbox,
        stateId,
        '<removeOnSkillExecution:[0, 100]>'
      );

      stateRow.jabsLoseAllStacksAtOnce = true;

      const actor = buildMomentumToolkitActor(sandbox, []);

      actor._states = [ stateId ];
      actor.getUuid = function()
      {
        return 'test-actor';
      };

      const decrements = [];

      actor.decrementStateStacks = function(id, count)
      {
        decrements.push({ id, count });
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[40] = { id: 40, stypeId: 2 };

      sandbox.$jabsEngine.getJabsStateByUuidAndStateId = function()
      {
        return { stackCount: 4 };
      };

      const prevChance = sandbox.RPGManager.chanceIn100;

      sandbox.RPGManager.chanceIn100 = function()
      {
        return true;
      };

      sandbox.SkillExecutionStateRemovalManager.process(actor, 40);

      sandbox.RPGManager.chanceIn100 = prevChance;

      expect(decrements).toEqual([ { id: stateId, count: 4 } ]);
    });
  });

  describe('autoExecuteSkill scheduler', () =>
  {
    /** @type {object} */
    let mockJabsBattler;

    beforeEach(() =>
    {
      sandbox.Graphics.frameCount = 1000;

      mockJabsBattler = {
        createJabsActionFromSkill()
        {
          return [ { id: 'preview' } ];
        },
        getBattler()
        {
          return null;
        },
      };

      sandbox.JABS_AiManager = {
        getBattlerByUuid()
        {
          return mockJabsBattler;
        },
        getOpposingBattlersWithinRange(_jabsBattler, proximity)
        {
          sandbox.__lastOpposingProximity = proximity;
          return sandbox.__opposingBattlers ?? [];
        },
      };

      sandbox.$jabsEngine = {
        absEnabled: true,
        canExecuteMapActions()
        {
          return true;
        },
        forceMapAction(jabsBattler, skillId)
        {
          sandbox.__forcedSkills = sandbox.__forcedSkills || [];
          sandbox.__forcedSkills.push(skillId);

          if (sandbox.__forceMapActionHook)
          {
            sandbox.__forceMapActionHook(jabsBattler, skillId);
          }
        },
      };

      sandbox.__forcedSkills = [];
      sandbox.__opposingBattlers = [];
      sandbox.__lastOpposingProximity = null;
      sandbox.__forceMapActionHook = null;
    });

    it('parses autoExecuteSkill tuples on item and battler rows', () =>
    {
      const itemRow = Object.assign(Object.create(sandbox.RPG_BaseItem.prototype), {
        id: 1,
        meta: {},
        name: 'Src',
        note: '<autoExecuteSkill:[500, time, 60]>',
        description: String.empty,
        iconIndex: 0,
      });

      expect(itemRow.autoExecuteSkillRules[0]).toEqual([ 500, 'time', 60 ]);

      const battlerRow = Object.assign(Object.create(sandbox.RPG_BaseBattler.prototype), {
        id: 2,
        meta: {},
        name: 'Enemy',
        note: '<autoExecuteSkill:[501, enemiesNearby, 1, 30, 2]>',
        description: String.empty,
        iconIndex: 0,
      });

      expect(battlerRow.autoExecuteSkillRules[0]).toEqual([ 501, 'enemiesNearby', 1, 30, 2 ]);
    });

    it('fires time rules once per cooldown window', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoExecuteSkill:[500, time, 60]>',
      ]);

      actor.getUuid = function()
      {
        return 'auto-exec-actor';
      };

      mockJabsBattler.getBattler = function()
      {
        return actor;
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[500] = { id: 500, stypeId: 1 };

      sandbox.AutoExecuteSkillManager.processTimeRules(actor);
      sandbox.AutoExecuteSkillManager.processTimeRules(actor);

      expect(sandbox.__forcedSkills).toEqual([ 500 ]);

      sandbox.Graphics.frameCount = 1061;

      sandbox.AutoExecuteSkillManager.processTimeRules(actor);

      expect(sandbox.__forcedSkills).toEqual([ 500, 500 ]);
    });

    it('gates enemiesNearby until enough opposing battlers are in range', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoExecuteSkill:[502, enemiesNearby, 1, 1]>',
      ]);

      actor.getUuid = function()
      {
        return 'auto-exec-actor';
      };

      mockJabsBattler.getBattler = function()
      {
        return actor;
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[502] = { id: 502, stypeId: 1 };

      sandbox.__opposingBattlers = [];

      sandbox.AutoExecuteSkillManager.processEnemiesNearbyRules(actor);

      expect(sandbox.__forcedSkills.length).toBe(0);

      sandbox.__opposingBattlers = [ {} ];

      sandbox.AutoExecuteSkillManager.processEnemiesNearbyRules(actor);

      expect(sandbox.__forcedSkills).toEqual([ 502 ]);
    });

    it('passes optional trigger tile radius to opposing battler lookup', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoExecuteSkill:[503, enemiesNearby, 1, 1, 2]>',
      ]);

      actor.getUuid = function()
      {
        return 'auto-exec-actor';
      };

      mockJabsBattler.getBattler = function()
      {
        return actor;
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[503] = { id: 503, stypeId: 1 };
      sandbox.__opposingBattlers = [ {} ];

      sandbox.AutoExecuteSkillManager.processEnemiesNearbyRules(actor);

      expect(sandbox.__lastOpposingProximity).toBe(2);
    });

    it('fires each enemiesNearby tuple on one row when every gate passes', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoExecuteSkill:[508, enemiesNearby, 2, 1]>\n<autoExecuteSkill:[508, enemiesNearby, 4, 1]>',
      ]);

      actor.getUuid = function()
      {
        return 'auto-exec-actor';
      };

      mockJabsBattler.getBattler = function()
      {
        return actor;
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[508] = { id: 508, stypeId: 1 };
      sandbox.__opposingBattlers = [
        {},
        {},
        {},
        {},
      ];

      sandbox.AutoExecuteSkillManager.processEnemiesNearbyRules(actor);

      expect(sandbox.__forcedSkills).toEqual([ 508, 508 ]);
    });

    it('blocks nested auto-execute at max depth 1', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoExecuteSkill:[504, time, 1]>',
      ]);

      actor.getUuid = function()
      {
        return 'auto-exec-actor';
      };

      mockJabsBattler.getBattler = function()
      {
        return actor;
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[504] = { id: 504, stypeId: 1 };

      sandbox.__forceMapActionHook = function()
      {
        actor.tryAutoExecuteSkills('time');
      };

      sandbox.AutoExecuteSkillManager.processTimeRules(actor);

      expect(sandbox.__forcedSkills).toEqual([ 504 ]);
    });

    it('credits move auto-execute only after the configured whole-tile count', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoExecuteSkill:[505, move, 2]>',
      ]);

      actor.getUuid = function()
      {
        return 'auto-exec-actor';
      };

      mockJabsBattler.getBattler = function()
      {
        return actor;
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[505] = { id: 505, stypeId: 1 };

      sandbox.AutoExecuteSkillManager.creditTileStep(actor);

      expect(sandbox.__forcedSkills.length).toBe(0);

      sandbox.AutoExecuteSkillManager.creditTileStep(actor);

      expect(sandbox.__forcedSkills).toEqual([ 505 ]);
    });

    it('fires stand auto-execute when the battler has been idle', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoExecuteSkill:[506, stand, 1]>',
      ]);

      actor.getUuid = function()
      {
        return 'auto-exec-actor';
      };

      mockJabsBattler.getBattler = function()
      {
        return actor;
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[506] = { id: 506, stypeId: 1 };

      actor._j._passive._conditional._lastMovedFrame = 998;

      sandbox.AutoExecuteSkillManager.processStandRules(actor);

      expect(sandbox.__forcedSkills).toEqual([ 506 ]);
    });

    it('scheduleDamageTriggers invokes auto-execute hpDmg rules', () =>
    {
      const actor = buildMomentumToolkitActor(sandbox, [
        '<autoExecuteSkill:[507, hpDmg, 1]>',
      ]);

      actor.getUuid = function()
      {
        return 'auto-exec-actor';
      };

      mockJabsBattler.getBattler = function()
      {
        return actor;
      };

      sandbox.$dataSkills = [];
      sandbox.$dataSkills[507] = { id: 507, stypeId: 1 };

      sandbox.AutoExecuteSkillManager.scheduleDamageTriggers(actor, 'hpDmg');

      expect(sandbox.__forcedSkills).toEqual([ 507 ]);
    });
  });
});
//endregion plugins/passive/j-passive-conditional.test.js
