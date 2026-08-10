//region plugins/resources/_component/resource-hit-manager.test.js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ResourceHitManager from '../../../../src/plugins/resources/ext/abs/managers/ResourceHitManager.js';

/**
 * Builds the full J.RESOURCES.EXT.ABS.RegExp namespace with unique placeholder objects,
 * so the mocked RPGManager can distinguish which tag lookup is in flight by identity.
 * @returns {Record<string, object>}
 */
function buildRegexNamespace()
{
  const namespace = {};

  for (const direction of [ 'OnAttack', 'WhenHit' ])
  {
    for (const resource of [ 'Hp', 'Mp', 'Tp' ])
    {
      for (const shape of [ 'GainFlat', 'GainPercent', 'GainFormula' ])
      {
        namespace[`${direction}${resource}${shape}`] = {};
      }
    }
  }

  return namespace;
}

/**
 * Builds a minimal fake battler with the surface ResourceHitManager reads.
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
    lst: 0,
    mst: 0,
    tst: 0,
    hcrSources: () => [],
    gainHpFromResource: vi.fn(),
    gainMpFromResource: vi.fn(),
    gainTpFromResource: vi.fn(),
    ...fields,
  };
}

describe('ResourceHitManager (resources ext/abs)', () =>
{
  let regexNamespace;
  let getNumberFromNoteByRegexMock;
  let getResultFromNoteByRegexMock;

  beforeEach(() =>
  {
    regexNamespace = buildRegexNamespace();
    globalThis.J = { RESOURCES: { EXT: { ABS: { RegExp: regexNamespace } } } };

    getNumberFromNoteByRegexMock = vi.fn(() => 0);
    getResultFromNoteByRegexMock = vi.fn(() => 0);
    globalThis.RPGManager = {
      getNumberFromNoteByRegex: getNumberFromNoteByRegexMock,
      getResultFromNoteByRegex: getResultFromNoteByRegexMock,
    };
  });

  afterEach(() =>
  {
    delete globalThis.J;
    delete globalThis.RPGManager;
  });

  describe('onAttack gain calculations', () =>
  {
    it('combines flat, percent-of-max, and formula from the skill, scaled by rec', () =>
    {
      const caster = buildBattler({ rec: 2 });
      const skill = {};

      getNumberFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === regexNamespace.OnAttackHpGainFlat) return 10;
        if (regexp === regexNamespace.OnAttackHpGainPercent) return 5;
        return 0;
      });
      getResultFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === regexNamespace.OnAttackHpGainFormula) return 3;
        return 0;
      });

      // flat 10 + (mhp 1000 * 5%) 50 + formula 3 = 63, then * rec 2 = 126.
      expect(ResourceHitManager.onAttackHpGain(caster, skill)).toBe(126);
    });

    it('returns 0 without scaling by rec when the total is exactly zero', () =>
    {
      const caster = buildBattler({ rec: 5 });
      const skill = {};

      expect(ResourceHitManager.onAttackMpGain(caster, skill)).toBe(0);
    });

    it('sums tags from both the skill and the caster\'s traited sources independently', () =>
    {
      const source = {};
      const caster = buildBattler({ hcrSources: () => [ source ] });
      const skill = {};

      getNumberFromNoteByRegexMock.mockImplementation((data, regexp) =>
      {
        if (data === skill && regexp === regexNamespace.OnAttackTpGainFlat) return 10;
        if (data === source && regexp === regexNamespace.OnAttackTpGainFlat) return 20;
        return 0;
      });

      // skill contributes 10, source contributes 20, rec is 1 on both -> 30.
      expect(ResourceHitManager.onAttackTpGain(caster, skill)).toBe(30);
    });
  });

  describe('whenHit gain calculations', () =>
  {
    it('aggregates flat/percent/formula across every traited source, scaled by rec', () =>
    {
      const sourceA = {};
      const sourceB = {};
      const targetBattler = buildBattler({ mhp: 200, rec: 1, hcrSources: () => [ sourceA, sourceB ] });

      getNumberFromNoteByRegexMock.mockImplementation((data, regexp) =>
      {
        if (regexp === regexNamespace.WhenHitHpGainFlat) return data === sourceA ? 5 : 15;
        return 0;
      });

      // (5 + 15) flat, no percent/formula contribution -> 20 total * rec 1 = 20.
      expect(ResourceHitManager.whenHitHpGain(targetBattler, 100)).toBe(20);
    });

    it('passes damage through as the formula\'s b binding', () =>
    {
      const source = {};
      const targetBattler = buildBattler({ hcrSources: () => [ source ] });

      getResultFromNoteByRegexMock.mockImplementation((data, regexp, damageArg) =>
      {
        if (regexp === regexNamespace.WhenHitTpGainFormula) return damageArg;
        return 0;
      });

      expect(ResourceHitManager.whenHitTpGain(targetBattler, 42)).toBe(42);
    });
  });

  describe('applyOnAttackEffects', () =>
  {
    it('applies drain (lst/mst/tst) only when hp damage was actually dealt', () =>
    {
      const caster = buildBattler({ lst: 0.5, mst: 0.2, tst: 0.1 });
      const targetBattler = { result: () => ({ hpDamage: 100 }) };
      const action = {
        getCaster: () => ({ getBattler: () => caster }),
        getBaseSkill: () => ({}),
      };
      const target = { getBattler: () => targetBattler };

      ResourceHitManager.applyOnAttackEffects(action, target);

      expect(caster.gainHpFromResource).toHaveBeenCalledWith(50);
      expect(caster.gainMpFromResource).toHaveBeenCalledWith(20);
      expect(caster.gainTpFromResource).toHaveBeenCalledWith(10);
    });

    it('does not call gain* when there was no hp damage and no tag-driven gain', () =>
    {
      const caster = buildBattler({ lst: 0.5 });
      const targetBattler = { result: () => ({ hpDamage: 0 }) };
      const action = {
        getCaster: () => ({ getBattler: () => caster }),
        getBaseSkill: () => ({}),
      };
      const target = { getBattler: () => targetBattler };

      ResourceHitManager.applyOnAttackEffects(action, target);

      expect(caster.gainHpFromResource).not.toHaveBeenCalled();
      expect(caster.gainMpFromResource).not.toHaveBeenCalled();
      expect(caster.gainTpFromResource).not.toHaveBeenCalled();
    });
  });

  describe('applyWhenHitEffects', () =>
  {
    it('applies the calculated when-hit gain to the target battler', () =>
    {
      const source = {};
      const targetBattler = buildBattler({ result: () => ({ hpDamage: 80 }), hcrSources: () => [ source ] });

      getNumberFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === regexNamespace.WhenHitHpGainFlat) return 7;
        return 0;
      });

      const action = {};
      const target = { getBattler: () => targetBattler };

      ResourceHitManager.applyWhenHitEffects(action, target);

      expect(targetBattler.gainHpFromResource).toHaveBeenCalledWith(7);
    });

    it('grants the mp and tp side of a when-hit tag as well as the hp side', () =>
    {
      // Arrange- all three are calculated on every hit, so a tag that only ever restored hp would
      // look correct in a testplay of a project that never wrote the other two.
      const source = {};
      const targetBattler = buildBattler({ result: () => ({ hpDamage: 80 }), hcrSources: () => [ source ] });

      getNumberFromNoteByRegexMock.mockImplementation((_data, regexp) =>
      {
        if (regexp === regexNamespace.WhenHitMpGainFlat) return 3;
        if (regexp === regexNamespace.WhenHitTpGainFlat) return 4;
        return 0;
      });

      // Act
      ResourceHitManager.applyWhenHitEffects({}, { getBattler: () => targetBattler });

      // Assert
      expect(targetBattler.gainMpFromResource).toHaveBeenCalledWith(3);
      expect(targetBattler.gainTpFromResource).toHaveBeenCalledWith(4);
    });

    it('grants nothing at all when the battler carries no when-hit tags', () =>
    {
      // Arrange- this runs on every hit taken by every battler on the map, and a zero-valued gain
      // would still pop a "0" over their head.
      const source = {};
      const targetBattler = buildBattler({ result: () => ({ hpDamage: 80 }), hcrSources: () => [ source ] });

      getNumberFromNoteByRegexMock.mockImplementation(() => 0);

      // Act
      ResourceHitManager.applyWhenHitEffects({}, { getBattler: () => targetBattler });

      // Assert
      expect(targetBattler.gainHpFromResource).not.toHaveBeenCalled();
      expect(targetBattler.gainMpFromResource).not.toHaveBeenCalled();
      expect(targetBattler.gainTpFromResource).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/resources/_component/resource-hit-manager.test.js
