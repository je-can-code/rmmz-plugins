//region plugins/passive/_component/j-passive-conditional.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPassiveHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPassive,
} from './fixtures/install-passive-host-globals.js';
import {
  installPassiveConditionalHostGlobals,
  setPluginContextToJPassiveConditional,
} from './fixtures/install-passive-conditional-host-globals.js';

/**
 * Builds a test actor whose skill notes carry passive grants and rule tags.
 * @param {string[]} skillNotes
 * @returns {object}
 */
function buildConditionalTestActor(skillNotes)
{
  const actor = new globalThis.Game_Actor();

  actor.initMembers();

  const emptyRow = new globalThis.RPG_BaseItem({
    id: 1,
    meta: {},
    name: String.empty,
    note: String.empty,
    description: String.empty,
    iconIndex: 0,
  }, 1);

  actor.__actorDb = emptyRow;
  actor.class = () => emptyRow;
  actor.currentClass = () => emptyRow;
  actor._hp = 1;
  actor._mhp = 100;

  Object.defineProperties(actor, {
    hp: { get() { return this._hp; }, configurable: true },
    mhp: { get() { return this._mhp; }, configurable: true },
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

    return new globalThis.RPG_BaseItem(payload, -1);
  });

  actor.skills = () => skillRows;
  actor.databaseData = () => emptyRow;
  actor.allStates = () => [];
  actor.equippedEquips = () => [];

  return actor;
}

/**
 * Actor with passive conditional runtime members ready for move/stand/skill-removal tests.
 * @param {string[]} [skillNotes]
 * @returns {object}
 */
function buildMomentumToolkitActor(skillNotes = [])
{
  const actor = buildConditionalTestActor(skillNotes);
  actor.initPassiveStatesMembers();
  return actor;
}

/**
 * Registers one hydrated state row for combat-state removal tests.
 * @param {number} stateId
 * @param {string} note
 * @returns {object}
 */
function stubMomentumStateRow(stateId, note)
{
  const row = Object.assign(Object.create(globalThis.RPG_State.prototype), {
    id: stateId,
    meta: {},
    name: 'TestState',
    note,
    description: String.empty,
    iconIndex: 0,
  });

  globalThis.$dataStates = globalThis.$dataStates || [];
  globalThis.$dataStates[stateId] = row;

  return row;
}

