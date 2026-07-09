//region plugins/abs/core/parry-glancing-chance-rolls.test.js
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { clearRpgManagerCacheInVm } from '../../../setup/shipped-plugin-vm.js';
import { loadAbsPluginVm } from '../abs-vm.js';

describe('J-ABS parry/glancing roll threading (out/abs/J-ABS.js)', () =>
{
  /** @type {object} */
  let sandbox;

  /** @type {Function} */
  let originalChanceIn100;

  /** @type {Function} */
  let originalImplicitParryChancePercent;

  /** @type {Function} */
  let originalGlancingBlowChancePercent;

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
    originalImplicitParryChancePercent = sandbox.JABS_Engine.implicitParryChancePercent;
    originalGlancingBlowChancePercent = sandbox.JABS_Engine.glancingBlowChancePercent;

    // fix the underlying dominance-band math to a known raw chance so only the roll-threading
    // logic (percent + roll counts) is under test here.
    sandbox.JABS_Engine.implicitParryChancePercent = () => 100;
    sandbox.JABS_Engine.glancingBlowChancePercent = () => 40;
    sandbox.J.ABS.Metadata.ImplicitParryScaleFactor = 1;
  });

  afterEach(() =>
  {
    sandbox.RPGManager.chanceIn100 = originalChanceIn100;
    sandbox.JABS_Engine.implicitParryChancePercent = originalImplicitParryChancePercent;
    sandbox.JABS_Engine.glancingBlowChancePercent = originalGlancingBlowChancePercent;
  });

  /**
   * Builds a duck-typed "engine" exposing only the methods under test, with isParryPossible
   * forced true so prerequisite gating never interferes with the roll-threading assertions.
   * @returns {object}
   */
  function buildEngine()
  {
    return {
      checkImplicitFullParry: sandbox.JABS_Engine.prototype.checkImplicitFullParry,
      checkGlancingBlow: sandbox.JABS_Engine.prototype.checkGlancingBlow,
      isParryPossible: () => true,
    };
  }

  /**
   * Builds a duck-typed "JABS_Battler" wrapping a plain Game_Battler-like roll source.
   * @param {number} positiveRolls
   * @param {number} negativeRolls
   * @returns {object}
   */
  function buildJabsBattler(positiveRolls = 0, negativeRolls = 0)
  {
    return {
      getBattler: () => ({
        getPositiveRolls: () => positiveRolls,
        getNegativeRollsForSkill: () => negativeRolls,
        isVeryLucky: () => false,
        isVeryCursed: () => false,
      }),
    };
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

  const action = { getBaseSkill: () => ({ jabsIgnoreParry: 0 }) };

  describe('checkImplicitFullParry', () =>
  {
    it('feeds the defender\'s positive rolls and the attacker\'s negative rolls- the roles are reversed from an offensive roll', () =>
    {
      const calls = stubChanceIn100(true);
      const engine = buildEngine();
      const caster = buildJabsBattler(0, 3);
      const target = buildJabsBattler(2, 0);

      engine.checkImplicitFullParry(caster, target, action);

      expect(calls[0].rollForPositive).toBe(3);
      expect(calls[0].rollForNegative).toBe(3);
    });

    it('rolls the scaled dominance-band percent', () =>
    {
      const calls = stubChanceIn100(true);
      const engine = buildEngine();

      engine.checkImplicitFullParry(buildJabsBattler(), buildJabsBattler(), action);

      expect(calls[0].percent).toBe(100);
    });
  });

  describe('checkGlancingBlow', () =>
  {
    it('feeds the defender\'s positive rolls and the attacker\'s negative rolls', () =>
    {
      const calls = stubChanceIn100(true);
      const engine = buildEngine();
      const caster = buildJabsBattler(0, 4);
      const target = buildJabsBattler(1, 0);

      engine.checkGlancingBlow(caster, target, action);

      expect(calls[0].rollForPositive).toBe(2);
      expect(calls[0].rollForNegative).toBe(4);
    });

    it('rolls the glancing-blow percent', () =>
    {
      const calls = stubChanceIn100(true);
      const engine = buildEngine();

      engine.checkGlancingBlow(buildJabsBattler(), buildJabsBattler(), action);

      expect(calls[0].percent).toBe(40);
    });
  });
});
//endregion plugins/abs/core/parry-glancing-chance-rolls.test.js
