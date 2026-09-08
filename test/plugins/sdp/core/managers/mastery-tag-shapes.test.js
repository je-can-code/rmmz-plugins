//region plugins/sdp/core/managers/mastery-tag-shapes.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The table exists so a resolver never guesses which argument of a tag is the magnitude. The tests
 * pin tags whose shapes disagree with one another, because a lookup that ignored the tag name would
 * still pass against any single one of them.
 */
describe('MasteryTagShapes (direct src import)', () =>
{
  let MasteryTagShapes;

  beforeAll(async () =>
  {
    ({ default: MasteryTagShapes } = await import(
      '../../../../../src/plugins/sdp/core/managers/MasteryTagShapes.js'));
  });

  //region indexOf
  describe('indexOf', () =>
  {
    it('answers the declared index for a tag carrying its magnitude last', () =>
    {
      // Arrange & Act
      const result = MasteryTagShapes.indexOf('boostElement', 'magnitude');

      // Assert
      expect(result).toBe(1);
    });

    it('answers a different index for a tag carrying its magnitude first', () =>
    {
      // Arrange: the near-miss sibling. Same meaning, opposite position.
      const result = MasteryTagShapes.indexOf('onSelfHpHealMp', 'magnitude');

      // Assert
      expect(result).toBe(0);
    });

    it('answers the declared index for a meaning other than magnitude', () =>
    {
      // Arrange & Act
      const result = MasteryTagShapes.indexOf('autoExecuteSkill', 'interval');

      // Assert
      expect(result).toBe(3);
    });

    it('answers null for a meaning the tag does not declare', () =>
    {
      // Arrange: boostElement has a magnitude but no cadence.
      const result = MasteryTagShapes.indexOf('boostElement', 'interval');

      // Assert
      expect(result).toBeNull();
    });

    it('answers null for a tag the table does not describe', () =>
    {
      // Arrange & Act
      const result = MasteryTagShapes.indexOf('cdr', 'magnitude');

      // Assert
      expect(result).toBeNull();
    });
  });
  //endregion indexOf

  //region construction
  describe('construction', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange & Act & Assert
      expect(() => new MasteryTagShapes()).toThrow('This is a static class.');
    });
  });
  //endregion construction
});
//endregion plugins/sdp/core/managers/mastery-tag-shapes.test.js