describe('J-Passive-Conditional (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_BaseItem } = await import('../../../../src/plugins/_base/database/base/RPG_BaseItem.js'));
    ({ default: globalThis.RPG_BaseBattler } = await import('../../../../src/plugins/_base/database/core/RPG_BaseBattler.js'));
    ({ default: globalThis.RPG_Actor } = await import('../../../../src/plugins/_base/database/implementations/RPG_Actor.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../src/plugins/_base/database/implementations/RPG_State.js'));

    await import('../../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJPassive();
    await import('../../../../src/plugins/passive/core/_metadata/initialization.js');

    await import('../../../../src/plugins/passive/core/database/RPG_BaseItem.js');
    await import('../../../../src/plugins/passive/core/database/RPG_BaseBattler.js');
    await import('../../../../src/plugins/passive/core/database/RPG_State.js');

    await import('../../../../src/plugins/passive/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/passive/core/objects/Game_Actor.js');

    installPassiveConditionalHostGlobals();

    setPluginContextToJPassiveConditional();
    await import('../../../../src/plugins/passive/ext/conditional/_metadata/initialization.js');

    // patches the real prototype chain and JABS_* stand-ins directly, no vm involved, following
    // the same order as passive/ext/conditional/entry.js.
    await import('../../../../src/plugins/passive/ext/conditional/database/RPG_BaseBattler.js');
    await import('../../../../src/plugins/passive/ext/conditional/database/RPG_BaseItem.js');
    await import('../../../../src/plugins/passive/ext/conditional/database/RPG_State.js');
    await import('../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleThreshold.js');
    ({ default: globalThis.PassiveRuleJabsAccess } = await import('../../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleJabsAccess.js'));
    await import('../../../../src/plugins/passive/ext/conditional/managers/AutoRuleManager.js');
    ({ default: globalThis.AutoApplyStateManager } = await import('../../../../src/plugins/passive/ext/conditional/managers/AutoApplyStateManager.js'));
    await import('../../../../src/plugins/passive/ext/conditional/managers/AutoApplyStateOnNearbyManager.js');
    ({ default: globalThis.AutoExecuteSkillManager } = await import('../../../../src/plugins/passive/ext/conditional/managers/AutoExecuteSkillManager.js'));
    ({ default: globalThis.AutoInflictStateManager } = await import('../../../../src/plugins/passive/ext/conditional/managers/AutoInflictStateManager.js'));
    ({ default: globalThis.AutoModifyCooldownManager } = await import('../../../../src/plugins/passive/ext/conditional/managers/AutoModifyCooldownManager.js'));
    ({ default: globalThis.SkillExecutionStateRemovalManager } = await import('../../../../src/plugins/passive/ext/conditional/managers/SkillExecutionStateRemovalManager.js'));
    await import('../../../../src/plugins/passive/ext/conditional/managers/SkillResolutionStateRemovalManager.js');
    await import('../../../../src/plugins/passive/ext/conditional/managers/MoveStateRemovalManager.js');
    await import('../../../../src/plugins/passive/ext/conditional/managers/PassiveGateEvaluator.js');
    await import('../../../../src/plugins/passive/ext/conditional/managers/PassiveStackCountEvaluator.js');
    await import('../../../../src/plugins/passive/ext/conditional/objects/Game_Battler.js');
    await import('../../../../src/plugins/passive/ext/conditional/objects/Game_Action.js');
    await import('../../../../src/plugins/passive/ext/conditional/objects/Game_CharacterBase.js');
    await import('../../../../src/plugins/passive/ext/conditional/managers/JABS_Battler.js');
    await import('../../../../src/plugins/passive/ext/conditional/managers/JABS_Engine.js');
    await import('../../../../src/plugins/passive/ext/conditional/models/JABS_Action.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('metadata', () =>
  {
    it('reads reconcileDelayFrames from plugin parameters', () =>
    {
      // Arrange & Act
      const result = globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.reconcileDelayFrames;

      // Assert
      expect(result).toBe(15);
    });

    it('reads defaultProximityTiles from plugin parameters', () =>
    {
      // Arrange & Act
      const result = globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.defaultProximityTiles;

      // Assert
      expect(result).toBe(5);
    });
  });

  describe('passiveStateRule Above/Below gating', () =>
  {
    it('includes a hpBelow passive when hp is under the threshold', () =>
    {
      // Arrange
      const actor = buildConditionalTestActor([
        '<passive:[42]>\n<passiveStateRule:[42, hpBelow, 25]>',
        '<passive:[43]>\n<passiveStateRule:[43, hpAbove, 50]>',
      ]);
      actor._hp = 20;

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds()).toContain(42);
    });

    it('excludes a hpAbove passive when hp is under its threshold', () =>
    {
      // Arrange
      const actor = buildConditionalTestActor([
        '<passive:[42]>\n<passiveStateRule:[42, hpBelow, 25]>',
        '<passive:[43]>\n<passiveStateRule:[43, hpAbove, 50]>',
      ]);
      actor._hp = 20;

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds()).not.toContain(43);
    });

    it('excludes a hpBelow passive once hp rises above the threshold', () =>
    {
      // Arrange
      const actor = buildConditionalTestActor([
        '<passive:[42]>\n<passiveStateRule:[42, hpBelow, 25]>',
        '<passive:[43]>\n<passiveStateRule:[43, hpAbove, 50]>',
      ]);
      actor._hp = 60;

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds()).not.toContain(42);
    });

    it('includes a hpAbove passive once hp rises above the threshold', () =>
    {
      // Arrange
      const actor = buildConditionalTestActor([
        '<passive:[42]>\n<passiveStateRule:[42, hpBelow, 25]>',
        '<passive:[43]>\n<passiveStateRule:[43, hpAbove, 50]>',
      ]);
      actor._hp = 60;

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds()).toContain(43);
    });

    it('includes passive state ids at the threshold boundary (inclusive compare)', () =>
    {
      // Arrange
      const actor = buildConditionalTestActor([
        '<passive:[99]>\n<passiveStateRule:[99, hpAbove, 50]>',
      ]);
      actor._hp = 50;

      // Act
      actor.refreshPassiveStates();

      // Assert
      expect(actor.getPassiveStateIds()).toContain(99);
    });
  });

  describe('passiveStateCount', () =>
  {
    it('scales a stackable passive by the configured divisor', () =>
    {
      // Arrange
      const actor = buildConditionalTestActor([
        '<passive:[77]>\n<passiveStateCount:[77, moreIsMoreHp, 25]>',
      ]);
      actor._hp = 100;

      // Act
      actor.refreshPassiveStates();

      // Assert
      const stacks = actor.getPassiveStateIds().filter(id => id === 77);
      expect(stacks.length).toBe(4);
    });
  });

  describe('conditional tags on RPG_BaseBattler rows', () =>
  {
    function buildTaggedRow()
    {
      return Object.assign(Object.create(globalThis.RPG_BaseBattler.prototype), {
        id: 1,
        meta: {},
        name: 'Test',
        note: '<autoApplyState:[16, time, 180]>\n<passiveSourceRule:[hpBelow, 25]>',
        description: String.empty,
        iconIndex: 0,
      });
    }

    it('parses one autoApplyStateRule tuple', () =>
    {
      // Arrange
      const row = buildTaggedRow();

      // Act & Assert
      expect(row.autoApplyStateRules.length).toBe(1);
      expect(row.autoApplyStateRules[0][0]).toBe(16);
    });

    it('parses one passiveSourceRule tuple', () =>
    {
      // Arrange
      const row = buildTaggedRow();

      // Act & Assert
      expect(row.passiveSourceRules.length).toBe(1);
    });
  });

  describe('momentum toolkit (move / stand / removeOnSkillExecution)', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = {
        absEnabled: true,
        getJabsStateByUuidAndStateId: () => null,
      };
      globalThis.Graphics.frameCount = 600;
    });

    it('parses move autoApplyState tags on item rows', () =>
    {
      // Arrange
      const itemRow = Object.assign(Object.create(globalThis.RPG_BaseItem.prototype), {
        id: 1,
        meta: {},
        name: 'Src',
        note: '<autoApplyState:[42, move, 2]>',
        description: String.empty,
        iconIndex: 0,
      });

      // Act & Assert
      expect(itemRow.autoApplyStateRules[0][1]).toBe('move');
      expect(itemRow.autoApplyStateRules[0][2]).toBe(2);
    });

    it('parses removeOnSkillExecution tags on state rows', () =>
    {
      // Arrange
      const stateRow = Object.assign(Object.create(globalThis.RPG_State.prototype), {
        id: 50,
        meta: {},
        name: 'Momentum',
        note: '<removeOnSkillExecution:[7, 100]>',
        description: String.empty,
        iconIndex: 0,
      });

      // Act & Assert
      expect(stateRow.removeOnSkillExecutionRules.length).toBe(1);
      expect(stateRow.removeOnSkillExecutionRules[0]).toEqual([ 7, 100 ]);
    });

    it('credits move auto-apply only after the configured whole-tile count', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoApplyState:[42, move, 2]>' ]);
      const applied = [];
      actor.isStateAddable = () => true;
      actor.addState = (stateId) => applied.push(stateId);

      // Act
      globalThis.AutoApplyStateManager.creditTileStep(actor);
      globalThis.AutoApplyStateManager.creditTileStep(actor);

      // Assert
      expect(applied).toEqual([ 42 ]);
    });

    it('does not apply move rules through the frame-cooldown tryApply path', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoApplyState:[42, move, 1]>' ]);
      const applied = [];
      actor.isStateAddable = () => true;
      actor.addState = (stateId) => applied.push(stateId);

      // Act
      globalThis.AutoApplyStateManager.tryApply(actor, 'move');

      // Assert
      expect(applied.length).toBe(0);
    });

    it('forwards Game_CharacterBase.updatePixelStepping to tile credit on the linked battler', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoApplyState:[42, move, 1]>' ]);
      const applied = [];
      actor.isStateAddable = () => true;
      actor.addState = (stateId) => applied.push(stateId);
      const character = Object.create(globalThis.Game_CharacterBase.prototype);
      character.moveDistance = () => 1;
      character.stepDistance = () => 1;
      character.getJabsBattler = () => ({ getBattler: () => actor });

      // Act
      character.updatePixelStepping();

      // Assert
      expect(applied).toEqual([ 42 ]);
    });

    it('skips stand auto-apply when the battler moved this frame', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoApplyState:[43, stand, 1]>' ]);
      const applied = [];
      actor.isStateAddable = () => true;
      actor.addState = (stateId) => applied.push(stateId);
      actor.stampPassiveRuleMovedFrame();

      // Act
      globalThis.AutoApplyStateManager.processStandRules(actor);

      // Assert
      expect(applied.length).toBe(0);
    });

    it('applies stand auto-apply while idle after the frame interval', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoApplyState:[43, stand, 1]>' ]);
      const applied = [];
      actor.isStateAddable = () => true;
      actor.addState = (stateId) => applied.push(stateId);
      actor._j._passive._conditional._lastMovedFrame = 598;

      // Act
      globalThis.AutoApplyStateManager.processStandRules(actor);

      // Assert
      expect(applied).toEqual([ 43 ]);
    });

    it('respects stand cooldown between applications', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoApplyState:[43, stand, 60]>' ]);
      const applied = [];
      actor.isStateAddable = () => true;
      actor.addState = (stateId) => applied.push(stateId);
      actor._j._passive._conditional._lastMovedFrame = 500;

      // Act
      globalThis.AutoApplyStateManager.processStandRules(actor);
      globalThis.AutoApplyStateManager.processStandRules(actor);

      // Assert
      expect(applied).toEqual([ 43 ]);
    });

    it('tracks cooldown separately for duplicate autoApplyState tuples on one row', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([
        '<autoApplyState:[43, time, 1]>\n<autoApplyState:[43, time, 1]>',
      ]);
      const applied = [];
      actor.isStateAddable = () => true;
      actor.addState = (stateId) => applied.push(stateId);

      // Act
      globalThis.AutoApplyStateManager.processTimeRules(actor);

      // Assert
      expect(applied).toEqual([ 43, 43 ]);
    });

    describe('SkillExecutionStateRemovalManager.process', () =>
    {
      it('decrements stacks when the executed skill stype matches', () =>
      {
        // Arrange
        const stateId = 50;
        stubMomentumStateRow(stateId, '<removeOnSkillExecution:[7, 100]>');
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        const decrements = [];
        actor.decrementStateStacks = (id, count) => decrements.push({ id, count });
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[99] = { id: 99, stypeId: 7 };
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillExecutionStateRemovalManager.process(actor, 99);

        // Assert
        expect(decrements).toEqual([ { id: stateId, count: 1 } ]);
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('matches stype 0 against any executed skill', () =>
      {
        // Arrange
        const stateId = 51;
        stubMomentumStateRow(stateId, '<removeOnSkillExecution:[0, 100]>');
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        const decrements = [];
        actor.decrementStateStacks = (id, count) => decrements.push({ id, count });
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[12] = { id: 12, stypeId: 99 };
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillExecutionStateRemovalManager.process(actor, 12);

        // Assert
        expect(decrements).toEqual([ { id: stateId, count: 1 } ]);
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('skips removal when the executed skill stype does not match', () =>
      {
        // Arrange
        const stateId = 52;
        stubMomentumStateRow(stateId, '<removeOnSkillExecution:[3, 100]>');
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        const decrements = [];
        actor.decrementStateStacks = (id, count) => decrements.push({ id, count });
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[20] = { id: 20, stypeId: 8 };
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillExecutionStateRemovalManager.process(actor, 20);

        // Assert
        expect(decrements.length).toBe(0);
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('skips removal when the chance roll fails', () =>
      {
        // Arrange
        const stateId = 53;
        stubMomentumStateRow(stateId, '<removeOnSkillExecution:[0, 100]>');
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        const decrements = [];
        actor.decrementStateStacks = (id, count) => decrements.push({ id, count });
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[30] = { id: 30, stypeId: 1 };
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => false;

        // Act
        globalThis.SkillExecutionStateRemovalManager.process(actor, 30);

        // Assert
        expect(decrements.length).toBe(0);
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('peels every stack at once when the state row uses loseAllStacksAtOnce', () =>
      {
        // Arrange
        const stateId = 54;
        const stateRow = stubMomentumStateRow(stateId, '<removeOnSkillExecution:[0, 100]>');
        stateRow.jabsLoseAllStacksAtOnce = true;
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        const decrements = [];
        actor.decrementStateStacks = (id, count) => decrements.push({ id, count });
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[40] = { id: 40, stypeId: 2 };
        globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => ({ stackCount: 4 });
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillExecutionStateRemovalManager.process(actor, 40);

        // Assert
        expect(decrements).toEqual([ { id: stateId, count: 4 } ]);
        globalThis.RPGManager.chanceIn100 = prevChance;
      });
    });
  });

  describe('autoExecuteSkill scheduler', () =>
  {
    /** @type {object} */
    let mockJabsBattler;

    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 1000;

      mockJabsBattler = {
        createJabsActionFromSkill: () => [ { id: 'preview' } ],
        getBattler: () => null,
      };

      globalThis.JABS_AiManager = {
        getBattlerByUuid: () => mockJabsBattler,
        getOpposingBattlersWithinRange: (_jabsBattler, proximity) =>
        {
          globalThis.__lastOpposingProximity = proximity;
          return globalThis.__opposingBattlers ?? [];
        },
      };

      globalThis.$jabsEngine = {
        absEnabled: true,
        canExecuteMapActions: () => true,
        forceMapAction(jabsBattler, skillId)
        {
          globalThis.__forcedSkills = globalThis.__forcedSkills || [];
          globalThis.__forcedSkills.push(skillId);

          if (globalThis.__forceMapActionHook)
          {
            globalThis.__forceMapActionHook(jabsBattler, skillId);
          }
        },
      };

      globalThis.__forcedSkills = [];
      globalThis.__opposingBattlers = [];
      globalThis.__lastOpposingProximity = null;
      globalThis.__forceMapActionHook = null;
    });

    it('parses autoExecuteSkill tuples on item rows', () =>
    {
      // Arrange
      const itemRow = Object.assign(Object.create(globalThis.RPG_BaseItem.prototype), {
        id: 1,
        meta: {},
        name: 'Src',
        note: '<autoExecuteSkill:[500, time, 60]>',
        description: String.empty,
        iconIndex: 0,
      });

      // Act & Assert
      expect(itemRow.autoExecuteSkillRules[0]).toEqual([ 500, 'time', 60 ]);
    });

    it('parses autoExecuteSkill tuples on battler rows', () =>
    {
      // Arrange
      const battlerRow = Object.assign(Object.create(globalThis.RPG_BaseBattler.prototype), {
        id: 2,
        meta: {},
        name: 'Enemy',
        note: '<autoExecuteSkill:[501, enemiesNearby, 1, 30, 2]>',
        description: String.empty,
        iconIndex: 0,
      });

      // Act & Assert
      expect(battlerRow.autoExecuteSkillRules[0]).toEqual([ 501, 'enemiesNearby', 1, 30, 2 ]);
    });

    it('fires time rules once per cooldown window', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoExecuteSkill:[500, time, 60]>' ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[500] = { id: 500, stypeId: 1 };

      // Act
      globalThis.AutoExecuteSkillManager.processTimeRules(actor);
      globalThis.AutoExecuteSkillManager.processTimeRules(actor);

      // Assert
      expect(globalThis.__forcedSkills).toEqual([ 500 ]);
    });

    it('fires again after the cooldown window elapses', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoExecuteSkill:[500, time, 60]>' ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[500] = { id: 500, stypeId: 1 };
      globalThis.AutoExecuteSkillManager.processTimeRules(actor);
      globalThis.Graphics.frameCount = 1061;

      // Act
      globalThis.AutoExecuteSkillManager.processTimeRules(actor);

      // Assert
      expect(globalThis.__forcedSkills).toEqual([ 500, 500 ]);
    });

    it('gates enemiesNearby until enough opposing battlers are in range', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoExecuteSkill:[502, enemiesNearby, 1, 1]>' ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[502] = { id: 502, stypeId: 1 };
      globalThis.__opposingBattlers = [];

      // Act
      globalThis.AutoExecuteSkillManager.processEnemiesNearbyRules(actor);

      // Assert
      expect(globalThis.__forcedSkills.length).toBe(0);
    });

    it('fires enemiesNearby once the minimum count is present', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoExecuteSkill:[502, enemiesNearby, 1, 1]>' ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[502] = { id: 502, stypeId: 1 };
      globalThis.__opposingBattlers = [ {} ];

      // Act
      globalThis.AutoExecuteSkillManager.processEnemiesNearbyRules(actor);

      // Assert
      expect(globalThis.__forcedSkills).toEqual([ 502 ]);
    });

    it('passes the optional trigger tile radius to the opposing battler lookup', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoExecuteSkill:[503, enemiesNearby, 1, 1, 2]>' ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[503] = { id: 503, stypeId: 1 };
      globalThis.__opposingBattlers = [ {} ];

      // Act
      globalThis.AutoExecuteSkillManager.processEnemiesNearbyRules(actor);

      // Assert
      expect(globalThis.__lastOpposingProximity).toBe(2);
    });

    it('fires each enemiesNearby tuple on one row when every gate passes', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([
        '<autoExecuteSkill:[508, enemiesNearby, 2, 1]>\n<autoExecuteSkill:[508, enemiesNearby, 4, 1]>',
      ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[508] = { id: 508, stypeId: 1 };
      globalThis.__opposingBattlers = [ {}, {}, {}, {} ];

      // Act
      globalThis.AutoExecuteSkillManager.processEnemiesNearbyRules(actor);

      // Assert
      expect(globalThis.__forcedSkills).toEqual([ 508, 508 ]);
    });

    it('blocks nested auto-execute at max depth 1', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoExecuteSkill:[504, time, 1]>' ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[504] = { id: 504, stypeId: 1 };
      globalThis.__forceMapActionHook = () => actor.tryAutoExecuteSkills('time');

      // Act
      globalThis.AutoExecuteSkillManager.processTimeRules(actor);

      // Assert
      expect(globalThis.__forcedSkills).toEqual([ 504 ]);
    });

    it('credits move auto-execute only after the configured whole-tile count', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoExecuteSkill:[505, move, 2]>' ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[505] = { id: 505, stypeId: 1 };

      // Act
      globalThis.AutoExecuteSkillManager.creditTileStep(actor);
      globalThis.AutoExecuteSkillManager.creditTileStep(actor);

      // Assert
      expect(globalThis.__forcedSkills).toEqual([ 505 ]);
    });

    it('fires stand auto-execute when the battler has been idle', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoExecuteSkill:[506, stand, 1]>' ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[506] = { id: 506, stypeId: 1 };
      actor._j._passive._conditional._lastMovedFrame = 998;

      // Act
      globalThis.AutoExecuteSkillManager.processStandRules(actor);

      // Assert
      expect(globalThis.__forcedSkills).toEqual([ 506 ]);
    });

    it('scheduleDamageTriggers invokes auto-execute hpDmg rules', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoExecuteSkill:[507, hpDmg, 1]>' ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[507] = { id: 507, stypeId: 1 };

      // Act
      globalThis.AutoExecuteSkillManager.scheduleDamageTriggers(actor, 'hpDmg');

      // Assert
      expect(globalThis.__forcedSkills).toEqual([ 507 ]);
    });
  });

  describe('autoInflictState scheduler', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 1000;
      globalThis.$jabsEngine = { absEnabled: true };
      globalThis.$dataStates = [];
    });

    function stubPolarityState(stateId, isNegative)
    {
      globalThis.$dataStates[stateId] = { id: stateId, isNegativeType: () => isNegative };
    }

    it('parses autoInflictState tuples on item rows', () =>
    {
      // Arrange
      const itemRow = Object.assign(Object.create(globalThis.RPG_BaseItem.prototype), {
        id: 1,
        meta: {},
        name: 'Src',
        note: '<autoInflictState:[70, negaStateInflicted, 0]>',
        description: String.empty,
        iconIndex: 0,
      });

      // Act & Assert
      expect(itemRow.autoInflictStateRules[0]).toEqual([ 70, 'negaStateInflicted', 0 ]);
    });

    it('parses autoInflictState tuples on battler rows', () =>
    {
      // Arrange
      const battlerRow = Object.assign(Object.create(globalThis.RPG_BaseBattler.prototype), {
        id: 2,
        meta: {},
        name: 'Rupert',
        note: '<autoInflictState:[71, anyStateInflicted, 60]>',
        description: String.empty,
        iconIndex: 0,
      });

      // Act & Assert
      expect(battlerRow.autoInflictStateRules[0]).toEqual([ 71, 'anyStateInflicted', 60 ]);
    });

    it('applies the payload state onto the target, not the inflicting applier', () =>
    {
      // Arrange
      stubPolarityState(10, true);
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, negaStateInflicted, 0]>' ]);
      const targetApplied = [];
      const applierApplied = [];
      const target = { isStateAddable: () => true, addState: (stateId) => targetApplied.push(stateId) };
      applier.addState = (stateId) => applierApplied.push(stateId);

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Assert
      expect(targetApplied).toEqual([ 70 ]);
      expect(applierApplied).toEqual([]);
    });

    it('credits the applier as the inflicted state\'s source', () =>
    {
      // Arrange
      stubPolarityState(10, true);
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, negaStateInflicted, 0]>' ]);
      const sources = [];
      const target = { isStateAddable: () => true, addState: (stateId, source) => sources.push(source) };

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Assert
      expect(sources).toEqual([ applier ]);
    });

    it('only fires negaStateInflicted rules when the inflicted state is negative', () =>
    {
      // Arrange
      stubPolarityState(10, false);
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, negaStateInflicted, 0]>' ]);
      const target = { isStateAddable: () => true, addState: vi.fn() };

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Assert
      expect(target.addState).not.toHaveBeenCalled();
    });

    it('fires posiStateInflicted rules only when the inflicted state is not negative', () =>
    {
      // Arrange
      stubPolarityState(10, false);
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, posiStateInflicted, 0]>' ]);
      const target = { isStateAddable: () => true, addState: vi.fn() };

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Assert
      expect(target.addState).toHaveBeenCalledWith(70, applier);
    });

    it('anyStateInflicted rules fire regardless of polarity', () =>
    {
      // Arrange
      stubPolarityState(10, true);
      stubPolarityState(11, false);
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, anyStateInflicted, 0]>' ]);
      const negativeApplies = [];
      const positiveApplies = [];

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(
        applier, { isStateAddable: () => true, addState: (id) => negativeApplies.push(id) }, 10);
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(
        applier, { isStateAddable: () => true, addState: (id) => positiveApplies.push(id) }, 11);

      // Assert
      expect(negativeApplies).toEqual([ 70 ]);
      expect(positiveApplies).toEqual([ 70 ]);
    });

    it('respects the cooldown, tracked on the applier, across multiple targets', () =>
    {
      // Arrange
      stubPolarityState(10, true);
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, negaStateInflicted, 60]>' ]);
      const applied = [];
      const target = { isStateAddable: () => true, addState: (id) => applied.push(id) };
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Act- still within the 60-frame cooldown window: should not fire again.
      globalThis.Graphics.frameCount += 30;
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Assert
      expect(applied).toEqual([ 70 ]);
    });

    it('fires again once the cooldown window has elapsed', () =>
    {
      // Arrange
      stubPolarityState(10, true);
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, negaStateInflicted, 60]>' ]);
      const applied = [];
      const target = { isStateAddable: () => true, addState: (id) => applied.push(id) };
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);
      globalThis.Graphics.frameCount += 30;
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Act
      globalThis.Graphics.frameCount += 31;
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Assert
      expect(applied).toEqual([ 70, 70 ]);
    });

    it('does not dispatch when the target rejects the state as unaddable', () =>
    {
      // Arrange
      stubPolarityState(10, true);
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, negaStateInflicted, 0]>' ]);
      const target = { isStateAddable: () => false, addState: vi.fn() };

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Assert
      expect(target.addState).not.toHaveBeenCalled();
    });

    it('does nothing when the JABS engine is disabled', () =>
    {
      // Arrange
      stubPolarityState(10, true);
      globalThis.$jabsEngine.absEnabled = false;
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, negaStateInflicted, 0]>' ]);
      const target = { isStateAddable: () => true, addState: vi.fn() };

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Assert
      expect(target.addState).not.toHaveBeenCalled();
    });

    it('depth-guards dispatch against synchronous re-entry from the applied state', () =>
    {
      // Arrange
      const applier = buildMomentumToolkitActor([]);
      const dispatchCalls = [];
      const target = {
        isStateAddable: () => true,
        addState()
        {
          dispatchCalls.push('dispatched');
          // simulate the newly-applied state itself re-triggering this same manager.
          globalThis.AutoInflictStateManager.dispatch(target, 70, applier);
        },
      };

      // Act
      globalThis.AutoInflictStateManager.dispatch(target, 70, applier);

      // Assert- default max depth is 1: the outer call dispatches, the nested re-entrant call does not.
      expect(dispatchCalls).toEqual([ 'dispatched' ]);
    });

    it('scheduleKnockbackTriggers applies the payload state onto the knocked-back target', () =>
    {
      // Arrange
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[73, onKnockback, 0]>' ]);
      const applied = [];
      const sources = [];
      const target = {
        isStateAddable: () => true,
        addState: (stateId, source) => { applied.push(stateId); sources.push(source); },
      };

      // Act
      globalThis.AutoInflictStateManager.scheduleKnockbackTriggers(applier, target);

      // Assert
      expect(applied).toEqual([ 73 ]);
      expect(sources).toEqual([ applier ]);
    });

    it('scheduleKnockbackTriggers ignores negaStateInflicted rules and vice versa', () =>
    {
      // Arrange
      stubPolarityState(10, true);
      const applier = buildMomentumToolkitActor([
        '<autoInflictState:[70, negaStateInflicted, 0]>',
        '<autoInflictState:[73, onKnockback, 0]>',
      ]);
      const knockbackApplies = [];
      const inflictApplies = [];

      // Act
      globalThis.AutoInflictStateManager.scheduleKnockbackTriggers(
        applier, { isStateAddable: () => true, addState: (id) => knockbackApplies.push(id) });
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(
        applier, { isStateAddable: () => true, addState: (id) => inflictApplies.push(id) }, 10);

      // Assert
      expect(knockbackApplies).toEqual([ 73 ]);
      expect(inflictApplies).toEqual([ 70 ]);
    });
  });

  describe('onJabsStateInflicted wiring', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 1000;
      globalThis.$jabsEngine = { absEnabled: true };
      globalThis.$dataStates = [];
    });

    it('fires both autoInflictState (onto the target) and autoModifyCooldowns (onto the applier) from one real state-inflicted event', () =>
    {
      // Arrange
      globalThis.$dataStates[10] = { id: 10, isNegativeType: () => true };
      const applier = buildMomentumToolkitActor([
        '<autoInflictState:[70, negaStateInflicted, 0]>',
        '<autoModifyCooldowns:[-60, negaStateInflicted, 0, flat, all]>',
      ]);
      const mainhandCooldown = { frames: 100, maxFrames: 300, modBaseFrames: vi.fn() };
      applier.getSkillSlotManager = () => ({
        getEquippedSlots: () => [ { key: globalThis.JABS_Button.Mainhand, getCooldown: () => mainhandCooldown } ],
      });
      const target = buildMomentumToolkitActor();
      target.isStateAddable = () => true;
      target.addState = vi.fn();

      // Act- calling the real prototype method, not the schedulers directly.
      target.onJabsStateInflicted(10, applier);

      // Assert- the payload state landed on the target, crediting the applier as source.
      expect(target.addState).toHaveBeenCalledWith(70, applier);
      // Assert- the cooldown modification landed on the applier itself, not the target.
      expect(mainhandCooldown.modBaseFrames).toHaveBeenCalledWith(-60);
    });

    it('does not modify cooldowns when no autoModifyCooldowns rule matches the inflicted polarity', () =>
    {
      // Arrange
      globalThis.$dataStates[11] = { id: 11, isNegativeType: () => false };
      const applier = buildMomentumToolkitActor([
        '<autoModifyCooldowns:[-60, negaStateInflicted, 0, flat, all]>',
      ]);
      const mainhandCooldown = { frames: 100, maxFrames: 300, modBaseFrames: vi.fn() };
      applier.getSkillSlotManager = () => ({
        getEquippedSlots: () => [ { key: globalThis.JABS_Button.Mainhand, getCooldown: () => mainhandCooldown } ],
      });
      const target = buildMomentumToolkitActor();
      target.isStateAddable = () => true;
      target.addState = vi.fn();

      // Act- state 11 is positive, so the negaStateInflicted rule should not fire.
      target.onJabsStateInflicted(11, applier);

      // Assert
      expect(mainhandCooldown.modBaseFrames).not.toHaveBeenCalled();
    });
  });

  describe('onKill scheduler', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 1000;
      globalThis.$jabsEngine = { absEnabled: true };
    });

    it('scheduleKillTriggers fires onKill rules on the killing battler', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoApplyState:[80, onKill, 0]>' ]);
      const applied = [];
      actor.isStateAddable = () => true;
      actor.addState = (stateId) => applied.push(stateId);

      // Act
      globalThis.AutoApplyStateManager.scheduleKillTriggers(actor);

      // Assert
      expect(applied).toEqual([ 80 ]);
    });

    it('scheduleKillTriggers does nothing without a battler', () =>
    {
      // Arrange & Act- should not throw when called with a null/undefined battler (unattributed defeats).
      const act = () => globalThis.AutoApplyStateManager.scheduleKillTriggers(null);

      // Assert
      expect(act).not.toThrow();
    });

    it('JABS_Engine#handleDefeatedEnemy fires onKill rules on the caster', () =>
    {
      // Arrange
      const caster = buildMomentumToolkitActor([ '<autoApplyState:[81, onKill, 0]>' ]);
      const applied = [];
      caster.isStateAddable = () => true;
      caster.addState = (stateId) => applied.push(stateId);
      const casterJabsBattler = { getBattler: () => caster };
      const defeatedTargetJabsBattler = {
        clearFollowers: vi.fn(),
        clearLeader: vi.fn(),
        getCharacter: () => ({ start: vi.fn() }),
        isInanimate: () => true,
        hasEventActions: () => false,
        setDying: vi.fn(),
      };
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.handleDefeatedEnemy(defeatedTargetJabsBattler, casterJabsBattler);

      // Assert
      expect(applied).toEqual([ 81 ]);
    });

    it('JABS_Engine#handleDefeatedEnemy does not throw for an unattributed defeat', () =>
    {
      // Arrange
      const defeatedTargetJabsBattler = {
        clearFollowers: vi.fn(),
        clearLeader: vi.fn(),
        getCharacter: () => ({ start: vi.fn() }),
        isInanimate: () => true,
        hasEventActions: () => false,
        setDying: vi.fn(),
      };
      const engine = new globalThis.JABS_Engine();

      // Act
      const act = () => engine.handleDefeatedEnemy(defeatedTargetJabsBattler, null);

      // Assert
      expect(act).not.toThrow();
    });
  });

  describe('JABS_Engine#checkKnockback hook', () =>
  {
    it('fires onKnockback autoInflictState rules on the caster, targeting the knocked-back battler', () =>
    {
      // Arrange
      globalThis.Graphics.frameCount = 1000;
      globalThis.$jabsEngine = { absEnabled: true };
      const caster = buildMomentumToolkitActor([ '<autoInflictState:[74, onKnockback, 0]>' ]);
      const knockedBack = { isStateAddable: () => true, addState: vi.fn() };
      const action = { getCaster: () => ({ getBattler: () => caster }) };
      const targetJabsBattler = { getBattler: () => knockedBack };
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.checkKnockback(action, targetJabsBattler);

      // Assert
      expect(knockedBack.addState).toHaveBeenCalledWith(74, caster);
    });
  });

  describe('onDamageDealt scheduler', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 1000;
      globalThis.$jabsEngine = { absEnabled: true };
    });

    function buildJabsWrapper(gameBattler, team)
    {
      return { getBattler: () => gameBattler, getTeam: () => team };
    }

    it('scheduleDamageDealtTriggers fires onDamageDealt rules on the dealing battler', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoApplyState:[90, onDamageDealt, 0]>' ]);
      const applied = [];
      actor.isStateAddable = () => true;
      actor.addState = (stateId) => applied.push(stateId);

      // Act
      globalThis.AutoApplyStateManager.scheduleDamageDealtTriggers(actor);

      // Assert
      expect(applied).toEqual([ 90 ]);
    });

    it('JABS_Engine#postExecuteSkillEffects fires onDamageDealt when damage landed on an opposing battler', () =>
    {
      // Arrange
      const caster = buildMomentumToolkitActor([ '<autoApplyState:[91, onDamageDealt, 0]>' ]);
      const applied = [];
      caster.isStateAddable = () => true;
      caster.addState = (stateId) => applied.push(stateId);
      const targetBattler = { result: () => ({ hpDamage: 50, mpDamage: 0, tpDamage: 0 }) };
      const action = { getCaster: () => buildJabsWrapper(caster, 0), getCooldownType: () => 'CombatSkill1' };
      const target = buildJabsWrapper(targetBattler, 1);
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(applied).toEqual([ 91 ]);
    });

    it('does not fire onDamageDealt for same-team hits (friendly fire)', () =>
    {
      // Arrange
      const caster = buildMomentumToolkitActor([ '<autoApplyState:[92, onDamageDealt, 0]>' ]);
      caster.isStateAddable = () => true;
      caster.addState = vi.fn();
      const targetBattler = { result: () => ({ hpDamage: 50, mpDamage: 0, tpDamage: 0 }) };
      const action = { getCaster: () => buildJabsWrapper(caster, 0), getCooldownType: () => 'CombatSkill1' };
      const target = buildJabsWrapper(targetBattler, 0);
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(caster.addState).not.toHaveBeenCalled();
    });

    it('does not fire onDamageDealt when no damage actually landed (miss/heal/parry)', () =>
    {
      // Arrange
      const caster = buildMomentumToolkitActor([ '<autoApplyState:[93, onDamageDealt, 0]>' ]);
      caster.isStateAddable = () => true;
      caster.addState = vi.fn();
      const targetBattler = { result: () => ({ hpDamage: 0, mpDamage: 0, tpDamage: 0 }) };
      const action = { getCaster: () => buildJabsWrapper(caster, 0), getCooldownType: () => 'CombatSkill1' };
      const target = buildJabsWrapper(targetBattler, 1);
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(caster.addState).not.toHaveBeenCalled();
    });
  });

  describe('onDamageDealt scheduler > onWeaponHit scheduler', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 1000;
      globalThis.$jabsEngine = { absEnabled: true };
    });

    function buildJabsWrapper(gameBattler, team)
    {
      return { getBattler: () => gameBattler, getTeam: () => team };
    }

    it('fires onWeaponHit when damage lands from the Mainhand slot', () =>
    {
      // Arrange
      const caster = buildMomentumToolkitActor([ '<autoApplyState:[94, onWeaponHit, 0]>' ]);
      const applied = [];
      caster.isStateAddable = () => true;
      caster.addState = (stateId) => applied.push(stateId);
      const targetBattler = { result: () => ({ hpDamage: 50, mpDamage: 0, tpDamage: 0 }) };
      const action = { getCaster: () => buildJabsWrapper(caster, 0), getCooldownType: () => 'Main' };
      const target = buildJabsWrapper(targetBattler, 1);
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(applied).toEqual([ 94 ]);
    });

    it('fires onWeaponHit when damage lands from the Offhand slot', () =>
    {
      // Arrange
      const caster = buildMomentumToolkitActor([ '<autoApplyState:[95, onWeaponHit, 0]>' ]);
      const applied = [];
      caster.isStateAddable = () => true;
      caster.addState = (stateId) => applied.push(stateId);
      const targetBattler = { result: () => ({ hpDamage: 50, mpDamage: 0, tpDamage: 0 }) };
      const action = { getCaster: () => buildJabsWrapper(caster, 0), getCooldownType: () => 'Offhand' };
      const target = buildJabsWrapper(targetBattler, 1);
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(applied).toEqual([ 95 ]);
    });

    it('does not fire onWeaponHit when damage lands from a non-weapon slot', () =>
    {
      // Arrange: an arbitrary skill (e.g. a nuke) should not proc a "weapon" follow-up.
      const caster = buildMomentumToolkitActor([ '<autoApplyState:[96, onWeaponHit, 0]>' ]);
      caster.isStateAddable = () => true;
      caster.addState = vi.fn();
      const targetBattler = { result: () => ({ hpDamage: 50, mpDamage: 0, tpDamage: 0 }) };
      const action = { getCaster: () => buildJabsWrapper(caster, 0), getCooldownType: () => 'CombatSkill1' };
      const target = buildJabsWrapper(targetBattler, 1);
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(caster.addState).not.toHaveBeenCalled();
    });
  });

  describe('onAllyHeal scheduler', () =>
  {
    let originalNearbyAlliesExcludingSelf;

    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 1000;
      globalThis.$jabsEngine = { absEnabled: true };
      originalNearbyAlliesExcludingSelf = globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf;
    });

    afterEach(() =>
    {
      globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = originalNearbyAlliesExcludingSelf;
    });

    it('fires onAllyHeal on each nearby ally\'s own rules, not on the healed battler', () =>
    {
      // Arrange
      const healedBattler = buildMomentumToolkitActor([]);
      healedBattler.isStateAddable = () => true;
      healedBattler.addState = vi.fn();
      const nearbyAlly = buildMomentumToolkitActor([ '<autoApplyState:[95, onAllyHeal, 0]>' ]);
      const allyApplied = [];
      nearbyAlly.isStateAddable = () => true;
      nearbyAlly.addState = (stateId) => allyApplied.push(stateId);
      globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = () => [ { getBattler: () => nearbyAlly } ];

      // Act
      healedBattler.onHeal(globalThis.J.BASE.Resource.HP, 10);

      // Assert
      expect(allyApplied).toEqual([ 95 ]);
      expect(healedBattler.addState).not.toHaveBeenCalled();
    });

    it('does not throw when there are no nearby allies', () =>
    {
      // Arrange
      const healedBattler = buildMomentumToolkitActor([]);
      globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = () => [];

      // Act
      const act = () => healedBattler.onHeal(globalThis.J.BASE.Resource.MP, 5);

      // Assert
      expect(act).not.toThrow();
    });

    it('fires onAllyHeal regardless of which resource was restored', () =>
    {
      // Arrange
      const healedBattler = buildMomentumToolkitActor([]);
      const nearbyAlly = buildMomentumToolkitActor([ '<autoApplyState:[96, onAllyHeal, 0]>' ]);
      const allyApplied = [];
      nearbyAlly.isStateAddable = () => true;
      nearbyAlly.addState = (stateId) => allyApplied.push(stateId);
      globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = () => [ { getBattler: () => nearbyAlly } ];

      // Act
      healedBattler.onHeal(globalThis.J.BASE.Resource.TP, 3);

      // Assert
      expect(allyApplied).toEqual([ 96 ]);
    });
  });
});
//endregion plugins/passive/_component/j-passive-conditional.test.js
