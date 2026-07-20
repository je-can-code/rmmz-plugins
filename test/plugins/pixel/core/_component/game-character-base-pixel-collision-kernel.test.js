//region plugins/pixel/core/_component/game-character-base-pixel-collision-kernel.test.js
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
 * Builds a real, wall-aware `$gameMap` stand-in so the collision kernel is exercised against
 * genuine tile geometry rather than mocked booleans. `wallTiles` is a Set of `"x,y"` keys; a
 * wall tile blocks exit in every direction, and any tile bordering a wall is blocked from
 * entering that wall (mirroring vanilla `isPassable`'s per-edge semantics).
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
      // a wall tile cannot be exited in any direction.
      if (isWall(x, y)) return false;

      let nx = x;
      let ny = y;
      if (d === globalThis.J.PIXEL.Directions.DOWN) ny += 1;
      else if (d === globalThis.J.PIXEL.Directions.UP) ny -= 1;
      else if (d === globalThis.J.PIXEL.Directions.LEFT) nx -= 1;
      else if (d === globalThis.J.PIXEL.Directions.RIGHT) nx += 1;

      // off-map or entering a wall tile is blocked.
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

describe('J-Pixelistics Game_CharacterBase collision kernel (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/objects/Game_CharacterBase.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
  });

  /**
   * Rebuilds the subcell collision table for a fresh `$gameMap` and returns a positioned
   * character ready for kernel-level probing.
   * @param {object} gameMap
   * @param {number} x
   * @param {number} y
   */
  function makeCharacterOn(gameMap, x, y)
  {
    globalThis.$gameMap = gameMap;
    globalThis.$dataMap = { width: gameMap.width(), height: gameMap.height() };
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();

    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.setMoveSpeed(4);
    ch.relocate(x, y);
    return ch;
  }

  beforeEach(() =>
  {
    // isolate $gamePlayer/followers state between tests that touch character-vs-character collision.
    globalThis.$gamePlayer = new globalThis.Game_Player();
    globalThis.$gamePlayer.initMembers();
    globalThis.$gamePlayer._followers = { _data: [] };
  });

  describe('canPassStraight', () =>
  {
    it('always approves movement while through', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2' ]));
      const ch = makeCharacterOn(map, 1, 2);
      ch.setThrough(true);

      // Act & Assert
      expect(ch.canPassStraight(globalThis.J.PIXEL.Directions.RIGHT, 0.9)).toBe(true);
    });

    it('always approves movement while debug-through', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2' ]));
      const ch = makeCharacterOn(map, 1, 2);
      ch.isDebugThrough = () => true;

      // Act & Assert
      expect(ch.canPassStraight(globalThis.J.PIXEL.Directions.RIGHT, 0.9)).toBe(true);
    });

    it('rejects an unsupported direction outright', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 1, 2);

      // Act & Assert
      expect(ch.canPassStraight(999, 0.1)).toBe(false);
    });

    it('approves a small in-place probe that crosses no subcell seam', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 1, 2);

      // Act & Assert
      expect(ch.canPassStraight(globalThis.J.PIXEL.Directions.RIGHT, 0.01)).toBe(true);
    });

    it.each([
      [ 'DOWN', 'DOWN', 2, 1, 2, 3 ],
      [ 'UP', 'UP', 2, 3, 2, 1 ],
      [ 'LEFT', 'LEFT', 3, 2, 1, 2 ],
      [ 'RIGHT', 'RIGHT', 1, 2, 3, 2 ],
    ])('is blocked approaching a solid wall tile moving %s', (_label, dirKey, startX, startY) =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2' ]));
      const ch = makeCharacterOn(map, startX, startY);

      // Act
      const result = ch.canPassStraight(globalThis.J.PIXEL.Directions[dirKey], 0.9);

      // Assert
      expect(result).toBe(false);
    });

    it.each([
      [ 'DOWN' ],
      [ 'UP' ],
      [ 'LEFT' ],
      [ 'RIGHT' ],
    ])('is open moving %s across an entirely open map', (dirKey) =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const result = ch.canPassStraight(globalThis.J.PIXEL.Directions[dirKey], 0.5);

      // Assert
      expect(result).toBe(true);
    });

    it('rejects when the final landing AABB overlaps a solid tile even with no seam crossed', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch.isOverlappingSolidTiles = () => true;

      // Act & Assert
      expect(ch.canPassStraight(globalThis.J.PIXEL.Directions.RIGHT, 0.01)).toBe(false);
    });

    it('rejects when a character occupies the landing point', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch.isCharacterCollisionAt = () => true;

      // Act & Assert
      expect(ch.canPassStraight(globalThis.J.PIXEL.Directions.RIGHT, 0.5)).toBe(false);
    });
  });

  describe('isOverlappingSolidTiles', () =>
  {
    it('is true when the probed AABB overlaps a solid tile', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2' ]));
      makeCharacterOn(map, 0, 0);

      // Act & Assert
      const ch = new globalThis.Game_CharacterBase();
      expect(ch.isOverlappingSolidTiles(2.5, 2.5, 0.3)).toBe(true);
    });

    it('is false when the probed AABB sits entirely over open tiles', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2' ]));
      makeCharacterOn(map, 0, 0);

      // Act & Assert
      const ch = new globalThis.Game_CharacterBase();
      expect(ch.isOverlappingSolidTiles(0.5, 0.5, 0.3)).toBe(false);
    });

    it('treats out-of-bounds coordinates as solid', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      makeCharacterOn(map, 0, 0);

      // Act & Assert
      const ch = new globalThis.Game_CharacterBase();
      expect(ch.isOverlappingSolidTiles(-1, -1, 0.3)).toBe(true);
    });
  });

  describe('canPassDiagonally (Cyclone-like override)', () =>
  {
    it('always approves while through, restoring the original coordinates', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2' ]));
      const ch = makeCharacterOn(map, 1, 1);
      ch.setThrough(true);

      // Act
      const result = ch.canPassDiagonally(1, 1, globalThis.J.PIXEL.Directions.RIGHT, globalThis.J.PIXEL.Directions.DOWN);

      // Assert
      expect(result).toBe(true);
      expect(ch._x).toBe(1);
      expect(ch._y).toBe(1);
    });

    it('rejects a destination outside the map bounds', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);

      // Act
      const result = ch.canPassDiagonally(0, 0, globalThis.J.PIXEL.Directions.LEFT, globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(result).toBe(false);
      expect(ch._x).toBe(0);
      expect(ch._y).toBe(0);
    });

    it('rejects when a leg is blocked by an adjacent wall', () =>
    {
      // Arrange: wall at tile (2,1); probe from just shy of that boundary so a single
      // frame's straightStep (~0.0625 tiles at moveSpeed 4) actually crosses the seam.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,1' ]));
      const ch = makeCharacterOn(map, 0, 0);
      ch._x = 1.17;
      ch._y = 1;

      // Act
      const result = ch.canPassDiagonally(1.17, 1, globalThis.J.PIXEL.Directions.RIGHT, globalThis.J.PIXEL.Directions.DOWN);

      // Assert: restores the pre-call coordinates regardless of the outcome.
      expect(result).toBe(false);
      expect(ch._x).toBe(1.17);
      expect(ch._y).toBe(1);
    });

    it('approves an entirely open diagonal (RIGHT/DOWN legs)', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act & Assert
      expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.RIGHT, globalThis.J.PIXEL.Directions.DOWN)).toBe(true);
    });

    it('approves an entirely open diagonal (LEFT/UP legs)', () =>
    {
      // Arrange: exercises the mirrored `horz === LEFT` / `vert === UP` true-branches that
      // the RIGHT/DOWN case above never touches.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act & Assert
      expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.LEFT, globalThis.J.PIXEL.Directions.UP)).toBe(true);
    });

    it('rejects when a character occupies the diagonal landing point', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch.isCharacterCollisionAt = () => true;

      // Act & Assert
      expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.RIGHT, globalThis.J.PIXEL.Directions.DOWN)).toBe(false);
    });

    describe('rejects at each individual leg-validation stage (RIGHT/DOWN legs, isolated via sequenced stubs)', () =>
    {
      // canPassDiagonally calls the four `_pixelCheck*Passage` helpers in a fixed sequence for
      // horz=RIGHT, vert=DOWN: Right(leg1), Down(leg2), Right(revalidate-at-newY),
      // Down(revalidate-at-newX), Left(reverse-horizontal), Up(reverse-vertical). Stubbing one
      // helper to fail on a specific call isolates each reject branch deterministically, without
      // hand-deriving L-shaped wall geometry for six near-duplicate validation stages.
      it('leg1 (current-position horizontal) reject', () =>
      {
        // Arrange
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        ch._pixelCheckRightPassage = () => false;

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.RIGHT, globalThis.J.PIXEL.Directions.DOWN)).toBe(false);
        expect(ch._x).toBe(2);
        expect(ch._y).toBe(2);
      });

      it('leg2 (current-position vertical) reject', () =>
      {
        // Arrange
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        ch._pixelCheckDownPassage = () => false;

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.RIGHT, globalThis.J.PIXEL.Directions.DOWN)).toBe(false);
      });

      it('revalidate-at-new-Y (horizontal) reject', () =>
      {
        // Arrange: first Right call (leg1) passes, second (revalidate) fails.
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        let call = 0;
        ch._pixelCheckRightPassage = () =>
        {
          call += 1;
          return call === 1;
        };

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.RIGHT, globalThis.J.PIXEL.Directions.DOWN)).toBe(false);
      });

      it('revalidate-at-new-X (vertical) reject', () =>
      {
        // Arrange: first Down call (leg2) passes, second (revalidate) fails.
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        let call = 0;
        ch._pixelCheckDownPassage = () =>
        {
          call += 1;
          return call === 1;
        };

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.RIGHT, globalThis.J.PIXEL.Directions.DOWN)).toBe(false);
      });

      it('reverse-horizontal (at destination) reject', () =>
      {
        // Arrange
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        ch._pixelCheckLeftPassage = () => false;

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.RIGHT, globalThis.J.PIXEL.Directions.DOWN)).toBe(false);
      });

      it('reverse-vertical (at destination) reject', () =>
      {
        // Arrange
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        ch._pixelCheckUpPassage = () => false;

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.RIGHT, globalThis.J.PIXEL.Directions.DOWN)).toBe(false);
      });
    });

    describe('rejects at each individual leg-validation stage (LEFT/UP legs, isolated via sequenced stubs)', () =>
    {
      // Mirrors the RIGHT/DOWN suite above, exercising the `horz === LEFT` / `vert === UP`
      // true-branches that suite never touches. Call sequence for horz=LEFT, vert=UP:
      // Left(leg1), Up(leg2), Left(revalidate-Y), Up(revalidate-X), Right(reverse-H), Down(reverse-V).
      it('leg1 (current-position horizontal) reject', () =>
      {
        // Arrange
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        ch._pixelCheckLeftPassage = () => false;

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.LEFT, globalThis.J.PIXEL.Directions.UP)).toBe(false);
        expect(ch._x).toBe(2);
        expect(ch._y).toBe(2);
      });

      it('leg2 (current-position vertical) reject', () =>
      {
        // Arrange
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        ch._pixelCheckUpPassage = () => false;

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.LEFT, globalThis.J.PIXEL.Directions.UP)).toBe(false);
      });

      it('revalidate-at-new-Y (horizontal) reject', () =>
      {
        // Arrange: first Left call (leg1) passes, second (revalidate) fails.
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        let call = 0;
        ch._pixelCheckLeftPassage = () =>
        {
          call += 1;
          return call === 1;
        };

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.LEFT, globalThis.J.PIXEL.Directions.UP)).toBe(false);
      });

      it('revalidate-at-new-X (vertical) reject', () =>
      {
        // Arrange: first Up call (leg2) passes, second (revalidate) fails.
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        let call = 0;
        ch._pixelCheckUpPassage = () =>
        {
          call += 1;
          return call === 1;
        };

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.LEFT, globalThis.J.PIXEL.Directions.UP)).toBe(false);
      });

      it('reverse-horizontal (at destination) reject', () =>
      {
        // Arrange
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        ch._pixelCheckRightPassage = () => false;

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.LEFT, globalThis.J.PIXEL.Directions.UP)).toBe(false);
      });

      it('reverse-vertical (at destination) reject', () =>
      {
        // Arrange
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        ch._pixelCheckDownPassage = () => false;

        // Act & Assert
        expect(ch.canPassDiagonally(2, 2, globalThis.J.PIXEL.Directions.LEFT, globalThis.J.PIXEL.Directions.UP)).toBe(false);
      });
    });
  });

  describe('canPassDiagonalByDirection', () =>
  {
    it.each([
      [ 'LOWERLEFT' ],
      [ 'LOWERRIGHT' ],
      [ 'UPPERLEFT' ],
      [ 'UPPERRIGHT' ],
    ])('rejects %s when either component leg is blocked', (dirKey) =>
    {
      // Arrange: fully walled-in single tile so every leg is blocked.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2', '1,2', '3,2', '2,1', '2,3' ]));
      const ch = makeCharacterOn(map, 2, 2);

      // Act & Assert
      expect(ch.canPassDiagonalByDirection(globalThis.J.PIXEL.Directions[dirKey])).toBe(false);
    });

    it.each([
      [ 'LOWERLEFT' ],
      [ 'LOWERRIGHT' ],
      [ 'UPPERLEFT' ],
      [ 'UPPERRIGHT' ],
    ])('approves %s when both legs are clear and no character occupies the landing point', (dirKey) =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act & Assert
      expect(ch.canPassDiagonalByDirection(globalThis.J.PIXEL.Directions[dirKey])).toBe(true);
    });

    it('rejects when both legs are clear but a character occupies the landing point', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch.isCharacterCollisionAt = () => true;

      // Act & Assert
      expect(ch.canPassDiagonalByDirection(globalThis.J.PIXEL.Directions.LOWERRIGHT)).toBe(false);
    });
  });

  describe('isCharacterCollisionAt', () =>
  {
    it('is false on an empty map with no candidates', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(false);
    });

    it('detects an AABB overlap against a colliding map event', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      const blocker = new globalThis.Game_Event();
      blocker.initMembers();
      blocker.relocate(2.5, 2.5);
      map.events = () => [ blocker ];

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(true);
    });

    it('is false when a candidate exists but its AABB does not overlap the probe', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      const farAway = new globalThis.Game_Event();
      farAway.initMembers();
      farAway.relocate(4.5, 4.5);
      map.events = () => [ farAway ];

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(false);
    });

    it('excludes erased events from collision candidates', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      const blocker = new globalThis.Game_Event();
      blocker.initMembers();
      blocker.relocate(2.5, 2.5);
      blocker._erased = true;
      map.events = () => [ blocker ];

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(false);
    });

    it('excludes through events from collision candidates', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      const blocker = new globalThis.Game_Event();
      blocker.initMembers();
      blocker.relocate(2.5, 2.5);
      blocker.setThrough(true);
      map.events = () => [ blocker ];

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(false);
    });

    it('excludes non-normal-priority events from collision candidates', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      const blocker = new globalThis.Game_Event();
      blocker.initMembers();
      blocker.relocate(2.5, 2.5);
      blocker._normalPriority = false;
      map.events = () => [ blocker ];

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(false);
    });

    it('excludes JABS action sprites when J-ABS is installed', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      const blocker = new globalThis.Game_Event();
      blocker.initMembers();
      blocker.relocate(2.5, 2.5);
      blocker._jabsAction = true;
      map.events = () => [ blocker ];
      globalThis.J.ABS = {};

      // Act
      const result = ch.isCharacterCollisionAt(2.5, 2.5);

      // Assert
      expect(result).toBe(false);
      delete globalThis.J.ABS;
    });

    it('excludes a JABS action sprite that reached the candidate list via the player/follower path', () =>
    {
      // Arrange: the event-collection loop already filters JABS actions, but player/followers
      // aren't filtered there — this covers that separate "extra defense" pass at the very end.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      const follower = new globalThis.Game_Character();
      follower.initMembers();
      follower.relocate(2.5, 2.5);
      follower.isJabsAction = () => true;
      globalThis.$gamePlayer._followers._data = [ follower ];
      globalThis.J.ABS = {};

      // Act
      const result = ch.isCharacterCollisionAt(2.5, 2.5);

      // Assert
      expect(result).toBe(false);
      delete globalThis.J.ABS;
    });

    it('excludes self from collision candidates', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      map.events = () => [ ch ];

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(false);
    });

    it('excludes the player and followers from candidates when self is a party member', () =>
    {
      // Arrange: self (ch) stands in as the player itself.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._followers = { _data: [] };
      globalThis.$gamePlayer = ch;

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(false);
    });

    it('includes the player as a candidate when self is not a party member', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      globalThis.$gamePlayer.relocate(2.5, 2.5);

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(true);
    });

    it('includes non-through followers as candidates when self is not a party member', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      const follower = new globalThis.Game_Character();
      follower.initMembers();
      follower.relocate(2.5, 2.5);
      globalThis.$gamePlayer._followers._data = [ follower ];

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(true);
    });

    it('excludes through followers as candidates', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      const follower = new globalThis.Game_Character();
      follower.initMembers();
      follower.relocate(2.5, 2.5);
      follower.setThrough(true);
      globalThis.$gamePlayer._followers._data = [ follower ];

      // Act & Assert
      expect(ch.isCharacterCollisionAt(2.5, 2.5)).toBe(false);
    });
  });

  describe('collision radius, pivot, and hitbox helpers', () =>
  {
    it('getCollisionRadius defaults to 0.3 tiles', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);

      // Act & Assert
      expect(ch.getCollisionRadius()).toBe(0.3);
    });

    it('getEffectiveRadius returns the configured radius when it fits under the pivot', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);

      // Act & Assert
      expect(ch.getEffectiveRadius()).toBeCloseTo(0.3);
    });

    it('getEffectiveRadius clamps the radius so the hitbox never bleeds past the tile below', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);
      ch.getCollisionPivotY = () => 0.9;

      // Act & Assert: maxRadius = 1.0 - 0.9 - 1e-6, which is well under the default 0.3.
      expect(ch.getEffectiveRadius()).toBeLessThan(0.1);
    });

    it('getCollisionPivotX/Y center the hitbox on the tile', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);

      // Act & Assert
      expect(ch.getCollisionPivotX()).toBe(0.5);
      expect(ch.getCollisionPivotY()).toBe(0.5);
    });

    it('_pixelHitbox derives a symmetric box centered on the pivot', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);

      // Act
      const hb = ch._pixelHitbox(0.3);

      // Assert
      expect(hb).toEqual({ w: 0.6, h: 0.6, hx: -0.3, hy: -0.3 });
    });

    it('_pixelCollisionSubCount initializes the manager lazily if not yet configured', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);
      globalThis.PIXEL_CollisionManager.collisionStepCount = undefined;

      // Act
      const subCount = ch._pixelCollisionSubCount();

      // Assert
      expect(subCount).toBe(4);
    });

    it('_pixelIsPositionPassable delegates directly to the collision manager', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2' ]));
      const ch = makeCharacterOn(map, 0, 0);

      // Act & Assert
      expect(ch._pixelIsPositionPassable(2.5, 2.5, globalThis.J.PIXEL.Directions.DOWN)).toBe(false);
      expect(ch._pixelIsPositionPassable(0.5, 0.5, globalThis.J.PIXEL.Directions.DOWN)).toBe(true);
    });

    it.each([
      [ 2, 8 ],
      [ 8, 2 ],
      [ 4, 6 ],
      [ 6, 4 ],
    ])('_pixelReverseDir maps %i to %i', (input, expected) =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);

      // Act & Assert
      expect(ch._pixelReverseDir(input)).toBe(expected);
    });

    it('_pixelReverseDir passes through an unrecognized direction unchanged', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);

      // Act & Assert
      expect(ch._pixelReverseDir(1)).toBe(1);
    });
  });

  describe('subcell edge-index math', () =>
  {
    it('_pixelFirstCollisionXAt/_pixelLastCollisionXAt bracket the hitbox width in subcell units', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);
      const hb = ch._pixelHitbox(0.3);

      // Act
      const first = ch._pixelFirstCollisionXAt(2, hb, 4);
      const last = ch._pixelLastCollisionXAt(2, hb, 4);

      // Assert: pivot puts the center at x=2.5; radius 0.3 spans [2.2, 2.8].
      expect(first).toBeCloseTo(2.0);
      expect(last).toBeCloseTo(2.75);
    });

    it('_pixelFirstCollisionYAt/_pixelLastCollisionYAt bracket the hitbox height in subcell units', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);
      const hb = ch._pixelHitbox(0.3);

      // Act
      const first = ch._pixelFirstCollisionYAt(2, hb, 4);
      const last = ch._pixelLastCollisionYAt(2, hb, 4);

      // Assert
      expect(first).toBeCloseTo(2.0);
      expect(last).toBeCloseTo(2.75);
    });
  });

  describe('lane checks at a newly-entered subcell column/row', () =>
  {
    // NOTE: these two helpers only run their lane logic when a single step crosses into a
    // subcell column/row the hitbox didn't already touch at all - given the default hitbox
    // (radius 0.3, width 0.6) that requires a step of >= ~0.6 tiles, called directly here with
    // hand-picked coordinates since canPassStraight's own substep loop never feeds a step that
    // large (see the caller-reachability note flagged separately to JE).
    it('_pixelCheckVerticalAtNewXColumn returns true immediately when there is no horizontal motion', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);
      const hb = ch._pixelHitbox(0.3);

      // Act & Assert
      expect(ch._pixelCheckVerticalAtNewXColumn(1.5, 1.5, 1.5, hb, 4)).toBe(true);
    });

    it('_pixelCheckVerticalAtNewXColumn approves an open new column', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);
      const hb = ch._pixelHitbox(0.3);

      // Act & Assert: xCurrent=0.2 -> xDest=0.8 crosses into column x=1.0 at y=1.
      expect(ch._pixelCheckVerticalAtNewXColumn(0.2, 0.8, 1, hb, 4)).toBe(true);
    });

    it('_pixelCheckVerticalAtNewXColumn rejects when the new column is fully solid', () =>
    {
      // Arrange: wall tile (1,1) makes every subcell in the newly-entered column solid.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '1,1' ]));
      const ch = makeCharacterOn(map, 0, 0);
      const hb = ch._pixelHitbox(0.3);

      // Act & Assert
      expect(ch._pixelCheckVerticalAtNewXColumn(0.2, 0.8, 1, hb, 4)).toBe(false);
    });

    it('_pixelCheckHorizontalAtNewYRow returns true immediately when there is no vertical motion', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);
      const hb = ch._pixelHitbox(0.3);

      // Act & Assert
      expect(ch._pixelCheckHorizontalAtNewYRow(1.5, 1.5, 1.5, hb, 4)).toBe(true);
    });

    it('_pixelCheckHorizontalAtNewYRow approves an open new row', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 0, 0);
      const hb = ch._pixelHitbox(0.3);

      // Act & Assert: yCurrent=0.2 -> yDest=0.8 crosses into row y=1.0 at x=1.
      expect(ch._pixelCheckHorizontalAtNewYRow(0.2, 0.8, 1, hb, 4)).toBe(true);
    });

    it('_pixelCheckHorizontalAtNewYRow rejects when the new row is fully solid', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '1,1' ]));
      const ch = makeCharacterOn(map, 0, 0);
      const hb = ch._pixelHitbox(0.3);

      // Act & Assert
      expect(ch._pixelCheckHorizontalAtNewYRow(0.2, 0.8, 1, hb, 4)).toBe(false);
    });
  });
});
//endregion plugins/pixel/core/_component/game-character-base-pixel-collision-kernel.test.js
