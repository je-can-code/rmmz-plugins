//region plugins/_base/core/models/filter-cycle.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The ring behind the L2/R2 tab strip.
 *
 * Everything worth protecting here is a boundary: wrapping past either end, preserving the player's tab
 * across a rebuild they did not ask for, and refusing to move when there is nowhere to go. Each of those is
 * a place where an off-by-one reads as the menu quietly losing its place rather than as a crash.
 */
describe('FilterCycle (direct src import)', () =>
{
  let FilterCycle;

  /**
   * Builds a position of the shape the cycle carries.
   * @param {string} key The position's key.
   * @returns {{key: string, name: string, iconIndex: number}}
   */
  const positionFor = key => ({
    key,
    name: `${key} name`,
    iconIndex: 1,
  });

  beforeAll(async () =>
  {
    String.empty = '';

    ({ default: FilterCycle } = await import('../../../../../src/plugins/_base/core/models/FilterCycle.js'));
  });

  describe('constructor', () =>
  {
    it('starts on the first position when given some', () =>
    {
      // Arrange & Act
      const cycle = new FilterCycle([ positionFor('alpha'), positionFor('beta') ]);

      // Assert
      expect(cycle.activeKey())
        .toBe('alpha');
    });

    it('answers ALL when constructed with nothing, so an unbuilt cycle shows everything', () =>
    {
      // Arrange & Act
      const cycle = new FilterCycle();

      // Assert
      expect(cycle.activeKey())
        .toBe(FilterCycle.ALL);
    });
  });

  describe('activePosition()', () =>
  {
    it('hands back the selected position', () =>
    {
      // Arrange
      const cycle = new FilterCycle([ positionFor('alpha'), positionFor('beta') ]);

      // Act
      const position = cycle.activePosition();

      // Assert
      expect(position.name)
        .toBe('alpha name');
    });

    it('hands back the empty position rather than null when there is nothing to select', () =>
    {
      // Arrange
      const cycle = new FilterCycle();

      // Act
      const position = cycle.activePosition();

      // Assert
      expect(position)
        .toBe(FilterCycle.EMPTY_POSITION);
    });
  });

  describe('canCycle()', () =>
  {
    it('is false with nothing to walk', () =>
    {
      // Arrange & Act
      const cycle = new FilterCycle();

      // Assert
      expect(cycle.canCycle())
        .toBe(false);
    });

    it('is false with a single position, because moving would land where it already is', () =>
    {
      // Arrange & Act
      const cycle = new FilterCycle([ positionFor('alpha') ]);

      // Assert
      expect(cycle.canCycle())
        .toBe(false);
    });

    it('is true once there are two places to be', () =>
    {
      // Arrange & Act
      const cycle = new FilterCycle([ positionFor('alpha'), positionFor('beta') ]);

      // Assert
      expect(cycle.canCycle())
        .toBe(true);
    });
  });

  describe('next()', () =>
  {
    it('advances one place', () =>
    {
      // Arrange
      const cycle = new FilterCycle([ positionFor('alpha'), positionFor('beta'), positionFor('gamma') ]);

      // Act
      cycle.next();

      // Assert
      expect(cycle.activeKey())
        .toBe('beta');
    });

    it('wraps from the last position back to the first', () =>
    {
      // Arrange
      const cycle = new FilterCycle([ positionFor('alpha'), positionFor('beta'), positionFor('gamma') ]);
      cycle.next();
      cycle.next();

      // Act
      cycle.next();

      // Assert
      expect(cycle.activeKey())
        .toBe('alpha');
    });

    it('stays put when there is nowhere to go', () =>
    {
      // Arrange
      const cycle = new FilterCycle([ positionFor('alpha') ]);

      // Act
      cycle.next();

      // Assert
      expect(cycle.activeKey())
        .toBe('alpha');
    });
  });

  describe('previous()', () =>
  {
    it('steps back one place', () =>
    {
      // Arrange
      const cycle = new FilterCycle([ positionFor('alpha'), positionFor('beta'), positionFor('gamma') ]);
      cycle.next();

      // Act
      cycle.previous();

      // Assert
      expect(cycle.activeKey())
        .toBe('alpha');
    });

    it('wraps from the first position round to the last', () =>
    {
      // Arrange
      const cycle = new FilterCycle([ positionFor('alpha'), positionFor('beta'), positionFor('gamma') ]);

      // Act
      cycle.previous();

      // Assert
      expect(cycle.activeKey())
        .toBe('gamma');
    });

    it('stays put when there is nowhere to go', () =>
    {
      // Arrange
      const cycle = new FilterCycle([ positionFor('alpha') ]);

      // Act
      cycle.previous();

      // Assert
      expect(cycle.activeKey())
        .toBe('alpha');
    });

    it('leaves an empty ring alone rather than poisoning the index', () =>
    {
      // Arrange - a modulo by zero would answer NaN, which no later position lookup could recover from.
      const cycle = new FilterCycle([]);

      // Act
      cycle.previous();

      // Assert
      expect(cycle.activePosition())
        .toBe(FilterCycle.EMPTY_POSITION);
      expect(cycle.activeKey())
        .toBe(FilterCycle.EMPTY_POSITION.key);
    });
  });

  describe('cycling an empty ring', () =>
  {
    it('leaves an empty ring alone when advancing', () =>
    {
      // Arrange
      const cycle = new FilterCycle([]);

      // Act
      cycle.next();

      // Assert
      expect(cycle.activePosition())
        .toBe(FilterCycle.EMPTY_POSITION);
    });

    it('still lands on the first position once the ring is filled after being cycled while empty', () =>
    {
      // Arrange - proves the index survived the empty steps rather than merely reading as empty.
      const cycle = new FilterCycle([]);
      cycle.next();
      cycle.previous();

      // Act
      cycle.setPositions([ positionFor('alpha'), positionFor('beta') ]);

      // Assert
      expect(cycle.activeKey())
        .toBe('alpha');
    });
  });

  describe('setPositions()', () =>
  {
    it('keeps the player on the same tab when it survives the rebuild', () =>
    {
      // Arrange- park on the third tab, then rebuild with it at a slot that is neither its old index nor
      // the front, so "kept the key" cannot be mistaken for "fell back to zero" or "kept the index".
      const cycle = new FilterCycle([ positionFor('alpha'), positionFor('beta'), positionFor('gamma') ]);
      cycle.next();
      cycle.next();

      // Act
      cycle.setPositions([ positionFor('alpha'), positionFor('gamma') ]);

      // Assert
      expect(cycle.activeKey())
        .toBe('gamma');
    });

    it('falls back to the front when the active tab did not survive', () =>
    {
      // Arrange
      const cycle = new FilterCycle([ positionFor('alpha'), positionFor('beta') ]);
      cycle.next();

      // Act
      cycle.setPositions([ positionFor('gamma'), positionFor('delta') ]);

      // Assert
      expect(cycle.activeKey())
        .toBe('gamma');
    });

    it('survives being emptied, answering ALL rather than reading past the end', () =>
    {
      // Arrange
      const cycle = new FilterCycle([ positionFor('alpha'), positionFor('beta') ]);
      cycle.next();

      // Act
      cycle.setPositions([]);

      // Assert
      expect(cycle.activeKey())
        .toBe(FilterCycle.ALL);
    });

    it('replaces the positions it walks', () =>
    {
      // Arrange
      const cycle = new FilterCycle([ positionFor('alpha') ]);

      // Act
      cycle.setPositions([ positionFor('beta'), positionFor('gamma') ]);

      // Assert
      expect(cycle.positions()
        .map(position => position.key))
        .toEqual([ 'beta', 'gamma' ]);
    });
  });
});

//endregion plugins/_base/core/models/filter-cycle.test.js
