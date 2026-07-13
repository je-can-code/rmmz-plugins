//region plugins/abs/core/parry-glancing-chance-rolls.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../fixtures/install-abs-host-globals.js';

/**
 * Builds a duck-typed "engine" exposing only the methods under test, with isParryPossible
 * forced true so prerequisite gating never interferes with the roll-threading assertions.
 * @returns {object}
 */
function buildEngine()
{
  return {
    checkImplicitFullParry: globalThis.JABS_Engine.prototype.checkImplicitFullParry,
    checkGlancingBlow: globalThis.JABS_Engine.prototype.checkGlancingBlow,
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
  globalThis.RPGManager.chanceIn100 = function(percent, rollForPositive, rollForNegative)
  {
    calls.push({ percent, rollForPositive, rollForNegative });
    return outcome;
  };
  return calls;
}

const action = { getBaseSkill: () => ({ jabsIgnoreParry: 0 }) };

describe('J-ABS parry/glancing roll threading (direct src import)', () =>
{
  /** @type {Function} */
  let originalChanceIn100;

  /** @type {Function} */
  let originalImplicitParryChancePercent;

  /** @type {Function} */
  let originalGlancingBlowChancePercent;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../src/plugins/_base/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../src/plugins/abs/core/_metadata/initialization.js');

    ({ default: globalThis.JABS_Engine } = await import('../../../../src/plugins/abs/core/managers/JABS_Engine.js'));
  });

  beforeEach(() =>
  {
    originalChanceIn100 = globalThis.RPGManager.chanceIn100;
    originalImplicitParryChancePercent = globalThis.JABS_Engine.implicitParryChancePercent;
    originalGlancingBlowChancePercent = globalThis.JABS_Engine.glancingBlowChancePercent;

    // fix the underlying dominance-band math to a known raw chance so only the roll-threading
    // logic (percent + roll counts) is under test here.
    globalThis.JABS_Engine.implicitParryChancePercent = () => 100;
    globalThis.JABS_Engine.glancingBlowChancePercent = () => 40;
    globalThis.J.ABS.Metadata.ImplicitParryScaleFactor = 1;
  });

  afterEach(() =>
  {
    globalThis.RPGManager.chanceIn100 = originalChanceIn100;
    globalThis.JABS_Engine.implicitParryChancePercent = originalImplicitParryChancePercent;
    globalThis.JABS_Engine.glancingBlowChancePercent = originalGlancingBlowChancePercent;
  });

  describe('checkImplicitFullParry', () =>
  {
    it('feeds the defender\'s positive rolls and the attacker\'s negative rolls- the roles are reversed from an offensive roll', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const engine = buildEngine();
      const caster = buildJabsBattler(0, 3);
      const target = buildJabsBattler(2, 0);

      // Act
      engine.checkImplicitFullParry(caster, target, action);

      // Assert
      expect(calls[0].rollForPositive).toBe(3);
      expect(calls[0].rollForNegative).toBe(3);
    });

    it('rolls the scaled dominance-band percent', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const engine = buildEngine();

      // Act
      engine.checkImplicitFullParry(buildJabsBattler(), buildJabsBattler(), action);

      // Assert
      expect(calls[0].percent).toBe(100);
    });
  });

  describe('checkGlancingBlow', () =>
  {
    it('feeds the defender\'s positive rolls and the attacker\'s negative rolls', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const engine = buildEngine();
      const caster = buildJabsBattler(0, 4);
      const target = buildJabsBattler(1, 0);

      // Act
      engine.checkGlancingBlow(caster, target, action);

      // Assert
      expect(calls[0].rollForPositive).toBe(2);
      expect(calls[0].rollForNegative).toBe(4);
    });

    it('rolls the glancing-blow percent', () =>
    {
      // Arrange
      const calls = stubChanceIn100(true);
      const engine = buildEngine();

      // Act
      engine.checkGlancingBlow(buildJabsBattler(), buildJabsBattler(), action);

      // Assert
      expect(calls[0].percent).toBe(40);
    });
  });
});
//endregion plugins/abs/core/parry-glancing-chance-rolls.test.js
