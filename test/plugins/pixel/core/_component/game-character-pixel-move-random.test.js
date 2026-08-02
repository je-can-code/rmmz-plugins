//region plugins/pixel/core/_component/game-character-pixel-move-random.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

const noop = function()
{
};

/**
 * Same wall-aware `$gameMap` stand-in used by the movement-resolver suite; duplicated locally
 * so this file can evolve its own wall layouts independently.
 * @param {number} width
 * @param {number} height
 * @param {Set<string>} wallTiles
 */
function buildWalledPixelGameMap(width, height, wallTiles = new Set())
{
  const isWall = (x, y) => wallTiles.has(`${x},${y}`);

  return {
    width()
    {
      return width;
    },
    height()
    {
      return height;
    },
    tileWidth()
    {
      return 48;
    },
    tileHeight()
    {
      return 48;
    },
    isValid(tx, ty)
    {
      return tx >= 0 && ty >= 0 && tx < width && ty < height;
    },
    isPassable(x, y, d)
    {
      if (isWall(x, y)) return false;

      let nx = x;
      let ny = y;
      if (d === globalThis.J.PIXEL.Directions.DOWN) ny += 1;
      else if (d === globalThis.J.PIXEL.Directions.UP) ny -= 1;
      else if (d === globalThis.J.PIXEL.Directions.LEFT) nx -= 1;
      else if (d === globalThis.J.PIXEL.Directions.RIGHT) nx += 1;

      if (nx < 0 || ny < 0 || nx >= width || ny >= height) return false;
      if (isWall(nx, ny)) return false;

      return true;
    },
    distance(x0, y0, x1, y1)
    {
      const dx = x0 - x1;
      const dy = y0 - y1;

      return Math.sqrt(dx * dx + dy * dy);
    },
    isDashDisabled()
    {
      return false;
    },
    roundXWithDirection(x, _d)
    {
      return x;
    },
    roundYWithDirection(y, _d)
    {
      return y;
    },
    isCounter()
    {
      return false;
    },
    events()
    {
      return [];
    },
    eventsXyNt()
    {
      return [];
    },
    requestRefresh: noop,
  };
}

describe('J-Pixelistics Game_Character.moveRandom override (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_CharacterBase.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_Character.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
  });

  /**
   * Rebuilds the subcell collision table for a fresh `$gameMap` and returns a Game_Character
   * positioned on it. `moveSpeed` defaults to 8 (a full tile of `distancePerFrame`) so
   * the repeat-count math produces a small, easy-to-reason-about frame count.
   * @param {object} gameMap
   * @param {number} x
   * @param {number} y
   * @param {number} moveSpeed
   */
  function makeCharacterOn(gameMap, x, y, moveSpeed = 8)
  {
    globalThis.$gameMap = gameMap;
    globalThis.$dataMap = { width: gameMap.width(), height: gameMap.height() };
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();

    const ch = new globalThis.Game_Character();
    ch.initMembers();
    ch.setMoveSpeed(moveSpeed);
    ch.relocate(x, y);
    return ch;
  }

  beforeEach(() =>
  {
    globalThis.$gamePlayer = new globalThis.Game_Player();
    globalThis.$gamePlayer.initMembers();
    globalThis.$gamePlayer._followers = { _data: [] };
  });

  describe('moveRandom overwrite', () =>
  {
    it('caches the rolled direction as an active micro-route', () =>
    {
      // Arrange: pin the roll so the test is deterministic.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      vi.spyOn(Math, 'random').mockReturnValue(0);

      // Act
      ch.moveRandom();

      // Assert
      expect(ch.isMicroRouting()).toBe(true);
      Math.random.mockRestore();
    });

    it('reuses the cached direction on the next call instead of rerolling', () =>
    {
      // Arrange: first roll picks DOWN (random() === 0 -> d === 2); a second roll
      // would need random() to move on to pick a different direction.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      vi.spyOn(Math, 'random').mockReturnValue(0);
      ch.moveRandom();
      const cachedDirection = ch.getMicroRouteDirection();
      Math.random.mockRestore();

      // Act: call again while the cache is still active; a fresh roll must not occur.
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      ch.moveRandom();

      // Assert
      expect(ch.getMicroRouteDirection()).toBe(cachedDirection);
      Math.random.mockRestore();
    });

    it('moves one distancePerFrame step in the rolled direction when passable', () =>
    {
      // Arrange: force the roll to DOWN.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      vi.spyOn(Math, 'random').mockReturnValue(0);

      // Act
      ch.moveRandom();

      // Assert
      expect(ch.isMovementSucceeded()).toBe(true);
      expect(ch._y).toBeGreaterThan(2);
      Math.random.mockRestore();
    });

    it('does not move when the rolled direction is blocked', () =>
    {
      // Arrange: force the roll to DOWN, with a wall directly below.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,3' ]));
      const ch = makeCharacterOn(map, 2, 2);
      vi.spyOn(Math, 'random').mockReturnValue(0);

      // Act
      ch.moveRandom();

      // Assert
      expect(ch.isMovementSucceeded()).toBe(false);
      expect(ch._y).toBe(2);
      Math.random.mockRestore();
    });

    it('rolls a fresh direction once the micro-route cache has been exhausted', () =>
    {
      // Arrange: pin the first roll to DOWN, exhaust the cache, then repin to UP.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      vi.spyOn(Math, 'random').mockReturnValue(0);
      ch.moveRandom();
      ch.setMicroRouteFrames(0);
      Math.random.mockRestore();

      // Act: 0.9 maps to d = 2 + floor(0.9*4)*2 = 2 + 6 = 8 (UP).
      vi.spyOn(Math, 'random').mockReturnValue(0.9);
      ch.moveRandom();

      // Assert
      expect(ch.getMicroRouteDirection()).toBe(globalThis.J.PIXEL.Directions.UP);
      Math.random.mockRestore();
    });
  });
});
//endregion plugins/pixel/core/_component/game-character-pixel-move-random.test.js
