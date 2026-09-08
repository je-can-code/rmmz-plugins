//region plugins/omni/ext/quest/managers/quest-overview-wrapper.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import QuestOverviewWrapper from '../../../../../../src/plugins/omni/ext/quest/managers/QuestOverviewWrapper.js';

describe('QuestOverviewWrapper (omni ext/quest, direct src import)', () =>
{
  beforeAll(() =>
  {
    // the wrapper compares against J-Base's empty-string sentinel, which is installed onto String at boot.
    String.empty = '';
  });

  afterAll(() =>
  {
    delete String.empty;
  });

  /**
   * A fit predicate that accepts any candidate at or under the given character count, standing in for
   * a pixel measurement without depending on one.
   * @param {number} limit The widest line allowed.
   * @returns {function(string): boolean}
   */
  const fitsWithin = limit => line => line.length <= limit;

  describe('constructor', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange & Act & Assert
      expect(() => new QuestOverviewWrapper()).toThrow('This is a static class.');
    });
  });

  describe('wrap', () =>
  {
    it('keeps a paragraph that fits on a single line', () =>
    {
      // Arrange
      const overview = 'three words here';

      // Act
      const lines = QuestOverviewWrapper.wrap(overview, fitsWithin(40));

      // Assert
      expect(lines).toEqual([ 'three words here' ]);
    });

    it('breaks before the word that would overrun, keeping the words before it together', () =>
    {
      // Arrange- the limit lands between "one two" (7) and "one two three" (13), so the third word is
      // the first that fails to fit, and "four" has to join it on the second line rather than a third.
      const overview = 'one two three four';

      // Act
      const lines = QuestOverviewWrapper.wrap(overview, fitsWithin(10));

      // Assert
      expect(lines).toEqual([ 'one two', 'three four' ]);
    });

    it('lets a first word wider than the pane open the line rather than pushing an empty one', () =>
    {
      // Arrange- nothing is in progress when "enormous" fails to fit, so there is no line to finish.
      const overview = 'enormous b';

      // Act
      const lines = QuestOverviewWrapper.wrap(overview, fitsWithin(5));

      // Assert: no leading empty line, and the wide word still lands on a line of its own.
      expect(lines).toEqual([ 'enormous', 'b' ]);
    });

    it('gives a word wider than the pane its own line rather than dropping it', () =>
    {
      // Arrange- "enormous" is eight characters against a limit of five, so nothing can hold it.
      const overview = 'a enormous b';

      // Act
      const lines = QuestOverviewWrapper.wrap(overview, fitsWithin(5));

      // Assert
      expect(lines).toEqual([ 'a', 'enormous', 'b' ]);
    });

    it('ends the line in progress at an authored break and leaves a gap', () =>
    {
      // Arrange- a doubled space splits into a blank token, which is how an authored break arrives.
      const overview = 'first part  second part';

      // Act
      const lines = QuestOverviewWrapper.wrap(overview, fitsWithin(40));

      // Assert
      expect(lines).toEqual([ 'first part', '', 'second part' ]);
    });

    it('collapses consecutive authored breaks into a single gap', () =>
    {
      // Arrange- three spaces yield two blank tokens in a row.
      const overview = 'first   second';

      // Act
      const lines = QuestOverviewWrapper.wrap(overview, fitsWithin(40));

      // Assert
      expect(lines).toEqual([ 'first', '', 'second' ]);
    });

    it('opens with a gap when the paragraph starts on an authored break', () =>
    {
      // Arrange- a leading space is a blank token with no line in progress to finish.
      const overview = ' after';

      // Act
      const lines = QuestOverviewWrapper.wrap(overview, fitsWithin(40));

      // Assert
      expect(lines).toEqual([ '', 'after' ]);
    });

    it('drops a trailing authored break without leaving an empty final line', () =>
    {
      // Arrange- the trailing space breaks the line, then there is nothing left to start a new one.
      const overview = 'done ';

      // Act
      const lines = QuestOverviewWrapper.wrap(overview, fitsWithin(40));

      // Assert
      expect(lines).toEqual([ 'done', '' ]);
    });

    it('measures candidates through the predicate it was handed, not by character count', () =>
    {
      // Arrange- a predicate that refuses anything containing "x" proves the wrapper never counts.
      const overview = 'ab xy cd';
      const fits = line => !line.includes('x');

      // Act
      const lines = QuestOverviewWrapper.wrap(overview, fits);

      // Assert
      expect(lines).toEqual([ 'ab', 'xy', 'cd' ]);
    });
  });
});
//endregion plugins/omni/ext/quest/managers/quest-overview-wrapper.test.js
