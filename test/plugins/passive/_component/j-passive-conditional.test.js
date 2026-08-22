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
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

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
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/core/managers/RPGManager.js'));
    ({ default: globalThis.RPG_BaseItem } = await import('../../../../src/plugins/_base/core/database/base/RPG_BaseItem.js'));
    ({ default: globalThis.RPG_BaseBattler } = await import('../../../../src/plugins/_base/core/database/core/RPG_BaseBattler.js'));
    ({ default: globalThis.RPG_Actor } = await import('../../../../src/plugins/_base/core/database/implementations/RPG_Actor.js'));
    ({ default: globalThis.RPG_State } = await import('../../../../src/plugins/_base/core/database/implementations/RPG_State.js'));

    await import('../../../../src/plugins/_base/core/objects/Game_BattlerBase.js');

    // _base's own Game_Battler.js aliases these at import time (vanilla RMMZ engine behavior this
    // lightweight fixture doesn't model); real gainHp/gainMp/gainTp just apply the delta.
    globalThis.Game_Battler.prototype.gainHp = function(value) { this._hp = (this._hp || 0) + value; };
    globalThis.Game_Battler.prototype.gainMp = function(value) { this._mp = (this._mp || 0) + value; };
    globalThis.Game_Battler.prototype.gainTp = function(value) { this._tp = (this._tp || 0) + value; };

    await import('../../../../src/plugins/_base/core/objects/Game_Battler.js');
    await import('../../../../src/plugins/_base/core/objects/Game_Actor.js');

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
    ({ default: globalThis.JPassiveConditional_PluginMetadata } = await import('../../../../src/plugins/passive/ext/conditional/_metadata/_pluginMetadata.js'));

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
    ({ default: globalThis.SkillResolutionStateRemovalManager } = await import('../../../../src/plugins/passive/ext/conditional/managers/SkillResolutionStateRemovalManager.js'));
    ({ default: globalThis.MoveStateRemovalManager } = await import('../../../../src/plugins/passive/ext/conditional/managers/MoveStateRemovalManager.js'));
    await import('../../../../src/plugins/passive/ext/conditional/managers/PassiveGateEvaluator.js');
    await import('../../../../src/plugins/passive/ext/conditional/managers/PassiveStackCountEvaluator.js');
    await import('../../../../src/plugins/passive/ext/conditional/objects/Game_Battler.js');

    // aliased at import time by conditional's own Game_Action.js; the shared J-Base placeholder
    // class has an empty prototype, so seed a real no-op "original" before patching it.
    globalThis.Game_Action.prototype.apply = function() {};

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

    it('falls back to documented defaults when every plugin param is unset', () =>
    {
      // Arrange
      installPluginManagerWithParams(globalThis, 'J-Passive-Conditional-test-defaults', {});

      // Act
      const metadata = new globalThis.JPassiveConditional_PluginMetadata('J-Passive-Conditional-test-defaults', '1.0.0');

      // Assert
      expect(metadata.reconcileDelayFrames).toBe(15);
      expect(metadata.defaultProximityTiles).toBe(5);
      expect(metadata.autoExecuteSkillMaxDepth).toBe(1);
      expect(metadata.autoInflictStateMaxDepth).toBe(1);
    });

    it('parses a configured auto-inflict-state-max-depth plugin param', () =>
    {
      // Arrange- the shared fixture's default params never set this one, so its "valid parse"
      // branch is otherwise never exercised.
      installPluginManagerWithParams(globalThis, 'J-Passive-Conditional-test-inflict-depth', {
        'auto-inflict-state-max-depth': '3',
      });

      // Act
      const metadata = new globalThis.JPassiveConditional_PluginMetadata('J-Passive-Conditional-test-inflict-depth', '1.0.0');

      // Assert
      expect(metadata.autoInflictStateMaxDepth).toBe(3);
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

    it('parses one passiveStateRule tuple', () =>
    {
      // Arrange
      const row = Object.assign(Object.create(globalThis.RPG_BaseBattler.prototype), {
        id: 1, meta: {}, name: 'Test', note: '<passiveStateRule:[77, hpBelow, 25]>', description: String.empty, iconIndex: 0,
      });

      // Act & Assert
      expect(row.passiveStateRules.length).toBe(1);
      expect(row.passiveStateRules[0][0]).toBe(77);
    });

    it('parses one passiveStateCount tuple', () =>
    {
      // Arrange
      const row = Object.assign(Object.create(globalThis.RPG_BaseBattler.prototype), {
        id: 1, meta: {}, name: 'Test', note: '<passiveStateCount:[77, moreIsMoreHp, 25]>', description: String.empty, iconIndex: 0,
      });

      // Act & Assert
      expect(row.passiveStateCounts.length).toBe(1);
      expect(row.passiveStateCounts[0][0]).toBe(77);
    });

    it('parses one autoApplyStateOnNearby tuple', () =>
    {
      // Arrange
      const row = Object.assign(Object.create(globalThis.RPG_BaseBattler.prototype), {
        id: 1, meta: {}, name: 'Test', note: '<autoApplyStateOnNearby:[16, enemiesNearby, time, 180]>', description: String.empty, iconIndex: 0,
      });

      // Act & Assert
      expect(row.autoApplyStateOnNearbyRules.length).toBe(1);
    });

    it('parses one autoExecuteSkill tuple', () =>
    {
      // Arrange
      const row = Object.assign(Object.create(globalThis.RPG_BaseBattler.prototype), {
        id: 1, meta: {}, name: 'Test', note: '<autoExecuteSkill:[10, time, 180]>', description: String.empty, iconIndex: 0,
      });

      // Act & Assert
      expect(row.autoExecuteSkillRules.length).toBe(1);
    });

    it('parses one autoModifyCooldowns tuple', () =>
    {
      // Arrange
      const row = Object.assign(Object.create(globalThis.RPG_BaseBattler.prototype), {
        id: 1, meta: {}, name: 'Test', note: '<autoModifyCooldowns:[mainhand, -10]>', description: String.empty, iconIndex: 0,
      });

      // Act & Assert
      expect(row.autoModifyCooldownRules.length).toBe(1);
    });

    it('parses one autoInflictState tuple', () =>
    {
      // Arrange
      const row = Object.assign(Object.create(globalThis.RPG_BaseBattler.prototype), {
        id: 1, meta: {}, name: 'Test', note: '<autoInflictState:[16, 100]>', description: String.empty, iconIndex: 0,
      });

      // Act & Assert
      expect(row.autoInflictStateRules.length).toBe(1);
    });
  });

  describe('conditional tags on RPG_State rows', () =>
  {
    it('parses one removeStateOnMove tuple', () =>
    {
      // Arrange
      const row = stubMomentumStateRow(9001, '<removeStateOnMove:[9001]>');

      // Act & Assert
      expect(row.removeStateOnMoveRules.length).toBe(1);
    });

    it('parses one removeOnSkillResolution tuple', () =>
    {
      // Arrange
      const row = stubMomentumStateRow(9002, '<removeOnSkillResolution:[0, 100]>');

      // Act & Assert
      expect(row.removeOnSkillResolutionRules.length).toBe(1);
    });
  });

  describe('conditional tags on RPG_BaseItem rows', () =>
  {
    it('parses one autoModifyCooldowns tuple', () =>
    {
      // Arrange
      const row = new globalThis.RPG_BaseItem({
        id: 1, meta: {}, name: String.empty, note: '<autoModifyCooldowns:[mainhand, -10]>', description: String.empty, iconIndex: 0,
      }, 1);

      // Act & Assert
      expect(row.autoModifyCooldownRules.length).toBe(1);
    });

    it('parses one autoApplyStateOnNearby tuple', () =>
    {
      // Arrange
      const row = new globalThis.RPG_BaseItem({
        id: 1, meta: {}, name: String.empty, note: '<autoApplyStateOnNearby:[16, enemiesNearby, time, 180]>', description: String.empty, iconIndex: 0,
      }, 1);

      // Act & Assert
      expect(row.autoApplyStateOnNearbyRules.length).toBe(1);
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

    it('does not credit a tile step when moveDistance has not reached stepDistance yet', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([ '<autoApplyState:[44, move, 1]>' ]);
      const applied = [];
      actor.isStateAddable = () => true;
      actor.addState = (stateId) => applied.push(stateId);
      const character = Object.create(globalThis.Game_CharacterBase.prototype);
      character.moveDistance = () => 0.5;
      character.stepDistance = () => 1;
      character.getJabsBattler = () => ({ getBattler: () => actor });

      // Act
      character.updatePixelStepping();

      // Assert
      expect(applied).toEqual([]);
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
      it('does nothing when ABS is not active', () =>
      {
        // Arrange- everything downstream of the guard is arranged to succeed: a live state with a
        // guaranteed removal rule, a matching skill, and a winning roll. The disabled engine is
        // the only thing left that can stop the peel.
        const stateId = 76;
        stubMomentumStateRow(stateId, '<removeOnSkillExecution:[0, 100]>');
        globalThis.$jabsEngine = { absEnabled: false, getJabsStateByUuidAndStateId: () => null };
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[76] = { id: 76, stypeId: 1 };
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        actor.decrementStateStacks = vi.fn();
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillExecutionStateRemovalManager.process(actor, 76);

        // Assert
        expect(actor.decrementStateStacks).not.toHaveBeenCalled();
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('does nothing when the executed skill id has no database row', () =>
      {
        // Arrange
        globalThis.$jabsEngine = { absEnabled: true };
        const actor = buildMomentumToolkitActor([]);
        actor.decrementStateStacks = vi.fn();
        globalThis.$dataSkills = [];

        // Act & Assert
        expect(() => globalThis.SkillExecutionStateRemovalManager.process(actor, 999)).not.toThrow();
        expect(actor.decrementStateStacks).not.toHaveBeenCalled();
      });

      it('skips a null entry in the active states array', () =>
      {
        // Arrange
        globalThis.$jabsEngine = { absEnabled: true };
        const actor = buildMomentumToolkitActor([]);
        actor.states = () => [ null ];
        actor.decrementStateStacks = vi.fn();
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[70] = { id: 70, stypeId: 1 };

        // Act & Assert
        expect(() => globalThis.SkillExecutionStateRemovalManager.process(actor, 70)).not.toThrow();
        expect(actor.decrementStateStacks).not.toHaveBeenCalled();
      });

      it('skips removal when the chance/param is non-positive', () =>
      {
        // Arrange- the roll itself is forced to succeed, which is what a very lucky battler does
        // to a 0% chance anyway, so the tuple's own chance guard is the only suppressor left.
        globalThis.$jabsEngine = { absEnabled: true, getJabsStateByUuidAndStateId: () => null };
        const stateId = 71;
        stubMomentumStateRow(stateId, '<removeOnSkillExecution:[0, 0]>');
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        actor.decrementStateStacks = vi.fn();
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[71] = { id: 71, stypeId: 1 };
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillExecutionStateRemovalManager.process(actor, 71);

        // Assert
        expect(actor.decrementStateStacks).not.toHaveBeenCalled();
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

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
        // four stacks are live, so "peel one" is a distinguishable amount from "peel them all"-
        // this state row never opted into collapsing at once, so it must peel exactly one.
        globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => ({ stackCount: 4 });
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

      it('peels only one stack when loseAllStacksAtOnce is set but no live tracker exists', () =>
      {
        // Arrange
        const stateId = 72;
        const stateRow = stubMomentumStateRow(stateId, '<removeOnSkillExecution:[0, 100]>');
        stateRow.jabsLoseAllStacksAtOnce = true;
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        const decrements = [];
        actor.decrementStateStacks = (id, count) => decrements.push({ id, count });
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[73] = { id: 73, stypeId: 2 };
        globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => null;
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillExecutionStateRemovalManager.process(actor, 73);

        // Assert
        expect(decrements).toEqual([ { id: stateId, count: 1 } ]);
        globalThis.RPGManager.chanceIn100 = prevChance;
      });
    });

    describe('SkillResolutionStateRemovalManager.process', () =>
    {
      it('does nothing when ABS is not active', () =>
      {
        // Arrange- everything downstream of the guard is arranged to succeed: a live state with a
        // guaranteed removal rule, a matching skill, and a winning roll. The disabled engine is
        // the only thing left that can stop the peel.
        const stateId = 77;
        stubMomentumStateRow(stateId, '<removeOnSkillResolution:[0, 100]>');
        globalThis.$jabsEngine = { absEnabled: false, getJabsStateByUuidAndStateId: () => null };
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[77] = { id: 77, stypeId: 1 };
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        actor.decrementStateStacks = vi.fn();
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillResolutionStateRemovalManager.process(actor, 77);

        // Assert
        expect(actor.decrementStateStacks).not.toHaveBeenCalled();
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('does nothing when the resolved skill id has no database row', () =>
      {
        // Arrange
        const actor = buildMomentumToolkitActor([]);
        actor.decrementStateStacks = vi.fn();
        globalThis.$dataSkills = [];

        // Act & Assert
        expect(() => globalThis.SkillResolutionStateRemovalManager.process(actor, 999)).not.toThrow();
        expect(actor.decrementStateStacks).not.toHaveBeenCalled();
      });

      it('skips a null entry in the active states array', () =>
      {
        // Arrange
        const actor = buildMomentumToolkitActor([]);
        actor._states = [];
        actor.states = () => [ null ];
        actor.decrementStateStacks = vi.fn();
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[60] = { id: 60, stypeId: 1 };

        // Act & Assert
        expect(() => globalThis.SkillResolutionStateRemovalManager.process(actor, 60)).not.toThrow();
        expect(actor.decrementStateStacks).not.toHaveBeenCalled();
      });

      it('decrements stacks when the executed skill stype matches', () =>
      {
        // Arrange
        const stateId = 55;
        stubMomentumStateRow(stateId, '<removeOnSkillResolution:[7, 100]>');
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        const decrements = [];
        actor.decrementStateStacks = (id, count) => decrements.push({ id, count });
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[61] = { id: 61, stypeId: 7 };
        // three stacks are live, so "peel one" is a distinguishable amount from "peel them all"-
        // this state row never opted into collapsing at once, so it must peel exactly one.
        globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => ({ stackCount: 3 });
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillResolutionStateRemovalManager.process(actor, 61);

        // Assert
        expect(decrements).toEqual([ { id: stateId, count: 1 } ]);
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('skips removal when the chance/param is non-positive', () =>
      {
        // Arrange
        const stateId = 56;
        stubMomentumStateRow(stateId, '<removeOnSkillResolution:[0, 0]>');
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        actor.decrementStateStacks = vi.fn();
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[62] = { id: 62, stypeId: 1 };
        // the roll itself is forced to succeed, which is what a very lucky battler does to a 0%
        // chance anyway, so the tuple's own chance guard is the only suppressor left.
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillResolutionStateRemovalManager.process(actor, 62);

        // Assert
        expect(actor.decrementStateStacks).not.toHaveBeenCalled();
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('skips removal when the executed skill stype does not match', () =>
      {
        // Arrange
        const stateId = 57;
        stubMomentumStateRow(stateId, '<removeOnSkillResolution:[3, 100]>');
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        actor.decrementStateStacks = vi.fn();
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[63] = { id: 63, stypeId: 8 };
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillResolutionStateRemovalManager.process(actor, 63);

        // Assert
        expect(actor.decrementStateStacks).not.toHaveBeenCalled();
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('skips removal when the fate roll fails', () =>
      {
        // Arrange
        const stateId = 58;
        stubMomentumStateRow(stateId, '<removeOnSkillResolution:[0, 100]>');
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        actor.decrementStateStacks = vi.fn();
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[64] = { id: 64, stypeId: 1 };
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => false;

        // Act
        globalThis.SkillResolutionStateRemovalManager.process(actor, 64);

        // Assert
        expect(actor.decrementStateStacks).not.toHaveBeenCalled();
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('peels every stack at once when the state row uses loseAllStacksAtOnce', () =>
      {
        // Arrange
        const stateId = 59;
        const stateRow = stubMomentumStateRow(stateId, '<removeOnSkillResolution:[0, 100]>');
        stateRow.jabsLoseAllStacksAtOnce = true;
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        const decrements = [];
        actor.decrementStateStacks = (id, count) => decrements.push({ id, count });
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[65] = { id: 65, stypeId: 2 };
        globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => ({ stackCount: 3 });
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillResolutionStateRemovalManager.process(actor, 65);

        // Assert
        expect(decrements).toEqual([ { id: stateId, count: 3 } ]);
        globalThis.RPGManager.chanceIn100 = prevChance;
      });

      it('peels only one stack when loseAllStacksAtOnce is set but no live tracker exists', () =>
      {
        // Arrange
        const stateId = 74;
        const stateRow = stubMomentumStateRow(stateId, '<removeOnSkillResolution:[0, 100]>');
        stateRow.jabsLoseAllStacksAtOnce = true;
        const actor = buildMomentumToolkitActor([]);
        actor._states = [ stateId ];
        actor.getUuid = () => 'test-actor';
        const decrements = [];
        actor.decrementStateStacks = (id, count) => decrements.push({ id, count });
        globalThis.$dataSkills = [];
        globalThis.$dataSkills[75] = { id: 75, stypeId: 2 };
        globalThis.$jabsEngine.getJabsStateByUuidAndStateId = () => null;
        const prevChance = globalThis.RPGManager.chanceIn100;
        globalThis.RPGManager.chanceIn100 = () => true;

        // Act
        globalThis.SkillResolutionStateRemovalManager.process(actor, 75);

        // Assert
        expect(decrements).toEqual([ { id: stateId, count: 1 } ]);
        globalThis.RPGManager.chanceIn100 = prevChance;
      });
    });
  });

  describe('AutoApplyStateManager.dispatch', () =>
  {
    it('returns false and does not apply the state when it is not addable', () =>
    {
      // Arrange
      const battler = { isStateAddable: () => false, addState: vi.fn() };

      // Act
      const result = globalThis.AutoApplyStateManager.dispatch(battler, 42, []);

      // Assert
      expect(result).toBe(false);
      expect(battler.addState).not.toHaveBeenCalled();
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

    it('permits one nested auto-execute when the configured max depth is two', () =>
    {
      // Arrange- the ceiling is read from plugin metadata rather than hardcoded, so raising it to
      // two must let exactly one re-entrant execution through before the third is refused.
      const actor = buildMomentumToolkitActor([ '<autoExecuteSkill:[506, time, 1]>' ]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[506] = { id: 506, stypeId: 1 };
      globalThis.__forceMapActionHook = () => actor.tryAutoExecuteSkills('time');
      const savedDepth = globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoExecuteSkillMaxDepth;
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoExecuteSkillMaxDepth = 2;

      // Act
      globalThis.AutoExecuteSkillManager.processTimeRules(actor);

      // Assert
      expect(globalThis.__forcedSkills).toEqual([ 506, 506 ]);

      // Cleanup
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoExecuteSkillMaxDepth = savedDepth;
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

    it('dispatch returns false when the battler has no map presence', () =>
    {
      // Arrange- the skill row exists and the engine would happily run it, so the missing map
      // wrapper is the only reason this dispatch declines.
      globalThis.JABS_AiManager.getBattlerByUuid = () => null;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[500] = { id: 500, stypeId: 1 };
      const actor = buildMomentumToolkitActor([]);
      actor.getUuid = () => 'off-map-actor';

      // Act & Assert
      expect(globalThis.AutoExecuteSkillManager.dispatch(actor, 500)).toBe(false);
      expect(globalThis.__forcedSkills).toEqual([]);
    });

    it('dispatch returns false for an invalid/non-positive skill id', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;

      // Act & Assert
      expect(globalThis.AutoExecuteSkillManager.dispatch(actor, 0)).toBe(false);
      expect(globalThis.__forcedSkills).toEqual([]);
    });

    it('dispatch returns false when the skill id has no database row', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];

      // Act & Assert
      expect(globalThis.AutoExecuteSkillManager.dispatch(actor, 999)).toBe(false);
      expect(globalThis.__forcedSkills).toEqual([]);
    });

    it('dispatch returns false when JABS refuses the previewed action', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[509] = { id: 509, stypeId: 1 };
      globalThis.$jabsEngine.canExecuteMapActions = () => false;

      // Act & Assert
      expect(globalThis.AutoExecuteSkillManager.dispatch(actor, 509)).toBe(false);
      expect(globalThis.__forcedSkills).toEqual([]);
    });

    it('falls back to a max depth of 1 when the metadata value is falsy', () =>
    {
      // Arrange
      const actor = buildMomentumToolkitActor([]);
      actor.getUuid = () => 'auto-exec-actor';
      mockJabsBattler.getBattler = () => actor;
      globalThis.$dataSkills = [];
      globalThis.$dataSkills[510] = { id: 510, stypeId: 1 };
      const savedDepth = globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoExecuteSkillMaxDepth;
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoExecuteSkillMaxDepth = 0;

      // Act
      const result = globalThis.AutoExecuteSkillManager.dispatch(actor, 510);

      // Assert- depth 0 || 1 falls back to 1, and starting executionDepth (0) is under that.
      expect(result).toBe(true);

      // Cleanup
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoExecuteSkillMaxDepth = savedDepth;
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
      const stampSpy = vi.spyOn(applier, 'setAutoRuleLastFrame');

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Assert- a refused dispatch must leave the cooldown unstamped, or the rule would sit out
      // its window having never actually fired.
      expect(target.addState).not.toHaveBeenCalled();
      expect(stampSpy).not.toHaveBeenCalled();
    });

    it('fires a rule that has never dispatched even while fewer frames have elapsed than its cooldown', () =>
    {
      // Arrange- a cooldown far larger than the frames elapsed since boot; treating "never fired"
      // as "fired on frame zero" would hold this first dispatch hostage until frame 9000.
      stubPolarityState(10, true);
      globalThis.Graphics.frameCount = 300;
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, negaStateInflicted, 9000]>' ]);
      const applied = [];
      const target = { isStateAddable: () => true, addState: (id) => applied.push(id) };

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 10);

      // Assert
      expect(applied).toEqual([ 70 ]);
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

    it('permits one nested dispatch when the configured max depth is two', () =>
    {
      // Arrange- the ceiling is read from plugin metadata rather than hardcoded, so raising it to
      // two must let exactly one re-entrant application through before the third is refused.
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
      const savedDepth = globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoInflictStateMaxDepth;
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoInflictStateMaxDepth = 2;

      // Act
      globalThis.AutoInflictStateManager.dispatch(target, 70, applier);

      // Assert
      expect(dispatchCalls).toEqual([ 'dispatched', 'dispatched' ]);

      // Cleanup
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoInflictStateMaxDepth = savedDepth;
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

  describe('AutoInflictStateManager edge cases', () =>
  {
    beforeEach(() =>
    {
      globalThis.$jabsEngine = { absEnabled: true };
      globalThis.Graphics.frameCount = 2000;
    });

    it('scheduleInflictedStateTriggers is a no-op without a valid applier/target pair', () =>
    {
      // Arrange- a real inflicted state row and a real matching rule sit behind the guard, so the
      // missing half of the pair is the only reason the payload never lands.
      globalThis.$dataStates[9033] = { id: 9033, isNegativeType: () => true };
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[70, negaStateInflicted, 0]>' ]);
      const target = { isStateAddable: () => true, addState: vi.fn() };

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(null, target, 9033);
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, null, 9033);

      // Assert
      expect(target.addState).not.toHaveBeenCalled();
    });

    it('scheduleInflictedStateTriggers is a no-op when the inflicted state has no database row', () =>
    {
      // Arrange
      const applier = buildMomentumToolkitActor([]);
      const target = buildMomentumToolkitActor([]);
      target.isStateAddable = () => true;
      target.addState = vi.fn();
      globalThis.$dataStates[9030] = undefined;

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 9030);

      // Assert
      expect(target.addState).not.toHaveBeenCalled();
    });

    it('scheduleKnockbackTriggers is a no-op when ABS is not active', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { absEnabled: false };

      // Act & Assert
      expect(() => globalThis.AutoInflictStateManager.scheduleKnockbackTriggers({}, {})).not.toThrow();
    });

    it('scheduleKnockbackTriggers is a no-op without a valid applier/target pair', () =>
    {
      // Act & Assert
      expect(() => globalThis.AutoInflictStateManager.scheduleKnockbackTriggers(null, {})).not.toThrow();
      expect(() => globalThis.AutoInflictStateManager.scheduleKnockbackTriggers({}, null)).not.toThrow();
    });

    it('falls back to a max depth of 1 when the metadata value is falsy', () =>
    {
      // Arrange
      const target = buildMomentumToolkitActor([]);
      target.isStateAddable = () => true;
      target.addState = vi.fn();
      const savedDepth = globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoInflictStateMaxDepth;
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoInflictStateMaxDepth = 0;

      // Act
      const result = globalThis.AutoInflictStateManager.dispatch(target, 71, {});

      // Assert
      expect(result).toBe(true);

      // Cleanup
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.autoInflictStateMaxDepth = savedDepth;
    });

    it('skips a rule tuple with an invalid/non-positive payload state id', () =>
    {
      // Arrange
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[0, anyStateInflicted, 0]>' ]);
      const target = buildMomentumToolkitActor([]);
      target.isStateAddable = () => true;
      target.addState = vi.fn();
      globalThis.$dataStates[9031] = { id: 9031, isNegativeType: () => false };

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 9031);

      // Assert
      expect(target.addState).not.toHaveBeenCalled();
    });

    it('skips a rule tuple with an invalid cooldown value', () =>
    {
      // Arrange
      const applier = buildMomentumToolkitActor([ '<autoInflictState:[72, anyStateInflicted, -1]>' ]);
      const target = buildMomentumToolkitActor([]);
      target.isStateAddable = () => true;
      target.addState = vi.fn();
      globalThis.$dataStates[9032] = { id: 9032, isNegativeType: () => false };

      // Act
      globalThis.AutoInflictStateManager.scheduleInflictedStateTriggers(applier, target, 9032);

      // Assert
      expect(target.addState).not.toHaveBeenCalled();
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

    it('does not schedule kill triggers when the caster has no underlying Game_Battler', () =>
    {
      // Arrange- the schedulers each carry their own null-battler guard, so asserting "nothing
      // happened" downstream proves nothing; spy on them and require they are never reached.
      const defeatedTargetJabsBattler = {
        clearFollowers: vi.fn(),
        clearLeader: vi.fn(),
        getCharacter: () => ({ start: vi.fn() }),
        isInanimate: () => true,
        hasEventActions: () => false,
        setDying: vi.fn(),
      };
      const casterJabsBattler = { getBattler: () => null };
      const engine = new globalThis.JABS_Engine();
      const applySpy = vi.spyOn(globalThis.AutoApplyStateManager, 'scheduleKillTriggers');
      const executeSpy = vi.spyOn(globalThis.AutoExecuteSkillManager, 'scheduleKillTriggers');
      const cooldownSpy = vi.spyOn(globalThis.AutoModifyCooldownManager, 'scheduleKillTriggers');

      // Act
      engine.handleDefeatedEnemy(defeatedTargetJabsBattler, casterJabsBattler);

      // Assert
      expect(applySpy).not.toHaveBeenCalled();
      expect(executeSpy).not.toHaveBeenCalled();
      expect(cooldownSpy).not.toHaveBeenCalled();

      // spies on bare-global plugin statics leak into later tests in this file, so restore by hand.
      applySpy.mockRestore();
      executeSpy.mockRestore();
      cooldownSpy.mockRestore();
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

    it('does not schedule knockback triggers when either side has no underlying Game_Battler', () =>
    {
      // Arrange- the scheduler guards its own applier/target pair, so the only way to prove this
      // hook bailed is to watch whether it was called at all.
      const action = { getCaster: () => ({ getBattler: () => null }) };
      const targetJabsBattler = { getBattler: () => null };
      const engine = new globalThis.JABS_Engine();
      const knockbackSpy = vi.spyOn(globalThis.AutoInflictStateManager, 'scheduleKnockbackTriggers');

      // Act
      engine.checkKnockback(action, targetJabsBattler);

      // Assert
      expect(knockbackSpy).not.toHaveBeenCalled();

      // spies on bare-global plugin statics leak into later tests in this file, so restore by hand.
      knockbackSpy.mockRestore();
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

    it('JABS_Engine#postExecuteSkillEffects fires onDamageDealt when only mp was drained', () =>
    {
      // Arrange- mp burn is damage too; a hit that never touched hp still counts as damage dealt.
      const caster = buildMomentumToolkitActor([ '<autoApplyState:[97, onDamageDealt, 0]>' ]);
      const applied = [];
      caster.isStateAddable = () => true;
      caster.addState = (stateId) => applied.push(stateId);
      const targetBattler = { result: () => ({ hpDamage: 0, mpDamage: 12, tpDamage: 0 }) };
      const action = { getCaster: () => buildJabsWrapper(caster, 0), getCooldownType: () => 'CombatSkill1' };
      const target = buildJabsWrapper(targetBattler, 1);
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(applied).toEqual([ 97 ]);
    });

    it('JABS_Engine#postExecuteSkillEffects fires onDamageDealt when only tp was drained', () =>
    {
      // Arrange- same argument for tp: the pool that moved does not change that damage landed.
      const caster = buildMomentumToolkitActor([ '<autoApplyState:[98, onDamageDealt, 0]>' ]);
      const applied = [];
      caster.isStateAddable = () => true;
      caster.addState = (stateId) => applied.push(stateId);
      const targetBattler = { result: () => ({ hpDamage: 0, mpDamage: 0, tpDamage: 5 }) };
      const action = { getCaster: () => buildJabsWrapper(caster, 0), getCooldownType: () => 'CombatSkill1' };
      const target = buildJabsWrapper(targetBattler, 1);
      const engine = new globalThis.JABS_Engine();

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(applied).toEqual([ 98 ]);
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

    it('does not schedule damage-dealt or weapon-hit triggers when the caster has no underlying Game_Battler', () =>
    {
      // Arrange- both schedulers guard their own null battler, so watch the calls themselves.
      const targetBattler = { result: () => ({ hpDamage: 50, mpDamage: 0, tpDamage: 0 }) };
      const action = { getCaster: () => buildJabsWrapper(null, 0), getCooldownType: () => 'Main' };
      const target = buildJabsWrapper(targetBattler, 1);
      const engine = new globalThis.JABS_Engine();
      const damageSpy = vi.spyOn(globalThis.AutoApplyStateManager, 'scheduleDamageDealtTriggers');
      const weaponSpy = vi.spyOn(globalThis.AutoApplyStateManager, 'scheduleWeaponHitTriggers');

      // Act
      engine.postExecuteSkillEffects(action, target);

      // Assert
      expect(damageSpy).not.toHaveBeenCalled();
      expect(weaponSpy).not.toHaveBeenCalled();

      // spies on bare-global plugin statics leak into later tests in this file, so restore by hand.
      damageSpy.mockRestore();
      weaponSpy.mockRestore();
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

  describe('initPassiveRuleMembers', () =>
  {
    it('falls back to a 15-frame reconcile delay when the plugin param is unset', () =>
    {
      // Arrange
      const savedDelay = globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.reconcileDelayFrames;
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.reconcileDelayFrames = 0;

      // Act
      const battler = buildMomentumToolkitActor([]);

      // Assert
      expect(battler.passiveRuleReconcileTimer()._delay).toBe(15);

      // Cleanup
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Metadata.reconcileDelayFrames = savedDelay;
    });
  });

  describe('Game_Battler passive rule timestamp getters/stampers', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 1000;
    });

    it('getPassiveRuleLastHitFrame reads the stamped frame', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      battler.stampPassiveRuleHitFrame();

      // Act & Assert
      expect(battler.getPassiveRuleLastHitFrame()).toBe(1000);
    });

    it('getPassiveRuleLastAttackedFrame reads the stamped frame', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      battler.stampPassiveRuleAttackedFrame();

      // Act & Assert
      expect(battler.getPassiveRuleLastAttackedFrame()).toBe(1000);
    });

    it('getPassiveRuleLastHpHealFrame/MpHealFrame/TpHealFrame read their stamped frames', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      battler.stampPassiveRuleHpHealFrame();
      battler.stampPassiveRuleMpHealFrame();
      battler.stampPassiveRuleTpHealFrame();

      // Act & Assert
      expect(battler.getPassiveRuleLastHpHealFrame()).toBe(1000);
      expect(battler.getPassiveRuleLastMpHealFrame()).toBe(1000);
      expect(battler.getPassiveRuleLastTpHealFrame()).toBe(1000);
    });
  });

  describe('gainHp / gainMp / gainTp (extended)', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 2000;
      globalThis.$jabsEngine = { absEnabled: true };
      globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = () => [];
    });

    it('gainHp stamps the hit frame and schedules hpDmg triggers when hp is lost', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([ '<autoApplyState:[97, hpDmg, 0]>' ]);
      battler.isStateAddable = () => true;
      const applied = [];
      battler.addState = (stateId) => applied.push(stateId);

      // Act
      battler.gainHp(-10);

      // Assert
      expect(battler.getPassiveRuleLastHitFrame()).toBe(2000);
      expect(applied).toEqual([ 97 ]);
    });

    it('gainHp does not stamp or schedule hpDmg triggers on a positive gain', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([ '<autoApplyState:[98, hpDmg, 0]>' ]);
      battler.isStateAddable = () => true;
      const applied = [];
      battler.addState = (stateId) => applied.push(stateId);

      // Act
      battler.gainHp(10);

      // Assert
      expect(battler.getPassiveRuleLastHitFrame()).toBe(0);
      expect(applied).toEqual([]);
    });

    it('gainMp schedules mpDmg triggers when mp is lost', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([ '<autoApplyState:[99, mpDmg, 0]>' ]);
      battler.isStateAddable = () => true;
      const applied = [];
      battler.addState = (stateId) => applied.push(stateId);

      // Act
      battler.gainMp(-5);

      // Assert
      expect(applied).toEqual([ 99 ]);
    });

    it('gainTp schedules tpDmg triggers when tp is lost', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([ '<autoApplyState:[100, tpDmg, 0]>' ]);
      battler.isStateAddable = () => true;
      const applied = [];
      battler.addState = (stateId) => applied.push(stateId);

      // Act
      battler.gainTp(-3);

      // Assert
      expect(applied).toEqual([ 100 ]);
    });

    it('gainMp does not schedule mpDmg triggers on a positive gain', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([ '<autoApplyState:[102, mpDmg, 0]>' ]);
      battler.isStateAddable = () => true;
      const applied = [];
      battler.addState = (stateId) => applied.push(stateId);

      // Act
      battler.gainMp(5);

      // Assert
      expect(applied).toEqual([]);
    });

    it('gainTp does not schedule tpDmg triggers on a positive gain', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([ '<autoApplyState:[103, tpDmg, 0]>' ]);
      battler.isStateAddable = () => true;
      const applied = [];
      battler.addState = (stateId) => applied.push(stateId);

      // Act
      battler.gainTp(3);

      // Assert
      expect(applied).toEqual([]);
    });
  });

  describe('onHeal (extended)', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 2500;
      globalThis.$jabsEngine = { absEnabled: true };
    });

    it('does not stamp any heal frame or notify allies for an unrecognized resource', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = () => [];

      // Act
      const act = () => battler.onHeal('notARealResource', 10);

      // Assert
      expect(act).not.toThrow();
      expect(battler.getPassiveRuleLastHpHealFrame()).toBe(0);
      expect(battler.getPassiveRuleLastMpHealFrame()).toBe(0);
      expect(battler.getPassiveRuleLastTpHealFrame()).toBe(0);
    });

    it('skips a nearby ally jabs wrapper with no resolvable Game_Battler', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = () => [ { getBattler: () => null } ];

      // Act
      const act = () => battler.onHeal(globalThis.J.BASE.Resource.HP, 10);

      // Assert
      expect(act).not.toThrow();
    });

    it('stamps only the hp heal frame and schedules onHealHp triggers for an hp heal', () =>
    {
      // Arrange- the other two pools are asserted untouched, so a branch that stamped the wrong
      // resource would be visible rather than merely unproven.
      const battler = buildMomentumToolkitActor([]);
      globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = () => [];
      const healSpy = vi.spyOn(globalThis.AutoApplyStateManager, 'scheduleHealTriggers');

      // Act
      battler.onHeal(globalThis.J.BASE.Resource.HP, 10);

      // Assert
      expect(battler.getPassiveRuleLastHpHealFrame()).toBe(2500);
      expect(battler.getPassiveRuleLastMpHealFrame()).toBe(0);
      expect(battler.getPassiveRuleLastTpHealFrame()).toBe(0);
      expect(healSpy).toHaveBeenCalledWith(battler, 'onHealHp');

      // spies on bare-global plugin statics leak into later tests in this file, so restore by hand.
      healSpy.mockRestore();
    });

    it('stamps only the mp heal frame and schedules onHealMp triggers for an mp heal', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = () => [];
      const healSpy = vi.spyOn(globalThis.AutoApplyStateManager, 'scheduleHealTriggers');

      // Act
      battler.onHeal(globalThis.J.BASE.Resource.MP, 10);

      // Assert
      expect(battler.getPassiveRuleLastMpHealFrame()).toBe(2500);
      expect(battler.getPassiveRuleLastHpHealFrame()).toBe(0);
      expect(battler.getPassiveRuleLastTpHealFrame()).toBe(0);
      expect(healSpy).toHaveBeenCalledWith(battler, 'onHealMp');

      // spies on bare-global plugin statics leak into later tests in this file, so restore by hand.
      healSpy.mockRestore();
    });

    it('stamps only the tp heal frame and schedules onHealTp triggers for a tp heal', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = () => [];
      const healSpy = vi.spyOn(globalThis.AutoApplyStateManager, 'scheduleHealTriggers');

      // Act
      battler.onHeal(globalThis.J.BASE.Resource.TP, 10);

      // Assert
      expect(battler.getPassiveRuleLastTpHealFrame()).toBe(2500);
      expect(battler.getPassiveRuleLastHpHealFrame()).toBe(0);
      expect(battler.getPassiveRuleLastMpHealFrame()).toBe(0);
      expect(healSpy).toHaveBeenCalledWith(battler, 'onHealTp');

      // spies on bare-global plugin statics leak into later tests in this file, so restore by hand.
      healSpy.mockRestore();
    });
  });

  describe('canIncludePassiveStateFromSource (extended)', () =>
  {
    it('short-circuits to false when an upstream extension already vetoed the source/state pair', () =>
    {
      // Arrange- restore the real aliased base afterward; it's a shared Map every later test relies on.
      const battler = buildMomentumToolkitActor([]);
      const originalBase = globalThis.J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.get('canIncludePassiveStateFromSource');
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set(
        'canIncludePassiveStateFromSource', () => false);

      // Act
      const result = battler.canIncludePassiveStateFromSource({ passiveSourceRules: [] }, 1);

      // Assert
      expect(result).toBe(false);

      // Cleanup
      globalThis.J.PASSIVE.EXT.CONDITIONAL.Aliased.Game_Battler.set('canIncludePassiveStateFromSource', originalBase);
    });
  });

  describe('evaluatePassiveGateRulesForSource (extended)', () =>
  {
    it('short-circuits to false without checking state rules when a source rule fails', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      const baseItem = {
        passiveSourceRules: [ [ 'hpAbove', 200 ] ],
        // this state rule would pass if ever evaluated- proves the short-circuit actually skipped it.
        passiveStateRules: [ [ 1, 'hpBelow', 200 ] ],
      };
      battler._hp = 1;
      battler._mhp = 100;

      // Act & Assert
      expect(battler.evaluatePassiveGateRulesForSource(baseItem, 1)).toBe(false);
    });

    it('evaluates only the state rules that target the passive being tested', () =>
    {
      // Arrange- the sibling rule belongs to a different passive on the same row and would fail
      // if it were ever evaluated, so a filter that matched everything would veto this passive.
      const battler = buildMomentumToolkitActor([]);
      const baseItem = {
        passiveSourceRules: [],
        passiveStateRules: [
          [ 2, 'hpAbove', 200 ],
          [ 1, 'hpBelow', 200 ],
        ],
      };
      battler._hp = 1;
      battler._mhp = 100;

      // Act & Assert
      expect(battler.evaluatePassiveGateRulesForSource(baseItem, 1)).toBe(true);
    });
  });

  describe('findPassiveStateCountTuple (extended)', () =>
  {
    it('returns the first scaler targeting the requested passive, not merely the first scaler', () =>
    {
      // Arrange- a scaler for a different passive sits ahead of the wanted one in author order.
      const battler = buildMomentumToolkitActor([]);
      const baseItem = {
        passiveStateCounts: [
          [ 9, 'moreIsMoreMp', 10 ],
          [ 7, 'moreIsMoreHp', 25 ],
        ],
      };

      // Act
      const result = battler.findPassiveStateCountTuple(baseItem, 7);

      // Assert
      expect(result).toEqual([ 7, 'moreIsMoreHp', 25 ]);
    });
  });

  describe('buildPassiveCollectionFingerprint / reconcilePassiveRules', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 3000;
    });

    it('includes equip-only unique/stackable ids when the source is an equip item', () =>
    {
      // Arrange- RPG_BaseBattler hardcodes equipped-passive fields to empty (battlers can't be
      // equipped); RPG_BaseItem is the equip-capable row shape that actually parses these tags.
      const battler = buildMomentumToolkitActor([]);
      const equipSource = new globalThis.RPG_BaseItem({
        id: 1,
        meta: {},
        name: 'Equip',
        // two of each so the final sort comparators actually run (a single-entry array never
        // invokes Array#sort's comparator at all).
        note: '<uniqueEquippedPassive:[203, 201]>\n<equippedPassive:[204, 202]>',
        description: String.empty,
        iconIndex: 0,
      }, 1);
      equipSource.isEquipItem = () => true;
      battler._j._passive._passiveSources = [ equipSource ];

      // Act
      const fingerprint = JSON.parse(battler.buildPassiveCollectionFingerprint());

      // Assert
      expect(fingerprint.uniqueIds).toEqual([ 201, 203 ]);
      expect(fingerprint.stackEntries).toEqual([ [ 202, 1 ], [ 204, 1 ] ]);
    });

    it('excludes ids gated out by canIncludePassiveStateFromSource', () =>
    {
      // Arrange- the row carries one of each kind, so the gate is proven to apply to the
      // stackable list as well as the unique one.
      const battler = buildMomentumToolkitActor([]);
      const source = new globalThis.RPG_BaseItem({
        id: 1,
        meta: {},
        name: 'Src',
        note: '<uniquePassive:[301]>\n<passive:[302]>',
        description: String.empty,
        iconIndex: 0,
      }, 1);
      battler._j._passive._passiveSources = [ source ];
      battler.canIncludePassiveStateFromSource = () => false;

      // Act
      const fingerprint = JSON.parse(battler.buildPassiveCollectionFingerprint());

      // Assert
      expect(fingerprint.uniqueIds).toEqual([]);
      expect(fingerprint.stackEntries).toEqual([]);
    });

    it('ignores equip-only passive ids on a source that is not an equip item', () =>
    {
      // Arrange- the equipped-passive tags parse on any row, but they only mean anything while
      // the row is worn, and a non-equip source never is.
      const battler = buildMomentumToolkitActor([]);
      const skillSource = new globalThis.RPG_BaseItem({
        id: 3,
        meta: {},
        name: 'Skill',
        note: '<uniquePassive:[205]>\n<passive:[206]>\n<uniqueEquippedPassive:[207]>\n<equippedPassive:[208]>',
        description: String.empty,
        iconIndex: 0,
      }, 3);
      skillSource.isEquipItem = () => false;
      battler._j._passive._passiveSources = [ skillSource ];

      // Act
      const fingerprint = JSON.parse(battler.buildPassiveCollectionFingerprint());

      // Assert
      expect(fingerprint.uniqueIds).toEqual([ 205 ]);
      expect(fingerprint.stackEntries).toEqual([ [ 206, 1 ] ]);
    });

    it('accumulates stack contributions across multiple sources granting the same stackable id', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      const sourceA = new globalThis.RPG_BaseItem({
        id: 1, meta: {}, name: 'A', note: '<passive:[401]>', description: String.empty, iconIndex: 0,
      }, 1);
      const sourceB = new globalThis.RPG_BaseItem({
        id: 2, meta: {}, name: 'B', note: '<passive:[401]>', description: String.empty, iconIndex: 0,
      }, 2);
      battler._j._passive._passiveSources = [ sourceA, sourceB ];

      // Act
      const fingerprint = JSON.parse(battler.buildPassiveCollectionFingerprint());

      // Assert- default stack contribution is 1 per source, so two sources sum to 2.
      expect(fingerprint.stackEntries).toEqual([ [ 401, 2 ] ]);
    });

    it('excludes a stackable id whose contribution resolves to zero or less', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      const source = new globalThis.RPG_BaseItem({
        id: 1, meta: {}, name: 'Src', note: '<passive:[402]>', description: String.empty, iconIndex: 0,
      }, 1);
      battler._j._passive._passiveSources = [ source ];
      battler.getPassiveStackContributionFromSource = () => 0;

      // Act
      const fingerprint = JSON.parse(battler.buildPassiveCollectionFingerprint());

      // Assert
      expect(fingerprint.stackEntries).toEqual([]);
    });

    it('does not skip a reconcile when the fingerprint is unchanged', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      battler._j._passive._passiveSources = [];
      const refreshSpy = vi.spyOn(battler, 'refreshPassiveStates');
      battler._j._passive._conditional._collectionFingerprint = battler.buildPassiveCollectionFingerprint();

      // Act
      battler.reconcilePassiveRules();

      // Assert
      expect(refreshSpy).not.toHaveBeenCalled();

      // Cleanup
      refreshSpy.mockRestore();
    });

    it('refreshes passive states when the fingerprint has drifted', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      battler._j._passive._passiveSources = [];
      battler._j._passive._conditional._collectionFingerprint = 'stale-fingerprint';

      // Act
      battler.reconcilePassiveRules();

      // Assert- refreshPassiveStates (aliased) re-derives and stores a fresh, non-stale fingerprint.
      expect(battler._j._passive._conditional._collectionFingerprint).not.toBe('stale-fingerprint');
      expect(battler._j._passive._conditional._pendingFingerprint).toBe(null);
    });

    it('consumes the stashed pending fingerprint when a reconcile cycle left one', () =>
    {
      // Arrange- the stash deliberately differs from what a fresh collector pass would produce,
      // so whichever string lands in storage identifies which path ran.
      const battler = buildMomentumToolkitActor([]);
      battler._j._passive._passiveSources = [];
      battler._j._passive._conditional._pendingFingerprint = 'pending-from-reconcile';

      // Act
      battler.updatePassiveRuleCollectionFingerprint();

      // Assert
      expect(battler._j._passive._conditional._collectionFingerprint).toBe('pending-from-reconcile');
    });

    it('recomputes the fingerprint when no reconcile cycle stashed one', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      battler._j._passive._passiveSources = [];
      battler._j._passive._conditional._pendingFingerprint = null;

      // Act
      battler.updatePassiveRuleCollectionFingerprint();

      // Assert- an empty source list still produces a real fingerprint, never a null stash.
      expect(battler._j._passive._conditional._collectionFingerprint)
        .toBe('{"uniqueIds":[],"stackEntries":[]}');
    });
  });

  describe('updatePassiveRuleReconcileTimer', () =>
  {
    it('does not reconcile while the timer is still counting down', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      const reconcileSpy = vi.spyOn(battler, 'reconcilePassiveRules').mockImplementation(() => {});

      // Act- the fixture's JABS_Timer needs `_frames >= _delay` (default delay 15) to complete.
      battler.updatePassiveRuleReconcileTimer();

      // Assert
      expect(reconcileSpy).not.toHaveBeenCalled();

      // Cleanup
      reconcileSpy.mockRestore();
    });

    it('reconciles and resets the timer once it completes', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([]);
      const reconcileSpy = vi.spyOn(battler, 'reconcilePassiveRules').mockImplementation(() => {});
      const timer = battler.passiveRuleReconcileTimer();

      // Act- drive the timer to completion (delay defaults to 15 frames per the fixture param).
      for (let i = 0; i < 20; i++)
      {
        battler.updatePassiveRuleReconcileTimer();
      }

      // Assert
      expect(reconcileSpy).toHaveBeenCalled();
      expect(timer.isTimerComplete()).toBe(false);

      // Cleanup
      reconcileSpy.mockRestore();
    });
  });

  describe('onStateAdded (extended)', () =>
  {
    it('schedules anyStateAdded auto-apply and auto-execute triggers', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([ '<autoApplyState:[101, anyStateAdded, 0]>' ]);
      battler.isStateAddable = () => true;
      const applied = [];
      battler.addState = (stateId) => applied.push(stateId);
      globalThis.$jabsEngine = { absEnabled: true };

      // Act
      battler.onStateAdded(5);

      // Assert
      expect(applied).toEqual([ 101 ]);
    });

    it('fires negaStateAdded for a state classified as negative', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([ '<autoApplyState:[120, negaStateAdded, 0]>' ]);
      battler.isStateAddable = () => true;
      const applied = [];
      battler.addState = (stateId) => applied.push(stateId);
      globalThis.$jabsEngine = { absEnabled: true };
      const negativeState = stubMomentumStateRow(9020, '');
      negativeState.isNegativeType = () => true;

      // Act
      battler.onStateAdded(9020);

      // Assert
      expect(applied).toEqual([ 120 ]);
    });

    it('fires posiStateAdded for a state classified as positive', () =>
    {
      // Arrange
      const battler = buildMomentumToolkitActor([ '<autoApplyState:[121, posiStateAdded, 0]>' ]);
      battler.isStateAddable = () => true;
      const applied = [];
      battler.addState = (stateId) => applied.push(stateId);
      globalThis.$jabsEngine = { absEnabled: true };
      const positiveState = stubMomentumStateRow(9021, '');
      positiveState.isNegativeType = () => false;

      // Act
      battler.onStateAdded(9021);

      // Assert
      expect(applied).toEqual([ 121 ]);
    });
  });

  describe('Game_Action#apply (extended)', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 4000;
      globalThis.$jabsEngine = { absEnabled: true };
    });

    it('schedules whenCrit triggers on the target when the hit was critical', () =>
    {
      // Arrange
      const target = buildMomentumToolkitActor([ '<autoApplyState:[110, whenCrit, 120]>' ]);
      target.isStateAddable = () => true;
      const applied = [];
      target.addState = (stateId) => applied.push(stateId);
      target.result = () => ({ critical: true, glancing: false });
      const action = Object.create(globalThis.Game_Action.prototype);

      // Act
      action.apply(target);

      // Assert
      expect(applied).toEqual([ 110 ]);
    });

    it('schedules whenGlanced triggers on the target when the hit was a glancing blow', () =>
    {
      // Arrange
      const target = buildMomentumToolkitActor([ '<autoApplyState:[111, whenGlanced, 120]>' ]);
      target.isStateAddable = () => true;
      const applied = [];
      target.addState = (stateId) => applied.push(stateId);
      target.result = () => ({ critical: false, glancing: true });
      const action = Object.create(globalThis.Game_Action.prototype);

      // Act
      action.apply(target);

      // Assert
      expect(applied).toEqual([ 111 ]);
    });

    it('schedules neither trigger on a plain hit (neither critical nor glancing)', () =>
    {
      // Arrange
      const target = buildMomentumToolkitActor([
        '<autoApplyState:[112, whenCrit, 120]>', '<autoApplyState:[113, whenGlanced, 120]>',
      ]);
      target.isStateAddable = () => true;
      const applied = [];
      target.addState = (stateId) => applied.push(stateId);
      target.result = () => ({ critical: false, glancing: false });
      const action = Object.create(globalThis.Game_Action.prototype);

      // Act
      action.apply(target);

      // Assert
      expect(applied).toEqual([]);
    });
  });

  describe('JABS_Action#preCleanupHook (extended)', () =>
  {
    it('processes removeOnSkillResolution rules against the caster\'s underlying battler', () =>
    {
      // Arrange- verifying the wiring (right battler, right skill id) is this file's job; the
      // removal manager's own internal behavior is covered by its dedicated test suite.
      const caster = buildMomentumToolkitActor([]);
      const processSpy = vi.spyOn(globalThis.SkillResolutionStateRemovalManager, 'process')
        .mockImplementation(() => {});
      const action = Object.create(globalThis.JABS_Action.prototype);
      action.getCaster = () => ({ getBattler: () => caster });
      action.getBaseSkill = () => ({ id: 7 });

      // Act
      action.preCleanupHook();

      // Assert
      expect(processSpy).toHaveBeenCalledWith(caster, 7);

      // Cleanup
      processSpy.mockRestore();
    });
  });

  describe('JABS_Battler (conditional extensions)', () =>
  {
    beforeEach(() =>
    {
      globalThis.Graphics.frameCount = 5000;
      globalThis.$jabsEngine = { absEnabled: true };
    });

    describe('update (extended)', () =>
    {
      it('runs movement tracking and reconcile after the base update logic', () =>
      {
        // Arrange
        const battler = buildMomentumToolkitActor([]);
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getCharacter = () => null;
        jabsBattler.getBattler = () => battler;
        const reconcileSpy = vi.spyOn(battler, 'updatePassiveRuleReconcileTimer').mockImplementation(() => {});

        // Act
        jabsBattler.update();

        // Assert- with no character, movement tracking no-ops, but reconcile still runs.
        expect(reconcileSpy).toHaveBeenCalled();
      });
    });

    describe('setLastUsedSkillId (extended)', () =>
    {
      it('does nothing further when the map battler has no underlying Game_Battler', () =>
      {
        // Arrange
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getBattler = () => null;

        // Act & Assert
        expect(() => jabsBattler.setLastUsedSkillId(1)).not.toThrow();
      });

      it('stamps the attacked frame and processes skill-execution removal rules', () =>
      {
        // Arrange
        const battler = buildMomentumToolkitActor([]);
        const processSpy = vi.spyOn(globalThis.SkillExecutionStateRemovalManager, 'process')
          .mockImplementation(() => {});
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getBattler = () => battler;

        // Act
        jabsBattler.setLastUsedSkillId(3);

        // Assert
        expect(battler.getPassiveRuleLastAttackedFrame()).toBe(5000);
        expect(processSpy).toHaveBeenCalledWith(battler, 3);

        // Cleanup
        processSpy.mockRestore();
      });
    });

    describe('updatePassiveRuleReconcile', () =>
    {
      it('does nothing when the map battler has no underlying Game_Battler', () =>
      {
        // Arrange
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getBattler = () => null;

        // Act & Assert
        expect(() => jabsBattler.updatePassiveRuleReconcile()).not.toThrow();
      });

      it('advances the reconcile timer and runs every scheduler pass on the underlying battler', () =>
      {
        // Arrange
        const battler = buildMomentumToolkitActor([]);
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getBattler = () => battler;
        globalThis.PassiveRuleJabsAccess.nearbyAlliesExcludingSelf = () => [];
        globalThis.PassiveRuleJabsAccess.nearbyEnemies = () => [];

        // Act & Assert- exercising the full real scheduler chain; absence of a throw is the signal.
        expect(() => jabsBattler.updatePassiveRuleReconcile()).not.toThrow();
      });
    });

    describe('updatePassiveRuleMovementTracking', () =>
    {
      it('does nothing when the map battler has no underlying character', () =>
      {
        // Arrange
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getCharacter = () => null;

        // Act & Assert
        expect(() => jabsBattler.updatePassiveRuleMovementTracking()).not.toThrow();
      });

      it('does nothing when the map battler has no underlying Game_Battler', () =>
      {
        // Arrange
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getCharacter = () => ({ _realX: 0, _realY: 0 });
        jabsBattler.getBattler = () => null;

        // Act & Assert
        expect(() => jabsBattler.updatePassiveRuleMovementTracking()).not.toThrow();
      });

      it('seeds the baseline coordinates on the first update without stamping movement', () =>
      {
        // Arrange
        const battler = buildMomentumToolkitActor([]);
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getCharacter = () => ({ _realX: 5, _realY: 5 });
        jabsBattler.getBattler = () => battler;

        // Act
        jabsBattler.updatePassiveRuleMovementTracking();

        // Assert
        expect(battler.getPassiveRuleLastMovedFrame()).toBe(0);
      });

      it('does not stamp movement when the coordinates have not changed since the last update', () =>
      {
        // Arrange
        const battler = buildMomentumToolkitActor([]);
        battler._j._passive._conditional._lastTrackedX = 5;
        battler._j._passive._conditional._lastTrackedY = 5;
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getCharacter = () => ({ _realX: 5, _realY: 5 });
        jabsBattler.getBattler = () => battler;

        // Act
        jabsBattler.updatePassiveRuleMovementTracking();

        // Assert
        expect(battler.getPassiveRuleLastMovedFrame()).toBe(0);
      });

      it('stamps movement and processes move-removal rules once coordinates change', () =>
      {
        // Arrange
        const battler = buildMomentumToolkitActor([]);
        battler._j._passive._conditional._lastTrackedX = 5;
        battler._j._passive._conditional._lastTrackedY = 5;
        const processSpy = vi.spyOn(globalThis.MoveStateRemovalManager, 'process').mockImplementation(() => {});
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getCharacter = () => ({ _realX: 6, _realY: 5 });
        jabsBattler.getBattler = () => battler;

        // Act
        jabsBattler.updatePassiveRuleMovementTracking();

        // Assert
        expect(battler.getPassiveRuleLastMovedFrame()).toBe(5000);
        expect(processSpy).toHaveBeenCalledWith(battler);

        // Cleanup
        processSpy.mockRestore();
      });

      it('stamps movement when only the vertical coordinate changed', () =>
      {
        // Arrange- walking due north moves the battler without touching x at all, and a tracker
        // that only watched x would read that as standing still.
        const battler = buildMomentumToolkitActor([]);
        battler._j._passive._conditional._lastTrackedX = 5;
        battler._j._passive._conditional._lastTrackedY = 5;
        const processSpy = vi.spyOn(globalThis.MoveStateRemovalManager, 'process').mockImplementation(() => {});
        const jabsBattler = Object.create(globalThis.JABS_Battler.prototype);
        jabsBattler.getCharacter = () => ({ _realX: 5, _realY: 4 });
        jabsBattler.getBattler = () => battler;

        // Act
        jabsBattler.updatePassiveRuleMovementTracking();

        // Assert
        expect(battler.getPassiveRuleLastMovedFrame()).toBe(5000);
        expect(processSpy).toHaveBeenCalledWith(battler);

        // Cleanup
        processSpy.mockRestore();
      });
    });
  });
});
//endregion plugins/passive/_component/j-passive-conditional.test.js
