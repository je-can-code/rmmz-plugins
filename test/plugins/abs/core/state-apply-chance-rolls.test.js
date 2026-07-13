//region plugins/abs/core/state-apply-chance-rolls.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../fixtures/install-abs-host-globals.js';

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
 * straight off the real prototype.
 * @param {object} [overrides]
 * @returns {object}
 */
function buildAction(overrides = {})
{
  const action = Object.create(globalThis.Game_Action.prototype);
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
  globalThis.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
  {
    calls.push({ percent, rollForPositive, rollForNegative });
    return outcome;
  };
  return calls;
}

describe('J-ABS state application/removal roll threading (direct src import)', () =>
{
  /** @type {Function} */
  let originalChanceIn100;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    originalChanceIn100 = globalThis.RPGManager.chanceIn100;
  });

  afterEach(() =>
  {
    globalThis.RPGManager.chanceIn100 = originalChanceIn100;
  });

  describe('shouldApplyState', () =>
  {
    it('feeds the caster\'s positive rolls (plus baseline 1) and the target\'s negative rolls', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction({ attacker: buildCaster(2) });

      // Act
      action.shouldApplyState(buildTarget({ negativeRolls: 3 }), 5, 1.0, false);

      // Assert
      expect(calls[0].rollForPositive).toBe(3);
      expect(calls[0].rollForNegative).toBe(3);
    });

    it('rolls the computed d100 chance', () =>
    {
      // Arrange- 1.0 base * 0.5 stateRate * 1 stateTypeResist * 1 luk = 0.5 -> d100 = 50.
      const calls = stubChanceIn100(true);
      const action = buildAction();

      // Act
      action.shouldApplyState(buildTarget({ stateRate: 0.5 }), 5, 1.0, false);

      // Assert
      expect(calls[0].percent).toBe(50);
    });
  });

  describe('itemEffectRemoveState', () =>
  {
    it('feeds the caster\'s positive rolls and the target\'s negative rolls- a cursed target can resist even a cleanse', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction({ attacker: buildCaster(1) });
      const target = buildTarget({ negativeRolls: 4 });

      // Act
      action.itemEffectRemoveState(target, { value1: 1.0, dataId: 5 });

      // Assert
      expect(calls[0].rollForPositive).toBe(2);
      expect(calls[0].rollForNegative).toBe(4);
    });

    it('converts the fractional value1 into a d100 roll', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction();
      const target = buildTarget();

      // Act
      action.itemEffectRemoveState(target, { value1: 0.75, dataId: 5 });

      // Assert
      expect(calls[0].percent).toBe(75);
    });

    it('removes the state only when the roll succeeds', () =>
    {
      // Arrange
      stubChanceIn100(false);
      const action = buildAction();
      const target = buildTarget();
      target.removeState = () => { throw new Error('should not be called on a failed roll'); };

      // Act
      const act = () => action.itemEffectRemoveState(target, { value1: 1.0, dataId: 5 });

      // Assert
      expect(act).not.toThrow();
    });
  });
});
//endregion plugins/abs/core/state-apply-chance-rolls.test.js
