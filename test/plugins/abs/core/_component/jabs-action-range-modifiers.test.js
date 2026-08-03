//region plugins/abs/core/_component/jabs-action-range-modifiers.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../_component/fixtures/install-abs-host-globals.js';

/**
 * Builds a minimal skill-note-bearing object for range-modifier getter tests.
 * @param {string} note
 * @returns {object}
 */
function buildSkill(note)
{
  return { id: 1, note, meta: {} };
}

/**
 * Builds a minimal caster stub whose shared/axis range getters are directly stubbable per test.
 * @param {object} [overrides]
 * @returns {object}
 */
function buildCaster(overrides = {})
{
  return {
    getRangeBuff: () => 0,
    getRangeRate: () => 1,
    getRadiusBuff: () => 0,
    getRadiusRate: () => 0,
    getProximityBuff: () => 0,
    getProximityRate: () => 0,
    getThicknessBuff: () => 0,
    getThicknessRate: () => 0,
    ...overrides,
  };
}

/**
 * Builds a minimal JABS_Action instance wired to the given skill note and caster.
 * @param {object} skill
 * @param {object} caster
 * @returns {object}
 */
function buildAction(skill, caster)
{
  const action = Object.create(globalThis.JABS_Action.prototype);
  action.getBaseSkill = () => skill;
  action.getAction = () => ({ subject: () => caster });
  return action;
}

describe('J-ABS JABS_Action this-scoped range modifiers (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    ({ default: globalThis.RPGManager } = await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    setPluginContextToJAbs();
    await import('../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // the file under test- a plain ESM class, no globalThis patching involved.
    ({ default: globalThis.JABS_Action } = await import('../../../../../src/plugins/abs/core/models/JABS_Action.js'));
  });

  beforeEach(() =>
  {
    globalThis.RPGManager.clearCache();
  });

  describe('getThisRangeBuff / getThisRangeRate', () =>
  {
    it('returns 0 when the skill carries no thisRangeBuff tag', () =>
    {
      // Arrange
      const action = buildAction(buildSkill(''), buildCaster());

      // Act
      const result = action.getThisRangeBuff();

      // Assert
      expect(result).toBe(0);
    });

    it('returns the tagged flat bonus from the skill\'s own thisRangeBuff tag', () =>
    {
      // Arrange
      const action = buildAction(buildSkill('<thisRangeBuff:2>'), buildCaster());

      // Act
      const result = action.getThisRangeBuff();

      // Assert
      expect(result).toBe(2);
    });

    it('returns 0 delta when the skill carries no thisRangeRate tag', () =>
    {
      // Arrange
      const action = buildAction(buildSkill(''), buildCaster());

      // Act
      const result = action.getThisRangeRate();

      // Assert
      expect(result).toBe(0);
    });

    it('returns the tagged rate delta from the skill\'s own thisRangeRate tag', () =>
    {
      // Arrange
      const action = buildAction(buildSkill('<thisRangeRate:1.5>'), buildCaster());

      // Act
      const result = action.getThisRangeRate();

      // Assert
      expect(result).toBe(0.5);
    });
  });

  describe('applyRadiusModifiers', () =>
  {
    it('applies only the caster\'s shared buff/rate when the skill has no this-scoped tags', () =>
    {
      // Arrange
      const caster = buildCaster({ getRangeBuff: () => 1, getRangeRate: () => 1.5 });
      const action = buildAction(buildSkill(''), caster);

      // Act
      const result = action.applyRadiusModifiers(4);

      // Assert
      expect(result).toBe((4 + 1) * 1.5);
    });

    it('adds the skill\'s own thisRangeBuff/thisRadiusBuff on top of the caster\'s shared buff', () =>
    {
      // Arrange
      const caster = buildCaster({ getRangeBuff: () => 1 });
      const action = buildAction(buildSkill('<thisRangeBuff:2>\n<thisRadiusBuff:1>'), caster);

      // Act
      const result = action.applyRadiusModifiers(4);

      // Assert
      expect(result).toBe(4 + 1 + 2 + 1);
    });

    it('floors the result at 0 when combined buffs would otherwise go negative', () =>
    {
      // Arrange
      const caster = buildCaster({ getRangeBuff: () => -10 });
      const action = buildAction(buildSkill(''), caster);

      // Act
      const result = action.applyRadiusModifiers(4);

      // Assert
      expect(result).toBe(0);
    });
  });

  describe('applyProximityModifiers', () =>
  {
    it('adds the skill\'s own thisRangeRate/thisProximityRate on top of the caster\'s shared rate', () =>
    {
      // Arrange
      const caster = buildCaster();
      const action = buildAction(buildSkill('<thisRangeRate:1.25>\n<thisProximityRate:1.25>'), caster);

      // Act
      const result = action.applyProximityModifiers(4);

      // Assert
      // base rate 1.0 (shared) + 0.25 (thisRangeRate delta) + 0.25 (thisProximityRate delta) = 1.5
      expect(result).toBe(4 * 1.5);
    });
  });

  describe('applyThicknessModifiers', () =>
  {
    it('leaves thickness untouched when the skill has no this-scoped thickness tags', () =>
    {
      // Arrange
      const action = buildAction(buildSkill(''), buildCaster());

      // Act
      const result = action.applyThicknessModifiers(1);

      // Assert
      expect(result).toBe(1);
    });
  });
});
//endregion plugins/abs/core/_component/jabs-action-range-modifiers.test.js
