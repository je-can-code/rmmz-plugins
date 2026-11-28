//region plugins/abs/core/_component/parry-glancing-chance-rolls.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

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
    // borrowed so both rolls read the defender's fate through the real shared helper.
    defensiveFateRolls: globalThis.JABS_Engine.prototype.defensiveFateRolls,

    // borrowed rather than stubbed so the parry-ignore resolution stays part of the real chain.
    getIgnoreParryPct: globalThis.JABS_Engine.prototype.getIgnoreParryPct,
    getFlatIgnoreParryPct: globalThis.JABS_Engine.prototype.getFlatIgnoreParryPct,
    getThisIgnoreParryPct: globalThis.JABS_Engine.prototype.getThisIgnoreParryPct,
    isParryPossible: () => true,
  };
}

/**
 * Builds a duck-typed "JABS_Battler" wrapping a plain Game_Battler-like roll source. Its skill-scoped curse and its
 * battler-wide one are separate, so a roll reading the wrong one shows up in the counts.
 * @param {number} positiveRolls What getPositiveRolls answers.
 * @param {number} negativeRollsForSkill What getNegativeRollsForSkill answers.
 * @param {number} negativeRolls What getNegativeRolls answers.
 * @returns {object}
 */
function buildJabsBattler(positiveRolls = 0, negativeRollsForSkill = 0, negativeRolls = 0)
{
  return {
    getBattler: () => ({
      getPositiveRolls: () => positiveRolls,
      getNegativeRollsForSkill: () => negativeRollsForSkill,
      getNegativeRolls: () => negativeRolls,
      isVeryLucky: () => false,
      isVeryCursed: () => false,
      // the caster's own equips and states contribute parry-ignore; nothing is equipped here.
      getAllNotes: () => [],
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
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    ({ default: globalThis.JABS_Engine } = await import('../../../../../src/plugins/abs/core/managers/JABS_Engine.js'));
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
    it('gives the defender its own luck and one more chance per curse the attacker carries, against its own curse', () =>
    {
      // Arrange- every count differs, so a roll reading the wrong battler's luck or curse changes the pair.
      const calls = stubChanceIn100(true);
      const engine = buildEngine();
      const caster = buildJabsBattler(5, 3, 9);
      const target = buildJabsBattler(2, 7, 4);

      // Act
      engine.checkImplicitFullParry(caster, target, action);

      // Assert- 1 + the defender's 2 luck + the attacker's 3 curses with this skill; the defender's own 4 curses.
      expect(calls[0].rollForPositive).toBe(6);
      expect(calls[0].rollForNegative).toBe(4);
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
    it('gives the defender its own luck and one more chance per curse the attacker carries, against its own curse', () =>
    {
      // Arrange- every count differs, so a roll reading the wrong battler's luck or curse changes the pair.
      const calls = stubChanceIn100(true);
      const engine = buildEngine();
      const caster = buildJabsBattler(6, 4, 8);
      const target = buildJabsBattler(1, 9, 2);

      // Act
      engine.checkGlancingBlow(caster, target, action);

      // Assert- 1 + the defender's 1 luck + the attacker's 4 curses with this skill; the defender's own 2 curses.
      expect(calls[0].rollForPositive).toBe(6);
      expect(calls[0].rollForNegative).toBe(2);
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
//endregion plugins/abs/core/_component/parry-glancing-chance-rolls.test.js
