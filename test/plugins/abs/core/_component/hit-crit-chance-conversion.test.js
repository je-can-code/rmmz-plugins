//region plugins/abs/core/_component/hit-crit-chance-conversion.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal attacker stand-in exposing only getPositiveRollsForSkill/getNegativeRollsForSkill.
 * @param {number} positiveRolls
 * @returns {object}
 */
function buildAttacker(positiveRolls = 0)
{
  return {
    getPositiveRollsForSkill: () => positiveRolls,
    getNegativeRollsForSkill: () => 0,
    isVeryLucky: () => false,
    isVeryCursed: () => false,
  };
}

/**
 * Builds a minimal defender/target stand-in exposing only getNegativeRolls.
 * @param {number} negativeRolls
 * @returns {object}
 */
function buildTarget(negativeRolls = 0)
{
  return {
    getNegativeRolls: () => negativeRolls,
  };
}

/**
 * Builds a minimal Game_Action stub with controllable itemHit/itemEva/itemCri stand-ins,
 * borrowing the real isHitEvaded/isHitCritical straight off the real prototype.
 * @param {object} [overrides]
 * @returns {object}
 */
function buildAction(overrides = {})
{
  const action = Object.create(globalThis.Game_Action.prototype);
  action.itemHit = overrides.itemHit ?? (() => 0);
  action.itemEva = overrides.itemEva ?? (() => 0);
  action.itemCri = overrides.itemCri ?? (() => 0);
  action.subject = () => overrides.attacker ?? buildAttacker();
  action.item = () => ({});
  action.isForOpponent = () => true;
  return action;
}

/**
 * Stubs the fate an action brings against one target, so a roll site can be seen forwarding it untouched.
 * Any other target gets an empty pair, so a site asking about the wrong battler shows up as zeros.
 * @param {object} action The action whose fate is stubbed.
 * @param {object} aimedAt The only target the stubbed fate answers for.
 * @param {number[]} rolls The positive and negative rolls to answer with.
 */
function stubFateRollsAgainst(action, aimedAt, rolls)
{
  action.fateRollsAgainst = target => (target === aimedAt ? rolls : [ 0, 0 ]);
}

/**
 * Stubs RPGManager.chanceIn100 to record every argument it was rolled with and return a fixed
 * outcome, so the roll-conversion logic can be tested deterministically without relying on
 * real dice.
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

describe('J-ABS hit/crit chance conversion (direct src import)', () =>
{
  /** @type {Function} */
  let originalChanceIn100;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // patches globalThis.Game_Action.prototype directly, no vm involved.
    await import('../../../../../src/plugins/abs/core/objects/Game_Action.js');
  });

  beforeEach(() =>
  {
    originalChanceIn100 = globalThis.RPGManager.chanceIn100;
  });

  afterEach(() =>
  {
    globalThis.RPGManager.chanceIn100 = originalChanceIn100;
  });

  describe('isHitEvaded', () =>
  {
    it('converts itemHit/itemEva into a single percent and rolls chanceIn100 with it', () =>
    {
      // Arrange- (1 + 0.2 - 0.05) * 100 = 115.
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemHit: () => 0.2, itemEva: () => 0.05 });

      // Act
      action.isHitEvaded(buildTarget());

      // Assert
      expect(calls).toHaveLength(1);
      expect(calls[0].percent).toBeCloseTo(115);
    });

    it('is not evaded when the roll succeeds', () =>
    {
      // Arrange
      stubChanceIn100(true);
      const action = buildAction();

      // Act
      const result = action.isHitEvaded(buildTarget());

      // Assert
      expect(result).toBe(false);
    });

    it('is evaded when the roll fails', () =>
    {
      // Arrange
      stubChanceIn100(false);
      const action = buildAction();

      // Act
      const result = action.isHitEvaded(buildTarget());

      // Assert
      expect(result).toBe(true);
    });

    it('always hits with balanced 0 hit/evade stats (baseline 100%)', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemHit: () => 0, itemEva: () => 0 });

      // Act
      action.isHitEvaded(buildTarget());

      // Assert
      expect(calls[0].percent).toBe(100);
    });

    it('rolls a 0% chance when evasion fully offsets a 0 hit bonus', () =>
    {
      // Arrange
      const calls = stubChanceIn100(false);
      const action = buildAction({ itemHit: () => 0, itemEva: () => 1 });

      // Act
      const result = action.isHitEvaded(buildTarget());

      // Assert
      expect(result).toBe(true);
      expect(calls[0].percent).toBe(0);
    });

    it('rolls a percent above 100 when hit bonuses swamp evasion, still resolving to a hit', () =>
    {
      // Arrange- (1 + 5 - 0) * 100 = 600; chanceIn100 saturates any value >=100 to always succeed.
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemHit: () => 5, itemEva: () => 0 });

      // Act
      const result = action.isHitEvaded(buildTarget());

      // Assert
      expect(result).toBe(false);
      expect(calls[0].percent).toBe(600);
    });

    it('rolls with the fate the action brings against the target it is aimed at', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction();
      const target = buildTarget();
      stubFateRollsAgainst(action, target, [ 7, 3 ]);

      // Act
      action.isHitEvaded(target);

      // Assert
      expect(calls[0].rollForPositive).toBe(7);
      expect(calls[0].rollForNegative).toBe(3);
    });
  });

  describe('isHitCritical', () =>
  {
    it('converts the fractional itemCri rate into a percent and rolls chanceIn100 with it', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemCri: () => 0.35 });

      // Act
      action.isHitCritical(buildTarget());

      // Assert
      expect(calls[0].percent).toBe(35);
    });

    it('returns true when the roll succeeds', () =>
    {
      // Arrange
      stubChanceIn100(true);
      const action = buildAction({ itemCri: () => 0.1 });

      // Act
      const result = action.isHitCritical(buildTarget());

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when the roll fails', () =>
    {
      // Arrange
      stubChanceIn100(false);
      const action = buildAction({ itemCri: () => 0.1 });

      // Act
      const result = action.isHitCritical(buildTarget());

      // Assert
      expect(result).toBe(false);
    });

    it('never crits when itemCri is floored at 0', () =>
    {
      // Arrange
      const calls = stubChanceIn100(false);
      const action = buildAction({ itemCri: () => 0 });

      // Act
      const result = action.isHitCritical(buildTarget());

      // Assert
      expect(result).toBe(false);
      expect(calls[0].percent).toBe(0);
    });

    it('still saturates to a guaranteed crit at the 9999 sentinel scale', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemCri: () => 9999 });

      // Act
      const result = action.isHitCritical(buildTarget());

      // Assert
      expect(result).toBe(true);
      expect(calls[0].percent).toBe(999900);
    });

    it('rolls with the fate the action brings against the target it is aimed at', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemCri: () => 0.1 });
      const target = buildTarget();
      stubFateRollsAgainst(action, target, [ 6, 4 ]);

      // Act
      action.isHitCritical(target);

      // Assert
      expect(calls[0].rollForPositive).toBe(6);
      expect(calls[0].rollForNegative).toBe(4);
    });
  });
});
//endregion plugins/abs/core/_component/hit-crit-chance-conversion.test.js
