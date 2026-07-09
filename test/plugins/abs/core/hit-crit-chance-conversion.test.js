//region plugins/abs/core/hit-crit-chance-conversion.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

describe('J-ABS hit/crit chance conversion (out/abs/J-ABS.js)', () =>
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
   * borrowing the real isHitEvaded/isHitCritical straight off the compiled prototype.
   * @param {object} [overrides]
   * @returns {object}
   */
  function buildAction(overrides = {})
  {
    const action = Object.create(sandbox.Game_Action.prototype);
    action.itemHit = overrides.itemHit ?? (() => 0);
    action.itemEva = overrides.itemEva ?? (() => 0);
    action.itemCri = overrides.itemCri ?? (() => 0);
    action.subject = () => overrides.attacker ?? buildAttacker();
    action.item = () => ({});
    return action;
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
    sandbox.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
    {
      calls.push({ percent, rollForPositive, rollForNegative });
      return outcome;
    };
    return calls;
  }

  describe('isHitEvaded', () =>
  {
    it('converts itemHit/itemEva into a single percent and rolls chanceIn100 with it', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemHit: () => 0.2, itemEva: () => 0.05 });

      action.isHitEvaded(buildTarget());

      // (1 + 0.2 - 0.05) * 100 = 115.
      expect(calls).toHaveLength(1);
      expect(calls[0].percent).toBeCloseTo(115);
    });

    it('is not evaded when the roll succeeds', () =>
    {
      stubChanceIn100(true);
      const action = buildAction();

      expect(action.isHitEvaded(buildTarget())).toBe(false);
    });

    it('is evaded when the roll fails', () =>
    {
      stubChanceIn100(false);
      const action = buildAction();

      expect(action.isHitEvaded(buildTarget())).toBe(true);
    });

    it('always hits with balanced 0 hit/evade stats (baseline 100%)', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemHit: () => 0, itemEva: () => 0 });

      action.isHitEvaded(buildTarget());

      expect(calls[0].percent).toBe(100);
    });

    it('rolls a 0% chance when evasion fully offsets a 0 hit bonus', () =>
    {
      const calls = stubChanceIn100(false);
      const action = buildAction({ itemHit: () => 0, itemEva: () => 1 });

      expect(action.isHitEvaded(buildTarget())).toBe(true);
      expect(calls[0].percent).toBe(0);
    });

    it('rolls a percent above 100 when hit bonuses swamp evasion, still resolving to a hit', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemHit: () => 5, itemEva: () => 0 });

      expect(action.isHitEvaded(buildTarget())).toBe(false);
      // (1 + 5 - 0) * 100 = 600; chanceIn100 saturates any value >=100 to always succeed.
      expect(calls[0].percent).toBe(600);
    });

    it('feeds the attacker\'s positive rolls as a bonus on top of the baseline 1', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction({ attacker: buildAttacker(3) });

      action.isHitEvaded(buildTarget());

      expect(calls[0].rollForPositive).toBe(4);
    });

    it('feeds the target\'s negative rolls directly, with no baseline added', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction();

      action.isHitEvaded(buildTarget(2));

      expect(calls[0].rollForNegative).toBe(2);
    });
  });

  describe('isHitCritical', () =>
  {
    it('converts the fractional itemCri rate into a percent and rolls chanceIn100 with it', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemCri: () => 0.35 });

      action.isHitCritical(buildTarget());

      expect(calls[0].percent).toBe(35);
    });

    it('returns true when the roll succeeds', () =>
    {
      stubChanceIn100(true);
      const action = buildAction({ itemCri: () => 0.1 });

      expect(action.isHitCritical(buildTarget())).toBe(true);
    });

    it('returns false when the roll fails', () =>
    {
      stubChanceIn100(false);
      const action = buildAction({ itemCri: () => 0.1 });

      expect(action.isHitCritical(buildTarget())).toBe(false);
    });

    it('never crits when itemCri is floored at 0', () =>
    {
      const calls = stubChanceIn100(false);
      const action = buildAction({ itemCri: () => 0 });

      expect(action.isHitCritical(buildTarget())).toBe(false);
      expect(calls[0].percent).toBe(0);
    });

    it('still saturates to a guaranteed crit at the 9999 sentinel scale', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction({ itemCri: () => 9999 });

      expect(action.isHitCritical(buildTarget())).toBe(true);
      expect(calls[0].percent).toBe(999900);
    });

    it('feeds the attacker\'s positive rolls and the target\'s negative rolls into the same roll', () =>
    {
      const calls = stubChanceIn100(true);
      const action = buildAction({ attacker: buildAttacker(2) });

      action.isHitCritical(buildTarget(5));

      expect(calls[0].rollForPositive).toBe(3);
      expect(calls[0].rollForNegative).toBe(5);
    });
  });
});
//endregion plugins/abs/core/hit-crit-chance-conversion.test.js
