//region plugins/abs/core/state-apply-chance-rolls.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

describe('J-ABS state application/removal roll threading (out/abs/J-ABS.js)', () =>
{
  /** @type {object} */
  let sandbox;

  /** @type {Function} */
  let originalChanceIn100;

  beforeAll(() =>
  {
    sandbox = { console };
    loadAbsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  beforeEach(() =>
  {
    clearRpgManagerCacheInVm(sandbox);
    originalChanceIn100 = sandbox.RPGManager.chanceIn100;
  });

  afterEach(() =>
  {
    sandbox.RPGManager.chanceIn100 = originalChanceIn100;
  });

  /**
   * Builds a minimal caster stand-in exposing only getPositiveRollsForSkill.
   * @param {number} positiveRolls
   * @returns {object}
   */
  function buildCaster(positiveRolls = 0)
  {
    return {
      getPositiveRollsForSkill: () => positiveRolls,
      isVeryLucky: () => false,
      isVeryCursed: () => false,
    };
  }

  /**
   * Builds a minimal target stand-in exposing only what these two effects touch.
   * @param {object} [overrides]
   * @returns {object}
   */
  function buildTarget(overrides = {})
  {
    return {
      getNegativeRolls: () => overrides.negativeRolls ?? 0,
      stateRate: () => overrides.stateRate ?? 1,
      stateTypeResistRate: () => overrides.stateTypeResistRate ?? 1,
      removeState: () => {},
    };
  }

  /**
   * Builds a minimal Game_Action stub, borrowing the real shouldApplyState/itemEffectRemoveState
   * straight off the compiled prototype.
   * @param {object} [overrides]
   * @returns {object}
   */
  function buildAction(overrides = {})
  {
    const action = Object.create(sandbox.Game_Action.prototype);
    action.subject = () => overrides.attacker ?? buildCaster();
    action.item = () => ({});
    action.isCertainHit = () => overrides.isCertainHit ?? false;
    action.lukEffectRate = () => overrides.lukEffectRate ?? 1;
    action.makeSuccess = () => {};
    return action;
  }

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

  describe('shouldApplyState', () =>
  {
    it('feeds the caster\'s positive rolls (plus baseline 1) and the target\'s negative rolls', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction({ attacker: buildCaster(2) });

      action.shouldApplyState(buildTarget({ negativeRolls: 3 }), 5, 1.0, false);

      expect(calls[0].rollForPositive).toBe(3);
      expect(calls[0].rollForNegative).toBe(3);
    });

    it('rolls the computed d100 chance', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction();

      action.shouldApplyState(buildTarget({ stateRate: 0.5 }), 5, 1.0, false);

      // 1.0 base * 0.5 stateRate * 1 stateTypeResist * 1 luk = 0.5 -> d100 = 50.
      expect(calls[0].percent).toBe(50);
    });
  });

  describe('itemEffectRemoveState', () =>
  {
    it('feeds the caster\'s positive rolls and the target\'s negative rolls- a cursed target can resist even a cleanse', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction({ attacker: buildCaster(1) });
      const target = buildTarget({ negativeRolls: 4 });

      action.itemEffectRemoveState(target, { value1: 1.0, dataId: 5 });

      expect(calls[0].rollForPositive).toBe(2);
      expect(calls[0].rollForNegative).toBe(4);
    });

    it('converts the fractional value1 into a d100 roll', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction();
      const target = buildTarget();

      action.itemEffectRemoveState(target, { value1: 0.75, dataId: 5 });

      expect(calls[0].percent).toBe(75);
    });

    it('removes the state only when the roll succeeds', () =>
    {
      stubChanceIn100(false);
      const action = buildAction();
      const target = buildTarget();
      target.removeState = () => { throw new Error('should not be called on a failed roll'); };

      expect(() => action.itemEffectRemoveState(target, { value1: 1.0, dataId: 5 })).not.toThrow();
    });
  });
});
//endregion plugins/abs/core/state-apply-chance-rolls.test.js
