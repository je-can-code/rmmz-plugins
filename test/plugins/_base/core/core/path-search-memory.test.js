//region plugins/_base/core/core/path-search-memory.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * J-Base's memory of path searches that could not reach their goal.
 *
 * Every test hands it a fresh character, since what it remembers is held per character, and a search
 * that is a spy, so whether the search actually ran is the thing being asserted. A remembered answer
 * is only ever reused for the same character, the same kind of search, the same start tile and the
 * same goal tile, within {@link PathSearchMemory.holdFrames} frames; each of those has its own test,
 * with the other four held identical so only the one under test can be what forces a fresh search.
 */
describe('PathSearchMemory', () =>
{
  /** @type {typeof import('../../../../../src/plugins/_base/core/core/PathSearchMemory.js').default} */
  let PathSearchMemory;

  beforeAll(async () =>
  {
    ({ default: PathSearchMemory } = await import('../../../../../src/plugins/_base/core/core/PathSearchMemory.js'));
  });

  /**
   * Builds a search request between two tiles; everything but the ends is irrelevant to the memory.
   * @param {Object} ends The ends of the search.
   * @param {number} ends.startX The start's x tile.
   * @param {number} ends.startY The start's y tile.
   * @param {number} ends.goalX The goal's x tile.
   * @param {number} ends.goalY The goal's y tile.
   * @returns {Object} The request.
   */
  const aRequest = ({ startX = 1, startY = 1, goalX = 5, goalY = 5 } = {}) => ({ startX, startY, goalX, goalY });

  /**
   * Builds a search that never reaches its goal.
   * @returns {function(): {x: number, y: number, reachedGoal: boolean}} The search, as a spy.
   */
  const aFailingSearch = () => vi.fn(() => ({ x: 2, y: 1, reachedGoal: false }));

  describe('firstStep', () =>
  {
    it('searches for a character that has never failed a search', () =>
    {
      // Arrange
      const character = {};
      const search = aFailingSearch();

      // Act
      const step = PathSearchMemory.firstStep(character, 'straight', 100, aRequest(), search);

      // Assert
      expect(search).toHaveBeenCalledTimes(1);
      expect(step).toEqual({ x: 2, y: 1, reachedGoal: false });
    });

    it('answers the same failed search from memory until its last frame', () =>
    {
      // Arrange - failed at frame 100, so remembered through frame 129.
      const character = {};
      const search = aFailingSearch();
      const first = PathSearchMemory.firstStep(character, 'straight', 100, aRequest(), search);

      // Act
      const second = PathSearchMemory.firstStep(character, 'straight', 129, aRequest(), search);

      // Assert - one search between the two answers, and the second is the first.
      expect(search).toHaveBeenCalledTimes(1);
      expect(second).toBe(first);
    });

    it('searches again once the memory has run its course', () =>
    {
      // Arrange
      const character = {};
      const search = aFailingSearch();
      PathSearchMemory.firstStep(character, 'straight', 100, aRequest(), search);

      // Act - thirty frames on, the first frame it no longer holds.
      PathSearchMemory.firstStep(character, 'straight', 130, aRequest(), search);

      // Assert
      expect(search).toHaveBeenCalledTimes(2);
    });

    it.each([
      [ 'a different column', { startX: 2 } ],
      [ 'a different row', { startY: 2 } ],
    ])('searches again from %s', (_, start) =>
    {
      // Arrange
      const character = {};
      const search = aFailingSearch();
      PathSearchMemory.firstStep(character, 'straight', 100, aRequest(), search);

      // Act
      PathSearchMemory.firstStep(character, 'straight', 101, aRequest(start), search);

      // Assert
      expect(search).toHaveBeenCalledTimes(2);
    });

    it.each([
      [ 'in a different column', { goalX: 6 } ],
      [ 'in a different row', { goalY: 6 } ],
    ])('searches again toward a goal %s', (_, goal) =>
    {
      // Arrange
      const character = {};
      const search = aFailingSearch();
      PathSearchMemory.firstStep(character, 'straight', 100, aRequest(), search);

      // Act
      PathSearchMemory.firstStep(character, 'straight', 101, aRequest(goal), search);

      // Assert
      expect(search).toHaveBeenCalledTimes(2);
    });

    it('keeps a different kind of search apart', () =>
    {
      // Arrange - the same character failed a four-way search between the same tiles.
      const character = {};
      const search = aFailingSearch();
      PathSearchMemory.firstStep(character, 'straight', 100, aRequest(), search);

      // Act
      PathSearchMemory.firstStep(character, 'diagonal', 101, aRequest(), search);

      // Assert
      expect(search).toHaveBeenCalledTimes(2);
    });

    it('remembers a failure of each kind side by side', () =>
    {
      // Arrange - the same character fails a four-way search, then an eight-way one.
      const character = {};
      const search = aFailingSearch();
      PathSearchMemory.firstStep(character, 'straight', 100, aRequest(), search);
      PathSearchMemory.firstStep(character, 'diagonal', 101, aRequest(), search);

      // Act - the four-way search asked again, still within its moment.
      PathSearchMemory.firstStep(character, 'straight', 102, aRequest(), search);

      // Assert - remembering the second did not cost the first.
      expect(search).toHaveBeenCalledTimes(2);
    });

    it('keeps a different character apart', () =>
    {
      // Arrange - somebody else failed exactly this search a frame ago.
      const search = aFailingSearch();
      PathSearchMemory.firstStep({}, 'straight', 100, aRequest(), search);

      // Act
      PathSearchMemory.firstStep({}, 'straight', 101, aRequest(), search);

      // Assert
      expect(search).toHaveBeenCalledTimes(2);
    });

    it('never remembers a search that reached its goal', () =>
    {
      // Arrange
      const character = {};
      const search = vi.fn(() => ({ x: 2, y: 1, reachedGoal: true }));
      PathSearchMemory.firstStep(character, 'straight', 100, aRequest(), search);

      // Act
      PathSearchMemory.firstStep(character, 'straight', 101, aRequest(), search);

      // Assert
      expect(search).toHaveBeenCalledTimes(2);
    });

    it('remembers only the latest failure of each kind', () =>
    {
      // Arrange - a failure from one tile, then another from a second tile, which replaces it.
      const character = {};
      const search = aFailingSearch();
      PathSearchMemory.firstStep(character, 'straight', 100, aRequest(), search);
      PathSearchMemory.firstStep(character, 'straight', 101, aRequest({ startX: 2 }), search);

      // Act - back to the first tile, still well within its moment.
      PathSearchMemory.firstStep(character, 'straight', 102, aRequest(), search);

      // Assert
      expect(search).toHaveBeenCalledTimes(3);
    });
  });
});
//endregion plugins/_base/core/core/path-search-memory.test.js
