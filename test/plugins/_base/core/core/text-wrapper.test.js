//region plugins/_base/core/core/text-wrapper.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The wrapper exists so a window never decides where a sentence breaks inline, where nothing could
 * test it. Measuring is injected, so these tests use a fixed ten pixels per character and can pin
 * exact break points rather than asserting something vague about lengths.
 */
describe('TextWrapper (direct src import)', () =>
{
  let TextWrapper;

  // ten pixels a character, so a width of 100 holds exactly ten characters.
  const measure = text => text.length * 10;

  beforeAll(async () =>
  {
    Object.defineProperty(String, 'empty', { value: '', configurable: true });

    ({ default: TextWrapper } = await import(
      '../../../../../src/plugins/_base/core/core/TextWrapper.js'));
  });

  //region wrap
  describe('wrap', () =>
  {
    it('keeps words on one line while they fit', () =>
    {
      // Arrange & Act
      const result = TextWrapper.wrap('one two', 100, measure);

      // Assert
      expect(result).toEqual([ 'one two' ]);
    });

    it('breaks to a new line at the word that would overflow', () =>
    {
      // Arrange: "one two" is seven characters and fits; adding "three" would be thirteen.
      const result = TextWrapper.wrap('one two three', 100, measure);

      // Assert
      expect(result).toEqual([ 'one two', 'three' ]);
    });

    it('breaks repeatedly across a longer run', () =>
    {
      // Arrange & Act
      const result = TextWrapper.wrap('aaa bbb ccc ddd eee', 70, measure);

      // Assert
      expect(result).toEqual([ 'aaa bbb', 'ccc ddd', 'eee' ]);
    });

    it('gives a word wider than the line a line of its own rather than chopping it', () =>
    {
      // Arrange: the short words on either side prove the long one was isolated, not merely first.
      const result = TextWrapper.wrap('ab supercalifragilistic cd', 60, measure);

      // Assert
      expect(result).toEqual([ 'ab', 'supercalifragilistic', 'cd' ]);
    });

    it('starts no empty line when the very first word already overflows', () =>
    {
      // Arrange: the near-miss sibling of the case above, with the long word leading instead.
      const result = TextWrapper.wrap('supercalifragilistic ab', 60, measure);

      // Assert: no blank line precedes it.
      expect(result).toEqual([ 'supercalifragilistic', 'ab' ]);
    });

    it('collapses runs of whitespace between words', () =>
    {
      // Arrange & Act
      const result = TextWrapper.wrap('one    two', 100, measure);

      // Assert
      expect(result).toEqual([ 'one two' ]);
    });

    it('yields no lines at all for text that is only whitespace', () =>
    {
      // Arrange & Act
      const result = TextWrapper.wrap('   ', 100, measure);

      // Assert
      expect(result).toEqual([]);
    });

    it('yields no lines at all for empty text', () =>
    {
      // Arrange & Act
      const result = TextWrapper.wrap(String.empty, 100, measure);

      // Assert
      expect(result).toEqual([]);
    });
  });
  //endregion wrap

  //region wrapToLines
  describe('wrapToLines', () =>
  {
    it('leaves the lines alone when they already fit the budget', () =>
    {
      // Arrange & Act
      const result = TextWrapper.wrapToLines('one two three', 100, 2, measure);

      // Assert
      expect(result).toEqual([ 'one two', 'three' ]);
    });

    it('folds every remaining line onto the last rather than dropping any', () =>
    {
      // Arrange: three lines' worth of words squeezed into a budget of two.
      const result = TextWrapper.wrapToLines('aaa bbb ccc ddd eee', 70, 2, measure);

      // Assert: nothing is lost, and the final line is knowingly over-long.
      expect(result).toEqual([ 'aaa bbb', 'ccc ddd eee' ]);
    });

    it('folds everything onto one line for a budget of one', () =>
    {
      // Arrange & Act
      const result = TextWrapper.wrapToLines('aaa bbb ccc', 30, 1, measure);

      // Assert
      expect(result).toEqual([ 'aaa bbb ccc' ]);
    });
  });
  //endregion wrapToLines

  //region construction
  describe('construction', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange & Act & Assert
      expect(() => new TextWrapper()).toThrow('This is a static class.');
    });
  });
  //endregion construction
});
//endregion plugins/_base/core/core/text-wrapper.test.js