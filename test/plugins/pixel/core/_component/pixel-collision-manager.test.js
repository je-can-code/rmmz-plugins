//region plugins/pixel/core/_component/pixel-collision-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDefaultPixelGameMap,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

function freshOpenCollision()
{
  globalThis.PIXEL_CollisionManager.initConfig();
  globalThis.PIXEL_CollisionManager.setupCollision();
}

describe('J-Pixelistics PIXEL_CollisionManager (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
  });

  beforeEach(() =>
  {
    globalThis.$gameMap = buildDefaultPixelGameMap();
    globalThis.J.PIXEL.Metadata.CollisionStepCount = 4;
  });

  it('initConfig runs without throwing', () =>
  {
    // Arrange & Act
    const act = () => globalThis.PIXEL_CollisionManager.initConfig();

    // Assert
    expect(act).not.toThrow();
  });

  it('setupCollision builds an open map and isPositionPassable returns true inside bounds', () =>
  {
    // Arrange
    freshOpenCollision();

    // Act
    const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.DOWN);

    // Assert
    expect(result).toBe(true);
  });

  it('marks every subcell solid when tile passability never allows entry', () =>
  {
    // Arrange
    globalThis.$gameMap.isPassable = function()
    {
      return false;
    };
    freshOpenCollision();

    // Act
    const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.RIGHT);

    // Assert
    expect(result).toBe(false);
  });

  it('returns false for a position left of the map', () =>
  {
    // Arrange
    freshOpenCollision();

    // Act
    const result = globalThis.PIXEL_CollisionManager.isPositionPassable(-1, 0.5, globalThis.J.PIXEL.Directions.RIGHT);

    // Assert
    expect(result).toBe(false);
  });

  it('returns false for a position right of the map', () =>
  {
    // Arrange
    freshOpenCollision();

    // Act
    const result = globalThis.PIXEL_CollisionManager.isPositionPassable(5, 0.5, globalThis.J.PIXEL.Directions.RIGHT);

    // Assert
    expect(result).toBe(false);
  });

  it('returns false for a position above the map', () =>
  {
    // Arrange: the two cases above leave the map on the x axis, so the y half of the bounds
    // check never decides anything there. The indexer wraps an out-of-range coordinate back
    // into the table instead of failing, so without its own bounds test a position off the top
    // edge reads whatever subcell it happens to wrap onto and answers passable.
    freshOpenCollision();

    // Act
    const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, -1, globalThis.J.PIXEL.Directions.DOWN);

    // Assert
    expect(result).toBe(false);
  });

  it('returns false for a position below the map', () =>
  {
    // Arrange
    freshOpenCollision();

    // Act
    const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 5, globalThis.J.PIXEL.Directions.DOWN);

    // Assert
    expect(result).toBe(false);
  });

  it('skips rebuilding when $gameMap is missing', () =>
  {
    // Arrange
    globalThis.$gameMap = null;

    // Act
    const act = () => globalThis.PIXEL_CollisionManager.setupCollision();

    // Assert
    expect(act).not.toThrow();
  });

  it('skips rebuilding when $dataMap is missing', () =>
  {
    // Arrange
    const prevDataMap = globalThis.$dataMap;
    globalThis.$dataMap = null;

    // Act
    const act = () => globalThis.PIXEL_CollisionManager.setupCollision();

    // Assert
    expect(act).not.toThrow();
    globalThis.$dataMap = prevDataMap;
  });

  describe('tiles no neighbor can enter', () =>
  {
    /**
     * Installs a passability oracle that answers asymmetrically: a tile is freely exitable in
     * every direction, while named approaches into it refuse. Vanilla's `isPassable` only ever
     * consults the tile being left, never the one being entered, so this is exactly the shape a
     * deny-region tile takes - and the shape the "always false" oracle used elsewhere in this
     * file cannot produce, because that one also seals the tile's own exits.
     * @param {Set<string>} sealedApproaches Departures that refuse, keyed `"x,y,direction"`.
     */
    function useApproachMap(sealedApproaches)
    {
      globalThis.$gameMap.isPassable = function(x, y, d)
      {
        // a tile off the edge of the map can never be departed from toward anything.
        if (x < 0 || y < 0 || x >= this.width() || y >= this.height()) return false;

        // every other departure is allowed unless it was explicitly sealed.
        return sealedApproaches.has(`${x},${y},${d}`) === false;
      };
    }

    it('marks a tile solid when nothing can reach it, even though it could be left', () =>
    {
      // Arrange: tile (1, 1) sits in the map's bottom-right corner, so two of its neighbors are
      // off-map; sealing the other two leaves it unreachable while its own four exits stay wide
      // open. Nothing about the tile itself says "wall", which is precisely why the reachability
      // question has to be asked separately - a character teleported onto it could walk off, but
      // no character can ever walk on, so AABB overlap has to treat it as solid.
      const { Directions } = globalThis.J.PIXEL;
      useApproachMap(new Set([ `1,0,${Directions.DOWN}`, `0,1,${Directions.RIGHT}` ]));
      freshOpenCollision();

      // Act
      const sealed = globalThis.PIXEL_CollisionManager
        .isPositionPassable(1.5, 1.5, globalThis.J.PIXEL.Directions.DOWN);

      // Assert: the reachable tile beside it is the near-miss sibling that must stay open.
      expect(sealed).toBe(false);
      expect(globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, Directions.DOWN)).toBe(true);
    });

    it('leaves a tile open when only a vertical neighbor can reach it', () =>
    {
      // Arrange: the same corner tile, with the approach from above left unsealed. One way in is
      // enough - reachability is a question about any direction, not about the horizontal pair,
      // and a doorway at the end of a walled corridor is entered on exactly one axis.
      const { Directions } = globalThis.J.PIXEL;
      useApproachMap(new Set([ `0,1,${Directions.RIGHT}` ]));
      freshOpenCollision();

      // Act
      const result = globalThis.PIXEL_CollisionManager
        .isPositionPassable(1.5, 1.5, globalThis.J.PIXEL.Directions.DOWN);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('subcell table sizing by collisionStepCount', () =>
  {
    it('sizes a 1-step table to 4 entries on a 2x2 map', () =>
    {
      // Arrange
      globalThis.J.PIXEL.Metadata.CollisionStepCount = 1;

      // Act
      freshOpenCollision();

      // Assert
      expect(globalThis.PIXEL_CollisionManager._table.length).toBe(4);
    });

    it('sizes a 2-step table to 16 entries on a 2x2 map', () =>
    {
      // Arrange
      globalThis.J.PIXEL.Metadata.CollisionStepCount = 2;

      // Act
      freshOpenCollision();

      // Assert
      expect(globalThis.PIXEL_CollisionManager._table.length).toBe(16);
    });

    it('sizes a 4-step table to 64 entries on a 2x2 map', () =>
    {
      // Arrange
      globalThis.J.PIXEL.Metadata.CollisionStepCount = 4;

      // Act
      freshOpenCollision();

      // Assert
      expect(globalThis.PIXEL_CollisionManager._table.length).toBe(64);
    });
  });

  it('derives collisionSize from collisionStepCount', () =>
  {
    // Arrange
    globalThis.J.PIXEL.Metadata.CollisionStepCount = 2;

    // Act
    globalThis.PIXEL_CollisionManager.initConfig();

    // Assert
    expect(globalThis.PIXEL_CollisionManager.collisionStepCount).toBe(2);
    expect(globalThis.PIXEL_CollisionManager.collisionSize).toBe(0.5);
  });

  describe('table codes', () =>
  {
    it('VerticalLine blocks vertical entry', () =>
    {
      // Arrange
      const { Codes } = globalThis.PIXEL_CollisionManager;
      freshOpenCollision();
      globalThis.PIXEL_CollisionManager._set(0.5, 0.5, Codes.VerticalLine);

      // Act
      const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(result).toBe(false);
    });

    it('VerticalLine does not block horizontal entry', () =>
    {
      // Arrange
      const { Codes } = globalThis.PIXEL_CollisionManager;
      freshOpenCollision();
      globalThis.PIXEL_CollisionManager._set(0.5, 0.5, Codes.VerticalLine);

      // Act
      const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.RIGHT);

      // Assert
      expect(result).toBe(true);
    });

    it('HorizontalLine blocks horizontal entry', () =>
    {
      // Arrange
      const { Codes } = globalThis.PIXEL_CollisionManager;
      freshOpenCollision();
      globalThis.PIXEL_CollisionManager._set(0.5, 0.5, Codes.HorizontalLine);

      // Act
      const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.LEFT);

      // Assert
      expect(result).toBe(false);
    });

    it('HorizontalLine does not block vertical entry', () =>
    {
      // Arrange
      const { Codes } = globalThis.PIXEL_CollisionManager;
      freshOpenCollision();
      globalThis.PIXEL_CollisionManager._set(0.5, 0.5, Codes.HorizontalLine);

      // Act
      const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.DOWN);

      // Assert
      expect(result).toBe(true);
    });

    it('CornerTopLeft blocks movement into it from every direction', () =>
    {
      // Arrange
      const { Codes } = globalThis.PIXEL_CollisionManager;
      freshOpenCollision();
      globalThis.PIXEL_CollisionManager._set(0.25, 0.25, Codes.CornerTopLeft);

      // Act
      const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.25, 0.25, globalThis.J.PIXEL.Directions.RIGHT);

      // Assert
      expect(result).toBe(false);
    });

    it('EdgeLeft blocks the directionally-matching approach', () =>
    {
      // Arrange
      const { Codes } = globalThis.PIXEL_CollisionManager;
      freshOpenCollision();
      globalThis.PIXEL_CollisionManager._set(0.5, 0.5, Codes.EdgeLeft);

      // Act
      const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.LEFT);

      // Assert
      expect(result).toBe(false);
    });

    it('EdgeLeft does not block the opposite approach', () =>
    {
      // Arrange
      const { Codes } = globalThis.PIXEL_CollisionManager;
      freshOpenCollision();
      globalThis.PIXEL_CollisionManager._set(0.5, 0.5, Codes.EdgeLeft);

      // Act
      const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.RIGHT);

      // Assert
      expect(result).toBe(true);
    });

    it('defaults unknown table codes to passable', () =>
    {
      // Arrange
      freshOpenCollision();
      globalThis.PIXEL_CollisionManager._set(0.5, 0.5, 99999);

      // Act
      const result = globalThis.PIXEL_CollisionManager.isPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.DOWN);

      // Assert
      expect(result).toBe(true);
    });
  });
});
//endregion plugins/pixel/core/_component/pixel-collision-manager.test.js
