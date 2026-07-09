//region plugins/passive/passive-conditional-roll-threading.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../setup/shipped-plugin-vm.js';
import { loadPassiveConditionalPluginVm } from './passive-conditional-vm.js';

/**
 * Registers one hydrated state row for combat-state removal tests.
 * @param {object} sandbox
 * @param {number} stateId
 * @param {string} note
 * @returns {object}
 */
function stubStateRow(sandbox, stateId, note)
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

/**
 * Builds a minimal actor carrying the given active state id, ready for
 * SkillExecutionStateRemovalManager/SkillResolutionStateRemovalManager.
 * @param {object} sandbox
 * @param {number} stateId
 * @returns {object}
 */
function buildActorWithState(sandbox, stateId)
{
  const actor = new sandbox.Game_Actor();
  actor.initMembers();
  actor._states = [ stateId ];
  actor.getUuid = () => 'test-actor';
  actor.decrementStateStacks = () => {};

  return actor;
}

describe('J-Passive-Conditional state-removal roll threading (out/passive/ext/J-Passive-Conditional.js)', () =>
{
  /** @type {object} */
  let sandbox;

  /** @type {Function} */
  let originalChanceIn100;

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
    originalChanceIn100 = sandbox.RPGManager.chanceIn100;
    sandbox.$jabsEngine = { absEnabled: true, getJabsStateByUuidAndStateId: () => null };
    sandbox.$dataSkills = [];
    sandbox.$dataSkills[99] = { id: 99, stypeId: 7 };
  });

  afterEach(() =>
  {
    sandbox.RPGManager.chanceIn100 = originalChanceIn100;
  });

  /**
   * Stubs RPGManager.chanceIn100 to record every argument and return a fixed outcome.
   * @param {boolean} outcome
   * @returns {{percent: number, rollForPositive: number, rollForNegative: number}[]}
   */
  function stubChanceIn100(outcome)
  {
    const calls = [];
    sandbox.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
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
      const stateId = 50;
      stubStateRow(sandbox, stateId, '<removeOnSkillExecution:[7, 100]>');
      const actor = buildActorWithState(sandbox, stateId);
      actor.getPositiveRollsForSkill = () => 2;
      actor.getNegativeRollsForSkill = () => 1;

      const calls = stubChanceIn100(true);

      sandbox.SkillExecutionStateRemovalManager.process(actor, 99);

      expect(calls).toEqual([ { percent: 100, rollForPositive: 3, rollForNegative: 1 } ]);
    });
  });

  describe('SkillResolutionStateRemovalManager.process', () =>
  {
    it('the battler shedding the state is both the roller and the recipient', () =>
    {
      const stateId = 51;
      stubStateRow(sandbox, stateId, '<removeOnSkillResolution:[7, 100]>');
      const actor = buildActorWithState(sandbox, stateId);
      actor.getPositiveRollsForSkill = () => 4;
      actor.getNegativeRollsForSkill = () => 3;

      const calls = stubChanceIn100(true);

      sandbox.SkillResolutionStateRemovalManager.process(actor, 99);

      expect(calls).toEqual([ { percent: 100, rollForPositive: 5, rollForNegative: 3 } ]);
    });
  });
});
//endregion plugins/passive/passive-conditional-roll-threading.test.js
