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
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

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
      const Codes = globalThis.PIXEL_CollisionManager.Codes;
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
      const Codes = globalThis.PIXEL_CollisionManager.Codes;
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
      const Codes = globalThis.PIXEL_CollisionManager.Codes;
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
      const Codes = globalThis.PIXEL_CollisionManager.Codes;
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
      const Codes = globalThis.PIXEL_CollisionManager.Codes;
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
      const Codes = globalThis.PIXEL_CollisionManager.Codes;
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
      const Codes = globalThis.PIXEL_CollisionManager.Codes;
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
