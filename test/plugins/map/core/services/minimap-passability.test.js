//region plugins/map/core/services/minimap-passability.test.js
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

describe('MinimapPassability (direct src import)', () =>
{
  let MinimapPassability;

  beforeAll(async () =>
  {
    ({ default: MinimapPassability } = await import('../../../../../src/plugins/map/core/services/MinimapPassability.js'));
  });

  // direction bits in the engine's tileset layout, spelled out rather than derived, so the fixture
  // cannot share a mistake with the code under test.
  const BIT = {
    2: 0x01,
    4: 0x02,
    6: 0x04,
    8: 0x08,
  };

  // a 3x2 room of open floor with one sealed tile in the top middle.
  const ROOM_WITH_SEALED_TILE = [
    [ 0x0f, 0x00, 0x0f ],
    [ 0x0f, 0x0f, 0x0f ],
  ];

  /**
   * Stands up a map whose engine answers come from a grid of allowed exits.
   *
   * Its tileset flags call every tile walkable, the way a ceiling autotile's do, so nothing but the
   * engine's own answer can tell a sealed tile from floor.
   * @param {number[][]} exitRows Each tile's allowed exits, row by row, as direction bits.
   * @param {boolean} loops Whether the map wraps around horizontally.
   */
  const installMap = (exitRows, loops = false) =>
  {
    const width = exitRows[0].length;
    const height = exitRows.length;
    const stepX = {
      4: -1,
      6: 1,
    };
    const stepY = {
      2: 1,
      8: -1,
    };

    globalThis.$gameMap = {
      width: () => width,
      height: () => height,
      tilesetFlags: () => [ 0x0000 ],
      allTiles: () => [ 0, 0, 0, 0 ],
      isValid: (x, y) => x >= 0 && x < width && y >= 0 && y < height,
      isPassable: vi.fn((x, y, direction) => (exitRows[y][x] & BIT[direction]) !== 0),
      roundXWithDirection: (x, direction) =>
      {
        const nextX = x + (stepX[direction] ?? 0);
        if (loops === false) return nextX;
        return ((nextX % width) + width) % width;
      },
      roundYWithDirection: (y, direction) => y + (stepY[direction] ?? 0),
    };
  };

  afterEach(() =>
  {
    delete globalThis.$gameMap;
  });

  describe('constructor', () =>
  {
    it('asks the engine once per tile and direction, however many questions follow', () =>
    {
      // Arrange
      installMap(ROOM_WITH_SEALED_TILE);
      const everyTile = [ [ 0, 0 ], [ 1, 0 ], [ 2, 0 ], [ 0, 1 ], [ 1, 1 ], [ 2, 1 ] ];

      // Act
      const passability = new MinimapPassability();
      everyTile.forEach(([ x, y ]) => passability.blockedMask(x, y));
      everyTile.forEach(([ x, y ]) => passability.blockedMask(x, y));

      // Assert
      expect($gameMap.isPassable).toHaveBeenCalledTimes(24);
    });
  });

  describe('canCross', () =>
  {
    it('refuses a step off the edge of a map that does not loop', () =>
    {
      // Arrange- every tile allows every exit, so only the edge of the map can refuse. The step leaves
      // from the second row, where a row-major read past the edge would land on a real tile.
      installMap([
        [ 0x0f, 0x0f ],
        [ 0x0f, 0x0f ],
      ]);
      const passability = new MinimapPassability();

      // Act
      const result = passability.canCross(0, 1, 4);

      // Assert
      expect(result).toBe(false);
    });

    it('wraps across the seam of a looping map', () =>
    {
      // Arrange- each tile opens only toward the other, across the seam.
      installMap([ [ 0x02, 0x04 ] ], true);
      const passability = new MinimapPassability();

      // Act
      const result = passability.canCross(0, 0, 4);

      // Assert
      expect(result).toBe(true);
    });

    it('refuses a step the tile being left will not allow', () =>
    {
      // Arrange- the left tile allows every exit but right; the right tile would take the step.
      installMap([ [ 0x0b, 0x0f ] ]);
      const passability = new MinimapPassability();

      // Act
      const result = passability.canCross(0, 0, 6);

      // Assert
      expect(result).toBe(false);
    });

    it('refuses a step the tile being entered will not take back', () =>
    {
      // Arrange- the left tile allows every exit; the right tile allows every exit but left.
      installMap([ [ 0x0f, 0x0d ] ]);
      const passability = new MinimapPassability();

      // Act
      const result = passability.canCross(0, 0, 6);

      // Assert
      expect(result).toBe(false);
    });

    it('allows a horizontal step both tiles agree to', () =>
    {
      // Arrange- each tile opens only toward the other.
      installMap([ [ 0x04, 0x02 ] ]);
      const passability = new MinimapPassability();

      // Act
      const result = passability.canCross(0, 0, 6);

      // Assert
      expect(result).toBe(true);
    });

    it('allows a vertical step both tiles agree to', () =>
    {
      // Arrange- the top tile opens only downward, the bottom tile only upward.
      installMap([
        [ 0x01 ],
        [ 0x08 ],
      ]);
      const passability = new MinimapPassability();

      // Act
      const result = passability.canCross(0, 0, 2);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('blockedMask', () =>
  {
    it('sets the bit of every edge a step cannot cross', () =>
    {
      // Arrange- the bottom-middle tile sits under the sealed tile and against the bottom of the map.
      installMap(ROOM_WITH_SEALED_TILE);
      const passability = new MinimapPassability();

      // Act
      const result = passability.blockedMask(1, 1);

      // Assert- down (off the map) and up (the sealed tile); left and right are open floor.
      expect(result).toBe(0x09);
    });

    it('leaves clear the bit of an edge a step can cross', () =>
    {
      // Arrange- the top-left corner is walled by two map edges and the sealed tile, open only below.
      installMap(ROOM_WITH_SEALED_TILE);
      const passability = new MinimapPassability();

      // Act
      const result = passability.blockedMask(0, 0);

      // Assert- left, right and up are walls; down is the one bit left clear.
      expect(result).toBe(0x0e);
    });
  });

  describe('isImpassable', () =>
  {
    it('is true for a tile the engine seals on every side, though its tileset flags call it walkable', () =>
    {
      // Arrange
      installMap(ROOM_WITH_SEALED_TILE);
      const passability = new MinimapPassability();

      // Act
      const result = passability.isImpassable(1, 0);

      // Assert
      expect(result).toBe(true);
    });

    it('is false for a tile with a single edge a step can cross', () =>
    {
      // Arrange- the top-left corner is open only below, as near to sealed as a tile gets.
      installMap(ROOM_WITH_SEALED_TILE);
      const passability = new MinimapPassability();

      // Act
      const result = passability.isImpassable(0, 0);

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/map/core/services/minimap-passability.test.js