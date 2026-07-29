//region plugins/resources/_component/resource-manager.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ResourceCostManager from '../../../../src/plugins/resources/core/managers/ResourceManager.js';

/**
 * Builds a minimal fake battler with the surface ResourceCostManager reads.
 * @param {object} fields
 * @returns {object}
 */
function buildBattler(fields = {})
{
  return {
    mhp: 1000,
    mmp: 500,
    mtp: 100,
    rec: 1,
    mcr: 1,
    tcr: 1,
    hcrFactor: () => 1,
    skill: id => ({ id }),
    ...fields,
  };
}

describe('ResourceCostManager (resources core)', () =>
{
  let getNumberFromNoteByRegexMock;
  let getResultFromNoteByRegexMock;

  beforeEach(() =>
  {
    getNumberFromNoteByRegexMock = vi.fn(() => 0);
    getResultFromNoteByRegexMock = vi.fn(() => 0);
    globalThis.RPGManager = {
      getNumberFromNoteByRegex: getNumberFromNoteByRegexMock,
      getResultFromNoteByRegex: getResultFromNoteByRegexMock,
    };
    globalThis.J = {
      RESOURCES: {
        RegExp: {
          HpCostFlat: {},
          HpCostPercent: {},
          HpCostFormula: {},
          MpCostFlat: {},
          MpCostPercent: {},
          MpCostFormula: {},
          TpCostFlat: {},
          TpCostPercent: {},
          TpCostFormula: {},
          HpGainFlat: {},
          HpGainPercent: {},
          HpGainFormula: {},
          MpGainFlat: {},
          MpGainPercent: {},
          MpGainFormula: {},
          TpGainFlat: {},
          TpGainPercent: {},
          TpGainFormula: {},
        },
      },
    };
  });

  afterEach(() =>
  {
    delete globalThis.RPGManager;
    delete globalThis.J;
  });

  describe('hpCostBreakdown / hpCostBySkill', () =>
  {
    it('combines flat, percent-of-max, and formula, then applies hcrFactor to each component', () =>
    {
      const battler = buildBattler({ mhp: 1000, hcrFactor: () => 0.5 });
      const skill = {};

      getNumberFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === globalThis.J.RESOURCES.RegExp.HpCostFlat) return 20;
        if (regexp === globalThis.J.RESOURCES.RegExp.HpCostPercent) return 10;
        return 0;
      });
      getResultFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === globalThis.J.RESOURCES.RegExp.HpCostFormula) return 10;
        return 0;
      });

      // flat 20, percent-of-max (1000 * 10%) 100, formula 10; each component scaled by hcrFactor 0.5.
      const breakdown = ResourceCostManager.hpCostBreakdown(battler, skill);
      expect(breakdown).toEqual({ flat: 10, percent: 10, calculatedPercent: 50, formula: 5 });

      // total is the sum of the post-hcr components: 10 + 50 + 5 = 65.
      expect(ResourceCostManager.hpCostBySkill(battler, skill)).toBe(65);
    });

    it('returns 0 for hpCostBySkill when every component is exactly zero', () =>
    {
      const battler = buildBattler();
      const skill = {};

      expect(ResourceCostManager.hpCostBySkill(battler, skill)).toBe(0);
    });
  });

  describe('extraMpCostBreakdown / extraMpCostBySkill', () =>
  {
    it('combines flat, percent-of-max, and formula, scaled by mcr', () =>
    {
      const battler = buildBattler({ mmp: 500, mcr: 2 });
      const skill = {};

      getNumberFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === globalThis.J.RESOURCES.RegExp.MpCostFlat) return 5;
        if (regexp === globalThis.J.RESOURCES.RegExp.MpCostPercent) return 4;
        return 0;
      });
      getResultFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === globalThis.J.RESOURCES.RegExp.MpCostFormula) return 1;
        return 0;
      });

      // flat 5, percent-of-max (500 * 4%) 20, formula 1; each doubled by mcr 2.
      const breakdown = ResourceCostManager.extraMpCostBreakdown(battler, skill);
      expect(breakdown).toEqual({ flat: 10, percent: 4, calculatedPercent: 40, formula: 2 });

      expect(ResourceCostManager.extraMpCostBySkill(battler, skill)).toBe(52);
    });
  });

  describe('extraTpCostBreakdown / extraTpCostBySkill', () =>
  {
    it('combines flat, percent-of-max, and formula, scaled by tcr', () =>
    {
      const battler = buildBattler({ mtp: 100, tcr: 3 });
      const skill = {};

      getNumberFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === globalThis.J.RESOURCES.RegExp.TpCostFlat) return 1;
        return 0;
      });

      // only flat contributes: 1 * tcr 3 = 3.
      expect(ResourceCostManager.extraTpCostBySkill(battler, skill)).toBe(3);
    });
  });

  describe('skillGainHp / skillGainMp / skillGainTp', () =>
  {
    it('resolves the true form of the skill via battler.skill(id) before reading tags', () =>
    {
      const trueSkill = { id: 7, note: 'true' };
      const battler = buildBattler({ mhp: 1000, rec: 1, skill: vi.fn(() => trueSkill) });
      const skill = { id: 7 };

      getNumberFromNoteByRegexMock.mockImplementation((data, regexp) =>
      {
        if (data === trueSkill && regexp === globalThis.J.RESOURCES.RegExp.HpGainFlat) return 30;
        return 0;
      });

      expect(ResourceCostManager.skillGainHp(battler, skill)).toBe(30);
      expect(battler.skill).toHaveBeenCalledWith(7);
    });

    it('scales the total mp gain by battler.rec', () =>
    {
      const battler = buildBattler({ mmp: 500, rec: 4 });
      const skill = { id: 1 };

      getNumberFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === globalThis.J.RESOURCES.RegExp.MpGainFlat) return 5;
        return 0;
      });

      // flat 5 * rec 4 = 20.
      expect(ResourceCostManager.skillGainMp(battler, skill)).toBe(20);
    });

    it('returns 0 for tp gain when every component is exactly zero, without applying rec', () =>
    {
      const battler = buildBattler({ rec: 10 });
      const skill = { id: 1 };

      expect(ResourceCostManager.skillGainTp(battler, skill)).toBe(0);
    });

    it('scales the total tp gain by battler.rec once any component is non-zero', () =>
    {
      // Arrange
      const battler = buildBattler({
        mtp: 100,
        rec: 2,
      });
      const skill = { id: 1 };

      getNumberFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === globalThis.J.RESOURCES.RegExp.TpGainFlat) return 7;

        return 0;
      });

      // Act
      const result = ResourceCostManager.skillGainTp(battler, skill);

      // Assert
      // flat 7 * rec 2 = 14; the zero-shortcut above must not swallow a real gain.
      expect(result).toBe(14);
    });

    it('counts a percentage of max tp toward the gain', () =>
    {
      // Arrange
      const battler = buildBattler({
        mtp: 200,
        rec: 1,
      });
      const skill = { id: 1 };

      getNumberFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === globalThis.J.RESOURCES.RegExp.TpGainPercent) return 25;

        return 0;
      });

      // Act
      const result = ResourceCostManager.skillGainTp(battler, skill);

      // Assert
      // 25% of a 200 max tp pool.
      expect(result).toBe(50);
    });

    it('counts a formula-sourced gain toward the total', () =>
    {
      // Arrange
      const battler = buildBattler({ rec: 1 });
      const skill = { id: 1 };
      getResultFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === globalThis.J.RESOURCES.RegExp.TpGainFormula) return 9;

        return 0;
      });

      // Act
      const result = ResourceCostManager.skillGainTp(battler, skill);

      // Assert
      expect(result).toBe(9);
    });
  });
});
//endregion plugins/resources/_component/resource-manager.test.js
