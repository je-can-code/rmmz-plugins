//region plugins/pixel/core/managers/path-search-event-index.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * J-Pixelistics' lookup of which events stand on which tile, built for the length of a path search.
 *
 * Its whole promise is to answer exactly what the engine's `eventsXyNt` walk answers, so besides the
 * cases drawn by hand, the last test checks it against that walk tile by tile over a few hundred
 * seeded layouts. The walk there is the engine's own rule - `posNt`, with an event standing on every
 * tile of its area - written as a containment test rather than the lookup's enumeration, which is
 * what makes the comparison worth something.
 */
describe('PathSearchEventIndex', () =>
{
  /** @type {typeof import('../../../../../src/plugins/pixel/core/managers/PathSearchEventIndex.js').default} */
  let PathSearchEventIndex;

  beforeAll(async () =>
  {
    ({ default: PathSearchEventIndex } = await import('../../../../../src/plugins/pixel/core/managers/PathSearchEventIndex.js'));
  });

  beforeEach(() =>
  {
    // the lookup is static, so each test starts with none built.
    PathSearchEventIndex.clear();
  });

  /**
   * Builds an event covering an area of tiles.
   * @param {string} name A name, so a failing assertion says which event it is.
   * @param {number[]} bounds The area as `[left, top, width, height]`.
   * @param {boolean} isThrough Whether it passes through things.
   * @returns {Object} The event.
   */
  const anEvent = (name, [ left, top, width, height ], isThrough = false) => ({
    name,
    isThrough: () => isThrough,
    areaBounds: () => ({ left, top, width, height }),
  });

  describe('isBuilt', () =>
  {
    it('is not built until a search builds it', () =>
    {
      // Arrange - cleared before every test.

      // Act
      const isBuilt = PathSearchEventIndex.isBuilt();

      // Assert
      expect(isBuilt).toBe(false);
    });

    it('is built once a search builds it', () =>
    {
      // Arrange
      const events = [ anEvent('crate', [ 1, 1, 1, 1 ]) ];

      // Act
      PathSearchEventIndex.build(events);

      // Assert
      expect(PathSearchEventIndex.isBuilt()).toBe(true);
    });

    it('stops answering once cleared', () =>
    {
      // Arrange
      PathSearchEventIndex.build([ anEvent('crate', [ 1, 1, 1, 1 ]) ]);

      // Act
      PathSearchEventIndex.clear();

      // Assert
      expect(PathSearchEventIndex.isBuilt()).toBe(false);
    });
  });

  describe('eventsAt', () =>
  {
    it('lists an event on its own tile', () =>
    {
      // Arrange
      const crate = anEvent('crate', [ 3, 4, 1, 1 ]);
      PathSearchEventIndex.build([ crate ]);

      // Act
      const events = PathSearchEventIndex.eventsAt(3, 4);

      // Assert
      expect(events).toEqual([ crate ]);
    });

    it('lists an area event on every tile its area covers, and nowhere past it', () =>
    {
      // Arrange - three wide and two tall, from (2, 5).
      const zone = anEvent('zone', [ 2, 5, 3, 2 ]);
      PathSearchEventIndex.build([ zone ]);

      // Act
      const corners = [ [ 2, 5 ], [ 4, 5 ], [ 2, 6 ], [ 4, 6 ] ].map(([ x, y ]) => PathSearchEventIndex.eventsAt(x, y));
      const justPast = [ [ 5, 5 ], [ 2, 7 ], [ 1, 5 ], [ 2, 4 ] ].map(([ x, y ]) => PathSearchEventIndex.eventsAt(x, y));

      // Assert
      expect(corners).toEqual([ [ zone ], [ zone ], [ zone ], [ zone ] ]);
      expect(justPast).toEqual([ [], [], [], [] ]);
    });

    it('leaves out an event that passes through things', () =>
    {
      // Arrange - a ghost and a crate on the same tile.
      const ghost = anEvent('ghost', [ 1, 1, 1, 1 ], true);
      const crate = anEvent('crate', [ 1, 1, 1, 1 ]);
      PathSearchEventIndex.build([ ghost, crate ]);

      // Act
      const events = PathSearchEventIndex.eventsAt(1, 1);

      // Assert
      expect(events).toEqual([ crate ]);
    });

    it('lists several events on one tile in the map\'s own order', () =>
    {
      // Arrange
      const first = anEvent('first', [ 1, 1, 1, 1 ]);
      const second = anEvent('second', [ 0, 0, 2, 2 ]);
      PathSearchEventIndex.build([ first, second ]);

      // Act
      const events = PathSearchEventIndex.eventsAt(1, 1);

      // Assert
      expect(events).toEqual([ first, second ]);
    });

    it('answers an empty list for a row nobody stands in', () =>
    {
      // Arrange
      PathSearchEventIndex.build([ anEvent('crate', [ 1, 1, 1, 1 ]) ]);

      // Act
      const events = PathSearchEventIndex.eventsAt(1, 2);

      // Assert
      expect(events).toEqual([]);
    });

    it('answers an empty list for an empty tile in a row somebody stands in', () =>
    {
      // Arrange
      PathSearchEventIndex.build([ anEvent('crate', [ 1, 1, 1, 1 ]) ]);

      // Act
      const events = PathSearchEventIndex.eventsAt(2, 1);

      // Assert
      expect(events).toEqual([]);
    });

    it('lists an area reaching past the map\'s edge where it reaches', () =>
    {
      // Arrange - from column 58 on a map sixty wide, five across.
      const zone = anEvent('zone', [ 58, 0, 5, 1 ]);
      PathSearchEventIndex.build([ zone ]);

      // Act
      const events = PathSearchEventIndex.eventsAt(62, 0);

      // Assert - kept by its own column, rather than folded onto the next row.
      expect(events).toEqual([ zone ]);
      expect(PathSearchEventIndex.eventsAt(2, 1)).toEqual([]);
    });

    it('hands back a fresh list every time', () =>
    {
      // Arrange
      const crate = anEvent('crate', [ 1, 1, 1, 1 ]);
      PathSearchEventIndex.build([ crate ]);
      PathSearchEventIndex.eventsAt(1, 1)
        .push('scribble');

      // Act
      const events = PathSearchEventIndex.eventsAt(1, 1);

      // Assert - whatever a caller did to an earlier list stayed with that list.
      expect(events).toEqual([ crate ]);
    });

    it('answers exactly as the engine\'s walk does, across 200 layouts', () =>
    {
      // Arrange - seeded layouts of areas and ghosts, compared on every tile including past the edges.
      let state = 7;
      const next = () =>
      {
        state = (state * 1103515245 + 12345) % 2147483648;
        return state / 2147483648;
      };
      const layouts = Array.from({ length: 200 }, (_, layout) => Array.from({ length: 2 + (layout % 9) }, (__, id) =>
        anEvent(`${layout}:${id}`, [
          Math.floor(next() * 10),
          Math.floor(next() * 10),
          1 + Math.floor(next() * 4),
          1 + Math.floor(next() * 3),
        ], next() < 0.25)));
      const walk = (events, x, y) => events.filter(event =>
      {
        const { left, top, width, height } = event.areaBounds();
        const pos = x >= left && x < left + width && y >= top && y < top + height;
        return pos && event.isThrough() === false;
      });

      // Act
      const mismatches = layouts.flatMap(events =>
      {
        PathSearchEventIndex.build(events);
        const tiles = Array.from({ length: 16 * 16 }, (_, index) => [ (index % 16) - 1, Math.floor(index / 16) - 1 ]);
        return tiles.filter(([ x, y ]) =>
        {
          const indexed = PathSearchEventIndex.eventsAt(x, y);
          const walked = walk(events, x, y);
          return indexed.length !== walked.length || indexed.some((event, at) => event !== walked[at]);
        });
      });

      // Assert
      expect(mismatches).toHaveLength(0);
    });
  });
});
//endregion plugins/pixel/core/managers/path-search-event-index.test.js
