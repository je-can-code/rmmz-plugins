//region plugins/abs/ext/formula/__models/formula-effect.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('J-ABS-Formula FormulaEffect (unit, pure class, no downstream dependencies)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/formula/__models/FormulaEffect.js').default} */
  let FormulaEffect;

  beforeAll(async () =>
  {
    // String.empty is a J-Base runtime augmentation, always present by the time this file's
    // production code runs in-game; stub it here since this test doesn't boot J-Base itself.
    String.empty = '';

    ({ default: FormulaEffect } = await import('../../../../../../src/plugins/abs/ext/formula/__models/FormulaEffect.js'));
  });

  describe('validity checks', () =>
  {
    it.each([
      [ 'hit', true ],
      [ 'USE', true ],
      [ 'bogus', false ],
      [ undefined, false ],
    ])('isValidTrigger(%s) is %s', (input, expected) =>
    {
      expect(FormulaEffect.isValidTrigger(input)).toBe(expected);
    });

    it.each([
      [ 'self', true ],
      [ 'ALL', true ],
      [ 'bogus', false ],
    ])('isValidAffect(%s) is %s', (input, expected) =>
    {
      expect(FormulaEffect.isValidAffect(input)).toBe(expected);
    });

    it.each([
      [ 'hp', true ],
      [ 'MP', true ],
      [ 'bogus', false ],
    ])('isValidResource(%s) is %s', (input, expected) =>
    {
      expect(FormulaEffect.isValidResource(input)).toBe(expected);
    });

    it.each([
      [ 'skill', true ],
      [ 'FORMULA', true ],
      [ 'bogus', false ],
    ])('isValidMode(%s) is %s', (input, expected) =>
    {
      expect(FormulaEffect.isValidMode(input)).toBe(expected);
    });
  });

  describe('normalization', () =>
  {
    it('normalizeTrigger lowercases a valid trigger', () =>
    {
      expect(FormulaEffect.normalizeTrigger('HIT')).toBe('hit');
    });

    it('normalizeTrigger returns null for an invalid trigger', () =>
    {
      expect(FormulaEffect.normalizeTrigger('bogus')).toBeNull();
    });

    it('normalizeAffect lowercases a valid affect', () =>
    {
      expect(FormulaEffect.normalizeAffect('TARGET')).toBe('target');
    });

    it('normalizeAffect returns null for an invalid affect', () =>
    {
      expect(FormulaEffect.normalizeAffect('bogus')).toBeNull();
    });

    it('normalizeResource lowercases a valid resource', () =>
    {
      expect(FormulaEffect.normalizeResource('TP')).toBe('tp');
    });

    it('normalizeResource returns null for an invalid resource', () =>
    {
      expect(FormulaEffect.normalizeResource('bogus')).toBeNull();
    });

    it('normalizeMode lowercases a valid mode', () =>
    {
      expect(FormulaEffect.normalizeMode('SKILL')).toBe('skill');
    });

    it('normalizeMode returns null for an invalid mode', () =>
    {
      expect(FormulaEffect.normalizeMode('bogus')).toBeNull();
    });
  });

  describe('fromFormulaTuple', () =>
  {
    it('builds a formula-mode effect from a [trigger, affect, resource, formula] tuple', () =>
    {
      // Arrange
      const tuple = [ 'hit', 'target', 'mp', 'a.atk * 2' ];

      // Act
      const effect = FormulaEffect.fromFormulaTuple(tuple);

      // Assert
      expect(effect.trigger).toBe('hit');
      expect(effect.affect).toBe('target');
      expect(effect.mode).toBe(FormulaEffect.Mode.FORMULA);
      expect(effect.resource).toBe('mp');
      expect(effect.formula).toBe('a.atk * 2');
      expect(effect.skillId).toBe(0);
    });
  });

  describe('fromSkillTuple', () =>
  {
    it('builds a skill-mode effect from a [trigger, affect, skillIdString] tuple', () =>
    {
      // Arrange
      const tuple = [ 'use', 'self', '42' ];

      // Act
      const effect = FormulaEffect.fromSkillTuple(tuple);

      // Assert
      expect(effect.trigger).toBe('use');
      expect(effect.affect).toBe('self');
      expect(effect.mode).toBe(FormulaEffect.Mode.SKILL);
      expect(effect.skillId).toBe(42);
      expect(effect.resource).toBeNull();
      expect(effect.formula).toBe(String.empty);
    });
  });

  describe('constructor', () =>
  {
    it('defaults trigger to HIT when invalid or missing', () =>
    {
      const effect = new FormulaEffect({ affect: 'self', mode: 'formula' });
      expect(effect.trigger).toBe(FormulaEffect.Trigger.HIT);
    });

    it('defaults affect to TARGET when invalid or missing', () =>
    {
      const effect = new FormulaEffect({ trigger: 'hit', mode: 'formula' });
      expect(effect.affect).toBe(FormulaEffect.Affect.TARGET);
    });

    it('defaults mode to FORMULA when invalid or missing', () =>
    {
      const effect = new FormulaEffect({ trigger: 'hit', affect: 'self' });
      expect(effect.mode).toBe(FormulaEffect.Mode.FORMULA);
    });

    it('defaults resource to HP when formula mode is given an invalid resource', () =>
    {
      const effect = new FormulaEffect({ mode: 'formula', resource: 'bogus' });
      expect(effect.resource).toBe(FormulaEffect.Resource.HP);
    });

    it('uses the provided resource when formula mode and resource is valid', () =>
    {
      const effect = new FormulaEffect({ mode: 'formula', resource: 'tp' });
      expect(effect.resource).toBe('tp');
    });

    it('leaves resource null when mode is skill', () =>
    {
      const effect = new FormulaEffect({ mode: 'skill', skillId: 5, resource: 'hp' });
      expect(effect.resource).toBeNull();
    });

    it('stores the formula string when mode is formula', () =>
    {
      const effect = new FormulaEffect({ mode: 'formula', formula: 'a.mat * 3' });
      expect(effect.formula).toBe('a.mat * 3');
    });

    it('defaults formula to empty string when mode is formula and formula is missing', () =>
    {
      const effect = new FormulaEffect({ mode: 'formula' });
      expect(effect.formula).toBe(String.empty);
    });

    it('leaves formula empty when mode is skill', () =>
    {
      const effect = new FormulaEffect({ mode: 'skill', skillId: 5, formula: 'a.atk' });
      expect(effect.formula).toBe(String.empty);
    });

    it('parses skillId when mode is skill', () =>
    {
      const effect = new FormulaEffect({ mode: 'skill', skillId: '17' });
      expect(effect.skillId).toBe(17);
    });

    it('defaults skillId to 0 when mode is skill and skillId is invalid', () =>
    {
      const effect = new FormulaEffect({ mode: 'skill', skillId: 'not-a-number' });
      expect(effect.skillId).toBe(0);
    });

    it('leaves skillId 0 when mode is formula', () =>
    {
      const effect = new FormulaEffect({ mode: 'formula', skillId: 5 });
      expect(effect.skillId).toBe(0);
    });
  });
});
//endregion plugins/abs/ext/formula/__models/formula-effect.test.js
