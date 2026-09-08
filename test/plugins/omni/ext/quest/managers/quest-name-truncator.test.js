//region plugins/omni/ext/quest/managers/quest-name-truncator.test.js
import { describe, expect, it } from 'vitest';

import QuestNameTruncator from '../../../../../../src/plugins/omni/ext/quest/managers/QuestNameTruncator.js';

describe('QuestNameTruncator (omni ext/quest, direct src import)', () =>
{
  /**
   * A fit predicate that accepts any candidate at or under the given character count, standing in for
   * a pixel measurement without depending on one.
   * @param {number} limit The widest name allowed.
   * @returns {function(string): boolean}
   */
  const fitsWithin = limit => name => name.length <= limit;

  describe('constructor', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange & Act & Assert
      expect(() => new QuestNameTruncator()).toThrow('This is a static class.');
    });
  });

  describe('fit', () =>
  {
    it('returns a name that already fits untouched, with no ellipsis', () =>
    {
      // Arrange
      const name = 'Trekking to Town';

      // Act
      const fitted = QuestNameTruncator.fit(name, fitsWithin(20));

      // Assert
      expect(fitted).toBe('Trekking to Town');
    });

    it('drops words from the end until the marked name fits', () =>
    {
      // Arrange- "The Journey Begins…" is 19 characters; one more word would be 24, one fewer is 12.
      const name = 'The Journey Begins With Darkness';

      // Act
      const fitted = QuestNameTruncator.fit(name, fitsWithin(20));

      // Assert: the cut lands on the widest candidate that fits, not the first one that does.
      expect(fitted).toBe('The Journey Begins…');
    });

    it('keeps an escape code intact by cutting between words rather than inside one', () =>
    {
      // Arrange- the marked candidate is 25 characters, five of them the color code; a character-based
      // cut at that limit would land inside the closing code instead.
      const name = 'Deal with the \\C[1]Water Entity\\C[0]';

      // Act
      const fitted = QuestNameTruncator.fit(name, fitsWithin(25));

      // Assert
      expect(fitted).toBe('Deal with the \\C[1]Water…');
    });

    it('marks a lone word that cannot fit rather than returning nothing', () =>
    {
      // Arrange- one word wider than the pane leaves nothing to drop.
      const name = 'Antidisestablishmentarianism';

      // Act
      const fitted = QuestNameTruncator.fit(name, fitsWithin(10));

      // Assert
      expect(fitted).toBe('Antidisestablishmentarianism…');
    });

    it('falls all the way to the first word when only that fits', () =>
    {
      // Arrange- every multi-word candidate is too wide; the first word alone with its mark is not.
      const name = 'Four Former Protagonists';

      // Act
      const fitted = QuestNameTruncator.fit(name, fitsWithin(6));

      // Assert
      expect(fitted).toBe('Four…');
    });

    it('measures through the predicate it was handed, not by character count', () =>
    {
      // Arrange- a predicate that refuses anything containing "x" proves the truncator never counts.
      const name = 'ab cd xy';
      const fits = candidate => !candidate.includes('x');

      // Act
      const fitted = QuestNameTruncator.fit(name, fits);

      // Assert
      expect(fitted).toBe('ab cd…');
    });
  });
});
//endregion plugins/omni/ext/quest/managers/quest-name-truncator.test.js
