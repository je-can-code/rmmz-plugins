//region plugins/passive/passive-conditional-roll-threading.test.js
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
 * Registers one hydrated state row for combat-state removal tests.
 * @param {number} stateId
 * @param {string} note
 * @returns {object}
 */
function stubStateRow(stateId, note)
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

/**
 * Builds a minimal actor carrying the given active state id, ready for
 * SkillExecutionStateRemovalManager/SkillResolutionStateRemovalManager.
 * @param {number} stateId
 * @returns {object}
 */
function buildActorWithState(stateId)
{
  const actor = new globalThis.Game_Actor();
  actor.initMembers();
  actor._states = [ stateId ];
  actor.getUuid = () => 'test-actor';
  actor.decrementStateStacks = () => {};

  return actor;
}

describe('J-Passive-Conditional state-removal roll threading (direct src import)', () =>
{
  /** @type {Function} */
  let originalChanceIn100;

  beforeAll(async () =>
  {
    vi.resetModules();

    installPassiveHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: globalThis.RPG_BaseItem } = await import('../../../src/plugins/_base/database/base/RPG_BaseItem.js'));
    ({ default: globalThis.RPG_BaseBattler } = await import('../../../src/plugins/_base/database/core/RPG_BaseBattler.js'));
    ({ default: globalThis.RPG_Actor } = await import('../../../src/plugins/_base/database/implementations/RPG_Actor.js'));
    ({ default: globalThis.RPG_State } = await import('../../../src/plugins/_base/database/implementations/RPG_State.js'));

    await import('../../../src/plugins/_base/objects/Game_BattlerBase.js');
    await import('../../../src/plugins/_base/objects/Game_Battler.js');
    await import('../../../src/plugins/_base/objects/Game_Actor.js');

    setPluginContextToJPassive();
    await import('../../../src/plugins/passive/core/_metadata/initialization.js');

    await import('../../../src/plugins/passive/core/database/RPG_BaseItem.js');
    await import('../../../src/plugins/passive/core/database/RPG_BaseBattler.js');
    await import('../../../src/plugins/passive/core/database/RPG_State.js');
    await import('../../../src/plugins/passive/core/objects/Game_Battler.js');
    await import('../../../src/plugins/passive/core/objects/Game_Actor.js');

    installPassiveConditionalHostGlobals();

    setPluginContextToJPassiveConditional();
    await import('../../../src/plugins/passive/ext/conditional/_metadata/initialization.js');

    await import('../../../src/plugins/passive/ext/conditional/database/RPG_BaseBattler.js');
    await import('../../../src/plugins/passive/ext/conditional/database/RPG_BaseItem.js');
    await import('../../../src/plugins/passive/ext/conditional/database/RPG_State.js');
    await import('../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleThreshold.js');
    await import('../../../src/plugins/passive/ext/conditional/helpers/PassiveRuleJabsAccess.js');
    await import('../../../src/plugins/passive/ext/conditional/managers/AutoRuleManager.js');
    ({ default: globalThis.SkillExecutionStateRemovalManager } = await import('../../../src/plugins/passive/ext/conditional/managers/SkillExecutionStateRemovalManager.js'));
    ({ default: globalThis.SkillResolutionStateRemovalManager } = await import('../../../src/plugins/passive/ext/conditional/managers/SkillResolutionStateRemovalManager.js'));
    await import('../../../src/plugins/passive/ext/conditional/objects/Game_Battler.js');
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
    originalChanceIn100 = globalThis.RPGManager.chanceIn100;
    globalThis.$jabsEngine = { absEnabled: true, getJabsStateByUuidAndStateId: () => null };
    globalThis.$dataSkills = [];
    globalThis.$dataSkills[99] = { id: 99, stypeId: 7 };
  });

  afterEach(() =>
  {
    globalThis.RPGManager.chanceIn100 = originalChanceIn100;
  });

  /**
   * Stubs RPGManager.chanceIn100 to record every argument and return a fixed outcome.
   * @param {boolean} outcome
   * @returns {{percent: number, rollForPositive: number, rollForNegative: number}[]}
   */
  function stubChanceIn100(outcome)
  {
    const calls = [];
    globalThis.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
    {
      calls.push({ percent, rollForPositive, rollForNegative });
      return outcome;
    };
    return calls;
  }

  describe('SkillExecutionStateRemovalManager.process', () =>
  {
    it('the battler shedding the state is both the roller and the recipient', () =>
    {
      // Arrange
      const stateId = 50;
      stubStateRow(stateId, '<removeOnSkillExecution:[7, 100]>');
      const actor = buildActorWithState(stateId);
      actor.getPositiveRollsForSkill = () => 2;
      actor.getNegativeRollsForSkill = () => 1;
      const calls = stubChanceIn100(true);

      // Act
      globalThis.SkillExecutionStateRemovalManager.process(actor, 99);

      // Assert
      expect(calls).toEqual([ { percent: 100, rollForPositive: 3, rollForNegative: 1 } ]);
    });
  });

  describe('SkillResolutionStateRemovalManager.process', () =>
  {
    it('the battler shedding the state is both the roller and the recipient', () =>
    {
      // Arrange
      const stateId = 51;
      stubStateRow(stateId, '<removeOnSkillResolution:[7, 100]>');
      const actor = buildActorWithState(stateId);
      actor.getPositiveRollsForSkill = () => 4;
      actor.getNegativeRollsForSkill = () => 3;
      const calls = stubChanceIn100(true);

      // Act
      globalThis.SkillResolutionStateRemovalManager.process(actor, 99);

      // Assert
      expect(calls).toEqual([ { percent: 100, rollForPositive: 5, rollForNegative: 3 } ]);
    });
  });
});
//endregion plugins/passive/passive-conditional-roll-threading.test.js
