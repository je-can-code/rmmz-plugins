//region plugins/sdp/core/managers/mastery-formula-phrase.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The phraser turns engine arithmetic into a sentence. Its most important behaviour is refusing:
 * a formula it cannot read term by term must yield null rather than a plausible reading, because the
 * caller renders whatever it returns straight into a purchase decision.
 */
describe('MasteryFormulaPhrase (direct src import)', () =>
{
  let MasteryFormulaPhrase;

  beforeAll(async () =>
  {
    Object.defineProperty(String, 'empty', { value: '', configurable: true });

    ({ default: MasteryFormulaPhrase } = await import(
      '../../../../../src/plugins/sdp/core/managers/MasteryFormulaPhrase.js'));
  });

  //region phraseFor
  describe('phraseFor', () =>
  {
    it('reads a fraction of a parameter as a percentage of it', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('a.mhp * 0.01');

      // Assert
      expect(result).toBe('1% of your Max Life');
    });

    it('reads a whole multiple as a multiple rather than a percentage', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('a.mat * 3');

      // Assert
      expect(result).toBe('3x your Force');
    });

    it('distinguishes the target from the caster', () =>
    {
      // Arrange: the near-miss sibling of the test above, differing only in subject.
      const result = MasteryFormulaPhrase.phraseFor('b.mat * 3');

      // Assert
      expect(result).toBe('3x their Force');
    });

    it('omits a coefficient of one entirely', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('a.level');

      // Assert
      expect(result).toBe('your level');
    });

    it('joins added terms with the word plus', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('(b.mhp * 0.02) + (a.mdf * 2)');

      // Assert
      expect(result).toBe('2% of their Max Life plus 2x your Resist');
    });

    it('joins subtracted terms with the word less', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('(a.mat*3) - (b.mdf*1)');

      // Assert
      expect(result).toBe('3x your Force less their Resist');
    });

    it('reads a bare context variable without a subject word', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('d * 0.50');

      // Assert
      expect(result).toBe('50% of the damage taken');
    });

    it('reads a method call as the thing it counts', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('a.getMasteryCount() * 0.01');

      // Assert
      expect(result).toBe('1% of your mastery count');
    });

    it('reads an unscaled method call without a coefficient', () =>
    {
      // Arrange: the near-miss sibling of the scaled call above, with no multiplier at all.
      const result = MasteryFormulaPhrase.phraseFor('a.getMasteryCount()');

      // Assert
      expect(result).toBe('your mastery count');
    });

    it('reads a maximum less a current as the missing amount', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('(b.mhp - b.hp) * 0.035');

      // Assert
      expect(result).toBe('3.5% of their missing Life');
    });

    it('drops the standard mitigation clause rather than reading it aloud', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('b.mhp*0.015 * (100 / (100 + b.mdf))');

      // Assert
      expect(result).toBe('1.5% of their Max Life');
    });

    it('refuses a scaled group it cannot read term by term', () =>
    {
      // Arrange: reading this left to right would change what it means.
      const result = MasteryFormulaPhrase.phraseFor('(a.atk + b.def) * 2');

      // Assert
      expect(result).toBeNull();
    });

    it('refuses a term naming a parameter it has no word for', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('a.zzz * 2');

      // Assert
      expect(result).toBeNull();
    });

    it('refuses a method call it has no word for', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('a.getSomethingElse() * 2');

      // Assert
      expect(result).toBeNull();
    });

    it('refuses a term that is not a term at all', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('%%%');

      // Assert
      expect(result).toBeNull();
    });

    it('refuses an empty formula', () =>
    {
      // Arrange & Act
      const result = MasteryFormulaPhrase.phraseFor('   ');

      // Assert
      expect(result).toBeNull();
    });
  });
  //endregion phraseFor

  //region construction
  describe('construction', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange & Act & Assert
      expect(() => new MasteryFormulaPhrase()).toThrow('This is a static class.');
    });
  });
  //endregion construction
});
//endregion plugins/sdp/core/managers/mastery-formula-phrase.test.js