//region plugins/pixel/core/_component/game-character-base-pixel-movement-resolvers.test.js
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
 * Same wall-aware `$gameMap` stand-in used by the collision-kernel suite; duplicated locally
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

describe('J-Pixelistics Game_CharacterBase movement resolvers (direct src import)', () =>
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

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
  });

  /**
   * Rebuilds the subcell collision table for a fresh `$gameMap` and returns a character
   * positioned on it. `moveSpeed` defaults to 8 (a full tile of `distancePerFrame`) so
   * open-vs-blocked geometry can be reasoned about in whole tiles instead of tiny epsilons.
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

    const ch = new globalThis.Game_CharacterBase();
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

  const D = () => globalThis.J.PIXEL.Directions;

  describe('moveStraight engine-alias override', () =>
  {
    it('moves and faces the direction when passable', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      ch.moveStraight(D().RIGHT);

      // Assert
      expect(ch.isMovementSucceeded()).toBe(true);
      expect(ch._x).toBeGreaterThan(2);
      expect(ch.direction()).toBe(D().RIGHT);
    });

    it('still faces the attempted direction and notifies touch-front when blocked', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '3,2' ]));
      const ch = makeCharacterOn(map, 2, 2);
      const touchSpy = vi.spyOn(ch, 'checkEventTriggerTouchFront');

      // Act
      ch.moveStraight(D().RIGHT);

      // Assert
      expect(ch.isMovementSucceeded()).toBe(false);
      expect(ch._x).toBe(2);
      expect(ch.direction()).toBe(D().RIGHT);
      expect(touchSpy).toHaveBeenCalledWith(D().RIGHT);
      touchSpy.mockRestore();
    });
  });

  describe('moveDiagonally engine-alias override', () =>
  {
    it('moves and faces the resolved diagonal when passable', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      ch.moveDiagonally(D().RIGHT, D().DOWN);

      // Assert
      expect(ch.isMovementSucceeded()).toBe(true);
      expect(ch._x).toBeGreaterThan(2);
      expect(ch._y).toBeGreaterThan(2);
    });

    it('faces the vertical cardinal instead of the raw diagonal code when passable', () =>
    {
      // Arrange: characterPatternY only understands cardinals 2/4/6/8; a diagonal code
      // (1/3/7/9) here would produce a fractional, corrupted sprite-sheet row.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      ch.moveDiagonally(D().RIGHT, D().DOWN);

      // Assert
      expect(ch.direction()).toBe(D().DOWN);
    });

    it('rotates toward the horizontal component when facing its reverse and blocked', () =>
    {
      // Arrange: facing LEFT (reverse of RIGHT); rmmz rotates unconditionally toward the
      // component direction even on a failed diagonal. canPassDiagonally validates its legs
      // against a single per-frame straightStep (no substepping like canPassStraight), so at
      // a realistic moveSpeed the probe must already sit just shy of the wall's boundary.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '3,2' ]));
      const ch = makeCharacterOn(map, 2, 2, 4);
      ch._x = 2.17;
      ch._y = 2;
      ch.setDirection(D().LEFT);

      // Act
      ch.moveDiagonally(D().RIGHT, D().DOWN);

      // Assert
      expect(ch.isMovementSucceeded()).toBe(false);
      expect(ch.direction()).toBe(D().RIGHT);
    });

    it('rotates toward the vertical component when facing its reverse and blocked', () =>
    {
      // Arrange: facing UP (reverse of DOWN); wall directly below blocks only the vertical leg.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,3' ]));
      const ch = makeCharacterOn(map, 2, 2, 4);
      ch._x = 2;
      ch._y = 2.17;
      ch.setDirection(D().UP);

      // Act
      ch.moveDiagonally(D().RIGHT, D().DOWN);

      // Assert
      expect(ch.isMovementSucceeded()).toBe(false);
      expect(ch.direction()).toBe(D().DOWN);
    });
  });

  describe('pixelMoveByInput diagonal handling', () =>
  {
    it('executes the diagonal and faces down when both legs and the landing point are clear', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().LOWERRIGHT);

      // Assert
      expect(faced).toBe(D().DOWN);
      expect(ch._x).toBeGreaterThan(2);
      expect(ch._y).toBeGreaterThan(2);
    });

    it('executes the diagonal and faces up for an upper diagonal', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().UPPERLEFT);

      // Assert
      expect(faced).toBe(D().UP);
      expect(ch._x).toBeLessThan(2);
      expect(ch._y).toBeLessThan(2);
    });

    it.each([
      [ 'LOWERLEFT', [ 'LEFT', 'DOWN' ] ],
      [ 'LOWERRIGHT', [ 'RIGHT', 'DOWN' ] ],
      [ 'UPPERLEFT', [ 'LEFT', 'UP' ] ],
      [ 'UPPERRIGHT', [ 'RIGHT', 'UP' ] ],
    ])('falls back to a cardinal by residual for %s when both legs are clear but the diagonal landing itself is blocked', (dirKey, legKeys) =>
    {
      // Arrange: isolate the orchestration decision from the lower-level landing-collision
      // math (already covered directly against real geometry in the collision-kernel suite).
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch.canPassDiagonalByDirection = () => false;

      // Act
      const faced = ch.pixelMoveByInput(D()[dirKey]);

      // Assert: fell back to one of the two legs and actually moved along it.
      expect(legKeys.map(k => D()[k])).toContain(faced);
      expect(ch.isMovementSucceeded()).toBe(true);
    });

    it.each([
      [ 'LOWERLEFT', 2, 1.7, 'LEFT', 1, 1.7 ],
      [ 'LOWERLEFT', 2.3, 2, 'DOWN', 2.3, 3 ],
      [ 'LOWERRIGHT', 2, 1.7, 'RIGHT', 3, 1.7 ],
      [ 'LOWERRIGHT', 1.7, 2, 'DOWN', 1.7, 3 ],
      [ 'UPPERLEFT', 2, 2.3, 'LEFT', 1, 2.3 ],
      [ 'UPPERLEFT', 2.3, 2, 'UP', 2.3, 1 ],
      [ 'UPPERRIGHT', 2, 2.3, 'RIGHT', 3, 2.3 ],
      [ 'UPPERRIGHT', 1.7, 2, 'UP', 1.7, 1 ],
    ])('splits a blocked %s standing at (%d, %d) toward %s, the axis with the smaller residual',
      (dirKey, x, y, expectedKey, expectedX, expectedY) =>
      {
        // Arrange: each quadrant compares its own pair of residuals, and each row leaves exactly one
        // axis sitting off its tile center so the comparison has a real winner. A tie would answer
        // the same either way and could not tell the two arms apart.
        const map = buildWalledPixelGameMap(5, 5);
        const ch = makeCharacterOn(map, 2, 2);
        ch._x = x;
        ch._y = y;
        ch.canPassDiagonalByDirection = () => false;

        // Act
        const faced = ch.pixelMoveByInput(D()[dirKey]);

        // Assert: the chosen leg is also the one that moved, so the facing cannot be right by
        // accident while the step went the other way.
        expect(faced).toBe(D()[expectedKey]);
        expect(ch._x).toBe(expectedX);
        expect(ch._y).toBe(expectedY);
      });

    it('recurses into the only passable leg (LEFT) when the DOWN leg of LOWERLEFT is blocked', () =>
    {
      // Arrange: wall directly below blocks the DOWN leg; LEFT stays open.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '1,3' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().LOWERLEFT);

      // Assert
      expect(faced).toBe(D().LEFT);
      expect(ch._x).toBeLessThan(1);
      expect(ch._y).toBe(2);
    });

    it('recurses into the only passable leg (DOWN) when the LEFT leg of LOWERLEFT is blocked', () =>
    {
      // Arrange: wall directly left blocks the LEFT leg; DOWN stays open.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '0,2' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().LOWERLEFT);

      // Assert
      expect(faced).toBe(D().DOWN);
      expect(ch._x).toBe(1);
      expect(ch._y).toBeGreaterThan(2);
    });

    it('biases facing to down without moving when neither leg of a lower diagonal is passable', () =>
    {
      // Arrange: walls directly left and below box in both legs of LOWERLEFT.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '0,2', '1,3' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().LOWERLEFT);

      // Assert
      expect(faced).toBe(D().DOWN);
      expect(ch._x).toBe(1);
      expect(ch._y).toBe(2);
    });

    it('recurses into the only passable leg (RIGHT) when the DOWN leg of LOWERRIGHT is blocked', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '1,3' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().LOWERRIGHT);

      // Assert
      expect(faced).toBe(D().RIGHT);
      expect(ch._x).toBeGreaterThan(1);
      expect(ch._y).toBe(2);
    });

    it('recurses into the only passable leg (DOWN) when the RIGHT leg of LOWERRIGHT is blocked', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().LOWERRIGHT);

      // Assert
      expect(faced).toBe(D().DOWN);
      expect(ch._x).toBe(1);
      expect(ch._y).toBeGreaterThan(2);
    });

    it('biases facing to down without moving when neither leg of LOWERRIGHT is passable', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2', '1,3' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().LOWERRIGHT);

      // Assert
      expect(faced).toBe(D().DOWN);
      expect(ch._x).toBe(1);
      expect(ch._y).toBe(2);
    });

    it('recurses into the only passable leg (LEFT) when the UP leg of UPPERLEFT is blocked', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '1,1' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().UPPERLEFT);

      // Assert
      expect(faced).toBe(D().LEFT);
      expect(ch._x).toBeLessThan(1);
      expect(ch._y).toBe(2);
    });

    it('recurses into the only passable leg (UP) when the LEFT leg of UPPERLEFT is blocked', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '0,2' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().UPPERLEFT);

      // Assert
      expect(faced).toBe(D().UP);
      expect(ch._x).toBe(1);
      expect(ch._y).toBeLessThan(2);
    });

    it('biases facing to up without moving when neither leg of UPPERLEFT is passable', () =>
    {
      // Arrange: walls directly left and above box in both legs of UPPERLEFT.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '0,2', '1,1' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().UPPERLEFT);

      // Assert
      expect(faced).toBe(D().UP);
      expect(ch._x).toBe(1);
      expect(ch._y).toBe(2);
    });

    it('recurses into the only passable leg (RIGHT) when the UP leg of UPPERRIGHT is blocked', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '1,1' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().UPPERRIGHT);

      // Assert
      expect(faced).toBe(D().RIGHT);
      expect(ch._x).toBeGreaterThan(1);
      expect(ch._y).toBe(2);
    });

    it('recurses into the only passable leg (UP) when the RIGHT leg of UPPERRIGHT is blocked', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().UPPERRIGHT);

      // Assert
      expect(faced).toBe(D().UP);
      expect(ch._x).toBe(1);
      expect(ch._y).toBeLessThan(2);
    });

    it('biases facing to up without moving when neither leg of UPPERRIGHT is passable', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,2', '1,1' ]));
      const ch = makeCharacterOn(map, 1, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().UPPERRIGHT);

      // Assert
      expect(faced).toBe(D().UP);
      expect(ch._x).toBe(1);
      expect(ch._y).toBe(2);
    });

    it.each([
      [ 'LOWERLEFT', 'DOWN' ],
      [ 'LOWERRIGHT', 'DOWN' ],
      [ 'UPPERLEFT', 'UP' ],
      [ 'UPPERRIGHT', 'UP' ],
    ])('answers a fully blocked %s with a bare facing rather than a recursion into %s', (dirKey, facingKey) =>
    {
      // Arrange: X sits off its tile center, which is the only thing that separates the two
      // outcomes. Recursing into the bias cardinal would reach that cardinal's own wall-slide,
      // and a wall-slide always commits a perpendicular nudge before giving up - so it would drag
      // X toward the tile center and flag the frame as moved. The returned facing is identical
      // either way, since the recursion falls through to returning the direction it was handed.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._x = 1.3;
      ch.canPassStraight = () => false;

      // Act
      const faced = ch.pixelMoveByInput(D()[dirKey]);

      // Assert
      expect(faced).toBe(D()[facingKey]);
      expect(ch._x).toBe(1.3);
      expect(ch.didMoveThisFrame()).toBe(false);
    });
  });

  describe('pixelMoveByInput straight handling', () =>
  {
    it('moves straight and re-centers the orthogonal axis when within snap tolerance', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._x = 2.05;

      // Act
      const faced = ch.pixelMoveByInput(D().DOWN);

      // Assert: X snapped back to the rounded tile center since 0.05 is within epsilon.
      expect(faced).toBe(D().DOWN);
      expect(ch._x).toBe(2);
    });

    it('does not re-center the orthogonal axis when drift exceeds snap tolerance', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._x = 2.4;

      // Act
      ch.pixelMoveByInput(D().DOWN);

      // Assert
      expect(ch._x).toBe(2.4);
    });

    it('re-centers the Y axis after a horizontal move when within snap tolerance', () =>
    {
      // Arrange: the vertical counterpart of the two X cases above. A horizontal step never touches
      // Y itself, so any change to Y here can only have come from the re-centering.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._y = 2.05;

      // Act
      const faced = ch.pixelMoveByInput(D().RIGHT);

      // Assert: X advanced a full tile, and Y snapped back to the rounded tile center.
      expect(faced).toBe(D().RIGHT);
      expect(ch._x).toBe(3);
      expect(ch._y).toBe(2);
    });

    it('does not re-center the Y axis after a horizontal move when drift exceeds snap tolerance', () =>
    {
      // Arrange: 0.4 of a tile is well past the tolerance, so the drift is deliberate travel rather
      // than jitter and must be left alone.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._y = 2.4;

      // Act
      const faced = ch.pixelMoveByInput(D().RIGHT);

      // Assert
      expect(faced).toBe(D().RIGHT);
      expect(ch._x).toBe(3);
      expect(ch._y).toBe(2.4);
    });

    it('wall-slide is a no-op when blocked but already centered on the perpendicular axis, still facing the blocked direction', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,3' ]));
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().DOWN);

      // Assert: no movement occurred, but the original requested direction is still returned
      // so the caller can face the wall it just walked into.
      expect(faced).toBe(D().DOWN);
      expect(ch._x).toBe(2);
      expect(ch._y).toBe(2);

      // the blocked step never ran, so the only thing left that could flag the frame as moved is
      // the wall-slide committing a zero-length nudge instead of bowing out on the centered check.
      expect(ch.didMoveThisFrame()).toBe(false);
    });

    it('wall-slide commits a perpendicular nudge and opens a corridor through when one becomes available', () =>
    {
      // Arrange: force the pre-nudge probe blocked, then the post-nudge probe open,
      // isolating tryWallSlide's own orchestration from exact seam geometry.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._x = 2.3;
      let callCount = 0;
      ch.canPassStraight = (dir) =>
      {
        callCount += 1;
        return dir === D().DOWN && callCount > 1;
      };

      // Act
      const faced = ch.pixelMoveByInput(D().DOWN);

      // Assert: nudge toward roundX(2) committed, then the DOWN move executed.
      expect(faced).toBe(D().DOWN);
      expect(ch._x).toBeLessThan(2.3);
      expect(ch._y).toBeGreaterThan(2);
    });

    it('wall-slide rejects the nudge outright when the nudged position would overlap a solid tile', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._x = 2.3;
      ch.canPassStraight = () => false;
      ch.isOverlappingSolidTiles = () => true;

      // Act
      const faced = ch.pixelMoveByInput(D().DOWN);

      // Assert: rejected before committing, so position is untouched.
      expect(faced).toBe(D().DOWN);
      expect(ch._x).toBe(2.3);
      expect(ch._y).toBe(2);
    });

    it('wall-slide commits the nudge and flags per-frame movement when the corridor stays blocked', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._x = 2.3;
      ch.canPassStraight = () => false;
      ch.isOverlappingSolidTiles = () => false;

      // Act
      const faced = ch.pixelMoveByInput(D().DOWN);

      // Assert: nudge committed (drift toward center) but the straight move itself never fired.
      expect(faced).toBe(D().DOWN);
      expect(ch._x).toBeLessThan(2.3);
      expect(ch._y).toBe(2);
      expect(ch.didMoveThisFrame()).toBe(true);
    });

    it('wall-slide nudges the perpendicular Y axis (not X) when the blocked direction is horizontal', () =>
    {
      // Arrange: mirrors the DOWN/X-nudge suite above but for a LEFT/RIGHT blocked direction,
      // which nudges Y instead — the branch that array never touches.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._y = 2.3;
      let callCount = 0;
      ch.canPassStraight = (dir) =>
      {
        callCount += 1;
        return dir === D().RIGHT && callCount > 1;
      };

      // Act
      const faced = ch.pixelMoveByInput(D().RIGHT);

      // Assert: nudge toward roundY(2) committed, then the RIGHT move executed.
      expect(faced).toBe(D().RIGHT);
      expect(ch._y).toBeLessThan(2.3);
      expect(ch._x).toBeGreaterThan(2);
    });

    it('wall-slide Y-nudge is a no-op when already centered', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '3,2' ]));
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().RIGHT);

      // Assert
      expect(faced).toBe(D().RIGHT);
      expect(ch._x).toBe(2);
      expect(ch._y).toBe(2);

      // as with the X-nudge case, a flagged frame here would mean a zero-length nudge was committed
      // rather than declined.
      expect(ch.didMoveThisFrame()).toBe(false);
    });

    it('wall-slide nudges Y for a blocked LEFT, the same as it does for a blocked RIGHT', () =>
    {
      // Arrange: LEFT and RIGHT are the two horizontal blocked directions and must classify the
      // same way, but only RIGHT has ever been observed nudging Y. X already sits on its tile
      // center, so treating LEFT as a vertical block would find nothing to nudge and bow out.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._y = 2.3;
      ch.canPassStraight = () => false;

      // Act
      const faced = ch.pixelMoveByInput(D().LEFT);

      // Assert: the whole 0.3 residual is inside one frame's travel, so Y lands exactly on center.
      expect(faced).toBe(D().LEFT);
      expect(ch._y).toBe(2);
      expect(ch._x).toBe(2);
      expect(ch.didMoveThisFrame()).toBe(true);
    });

    it('wall-slide Y-nudge is rejected outright when the nudged position would overlap a solid tile', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._y = 2.3;
      ch.canPassStraight = () => false;
      ch.isOverlappingSolidTiles = () => true;

      // Act
      const faced = ch.pixelMoveByInput(D().RIGHT);

      // Assert
      expect(faced).toBe(D().RIGHT);
      expect(ch._y).toBe(2.3);
      expect(ch._x).toBe(2);
    });

    it('wall-slide Y-nudge commits and flags per-frame movement when the corridor stays blocked', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._y = 2.3;
      ch.canPassStraight = () => false;
      ch.isOverlappingSolidTiles = () => false;

      // Act
      const faced = ch.pixelMoveByInput(D().RIGHT);

      // Assert
      expect(faced).toBe(D().RIGHT);
      expect(ch._y).toBeLessThan(2.3);
      expect(ch._x).toBe(2);
      expect(ch.didMoveThisFrame()).toBe(true);
    });

    it('wall-slide is reached through the UP switch case', () =>
    {
      // Arrange: covers the handleStraight -> tryWallSlide(UP) call site specifically;
      // the shared tryWallSlide logic itself is already exercised via DOWN/RIGHT above.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,1' ]));
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().UP);

      // Assert
      expect(faced).toBe(D().UP);
      expect(ch._y).toBe(2);
    });

    it('wall-slide is reached through the LEFT switch case', () =>
    {
      // Arrange: covers the handleStraight -> tryWallSlide(LEFT) call site specifically.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '1,2' ]));
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const faced = ch.pixelMoveByInput(D().LEFT);

      // Assert
      expect(faced).toBe(D().LEFT);
      expect(ch._x).toBe(2);
    });

    it.each([
      [ 'DOWN' ],
      [ 'UP' ],
      [ 'LEFT' ],
      [ 'RIGHT' ],
    ])('refuses to step %s into a tile another character occupies', (dirKey) =>
    {
      // Arrange: character-vs-character collision is the one refusal that the post-move solid-tile
      // rollback inside movePixelDistance does not also catch, so a step taken in spite of it would
      // stand rather than being quietly undone the way a step into terrain is. The map is open and
      // the character is centered, so the wall-slide has no residual to nudge and cannot move
      // anything either.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch.isCharacterCollisionAt = () => true;

      // Act
      const faced = ch.pixelMoveByInput(D()[dirKey]);

      // Assert
      expect(faced).toBe(D()[dirKey]);
      expect(ch._x).toBe(2);
      expect(ch._y).toBe(2);
    });
  });

  describe('vectorMoveByAngle', () =>
  {
    it('moves purely rightward at angle 0', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const moved = ch.vectorMoveByAngle(0);

      // Assert
      expect(moved).toBe(true);
      expect(ch._x).toBeGreaterThan(2);
      expect(ch._y).toBe(2);
      expect(ch.direction()).toBe(D().RIGHT);
    });

    it('moves purely downward at angle 90', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const moved = ch.vectorMoveByAngle(90);

      // Assert
      expect(moved).toBe(true);
      expect(ch._x).toBe(2);
      expect(ch._y).toBeGreaterThan(2);
      expect(ch.direction()).toBe(D().DOWN);
    });

    it('moves diagonally when both axis components are open', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const moved = ch.vectorMoveByAngle(45);

      // Assert
      expect(moved).toBe(true);
      expect(ch._x).toBeGreaterThan(2);
      expect(ch._y).toBeGreaterThan(2);
    });

    it('wall-slides along the open axis when the other axis is blocked', () =>
    {
      // Arrange: wall directly right blocks the X component of a down-right angle.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '3,2' ]));
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const moved = ch.vectorMoveByAngle(45);

      // Assert
      expect(moved).toBe(true);
      expect(ch._x).toBe(2);
      expect(ch._y).toBeGreaterThan(2);
    });

    it('returns false without moving when both axis components are fully blocked', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5, new Set([ '3,2', '2,3' ]));
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const moved = ch.vectorMoveByAngle(45);

      // Assert
      expect(moved).toBe(false);
      expect(ch._x).toBe(2);
      expect(ch._y).toBe(2);
    });

    it('fires a touch-front trigger for the blocked axis on contact, even while sliding succeeds', () =>
    {
      // Arrange: wall directly right blocks only the X component of a down-right angle; without
      // this, hugging a wall/door at a fuzzy analog angle would never fire its touch trigger,
      // since wall-sliding lets movement "succeed" via the open axis indefinitely and a true full
      // stop (the old, only trigger point) almost never happens for imprecise stick input.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '3,2' ]));
      const ch = makeCharacterOn(map, 2, 2);
      const touchSpy = vi.spyOn(ch, 'checkEventTriggerTouchFront')
        .mockImplementation(() => {});

      // Act
      const moved = ch.vectorMoveByAngle(45);

      // Assert: slide still succeeds, but the blocked (horizontal/RIGHT) axis fired its trigger.
      expect(moved).toBe(true);
      expect(touchSpy).toHaveBeenCalledWith(D().RIGHT);
      touchSpy.mockRestore();
    });

    it('does not fire a touch-front trigger for an axis that was never blocked', () =>
    {
      // Arrange: open floor in every direction, so neither axis is ever blocked.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      const touchSpy = vi.spyOn(ch, 'checkEventTriggerTouchFront')
        .mockImplementation(() => {});

      // Act
      ch.vectorMoveByAngle(45);

      // Assert
      expect(touchSpy).not.toHaveBeenCalled();
      touchSpy.mockRestore();
    });

    it('rolls back and returns false when the post-move AABB overlaps a solid tile', () =>
    {
      // Arrange: canPassStraight itself also guards on isOverlappingSolidTiles internally, so
      // stubbing that alone would make the pre-move probe report blocked too (hitting the
      // "fully blocked" early-return instead of the intended post-move rollback). Stub
      // canPassStraight directly to force both axis probes open, then let the outer overlap
      // guard reject the result.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch.canPassStraight = () => true;
      ch.isOverlappingSolidTiles = () => true;

      // Act
      const moved = ch.vectorMoveByAngle(0);

      // Assert
      expect(moved).toBe(false);
      expect(ch._x).toBe(2);
      expect(ch._y).toBe(2);
    });

    it('keeps a through-flagged step that lands inside a solid tile', () =>
    {
      // Arrange: the rollback arrangement above, plus through. Standing inside terrain is the whole
      // point of through, so the post-move overlap guard has to stand down for it - and unlike the
      // straight probe, nothing earlier in this method has already answered on the through flag.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch.canPassStraight = () => true;
      ch.isOverlappingSolidTiles = () => true;
      ch.setThrough(true);

      // Act
      const moved = ch.vectorMoveByAngle(0);

      // Assert
      expect(moved).toBe(true);
      expect(ch._x).toBe(3);
    });

    it('keeps a debug-through step that lands inside a solid tile', () =>
    {
      // Arrange: playtest debug-through is the second, independent licence to ignore terrain, and
      // the through flag above cannot speak for it.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch.canPassStraight = () => true;
      ch.isOverlappingSolidTiles = () => true;
      ch.isDebugThrough = () => true;

      // Act
      const moved = ch.vectorMoveByAngle(0);

      // Assert
      expect(moved).toBe(true);
      expect(ch._x).toBe(3);
    });

    it('moves purely leftward at angle 180', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const moved = ch.vectorMoveByAngle(180);

      // Assert
      expect(moved).toBe(true);
      expect(ch._x).toBeLessThan(2);
      expect(ch._y).toBe(2);
      expect(ch.direction()).toBe(D().LEFT);
    });

    it('moves purely upward at angle 270 with zero sideways drift', () =>
    {
      // Arrange: Math.cos(270deg) is ~1e-17 rather than an exact 0 due to floating-point
      // noise; without snapping that noise to zero, _x would drift by that imperceptible
      // amount every frame instead of staying exactly put.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const moved = ch.vectorMoveByAngle(270);

      // Assert
      expect(moved).toBe(true);
      expect(ch._x).toBe(2);
      expect(ch._y).toBeLessThan(2);
      expect(ch.direction()).toBe(D().UP);
    });

    it('returns false without moving or faking sideways drift when blocked pushing straight up', () =>
    {
      // Arrange: a wall directly above blocks the sole (vertical) component of a pure-cardinal
      // angle. Before the floating-point noise fix, the ~1e-17 "sideways" component from
      // Math.cos(270deg) would slip past the "fully blocked" check and report a false success-
      // silently skipping the blocked-movement branch that fires touch-front triggers (doors,
      // NPC bumps) for every straight-line wall/door bump made via keyboard input.
      const map = buildWalledPixelGameMap(5, 5, new Set([ '2,1' ]));
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const moved = ch.vectorMoveByAngle(270);

      // Assert
      expect(moved).toBe(false);
      expect(ch._x).toBe(2);
      expect(ch._y).toBe(2);
    });

    it.each([
      [ 0, '3,2' ],
      [ 90, '2,3' ],
      [ 180, '1,2' ],
      [ 270, '2,1' ],
    ])('returns false without moving or faking drift when blocked pushing at %i degrees', (angle, wall) =>
    {
      // Arrange: proves the noise-epsilon snap applies uniformly and isn't a one-direction fix.
      const map = buildWalledPixelGameMap(5, 5, new Set([ wall ]));
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const moved = ch.vectorMoveByAngle(angle);

      // Assert
      expect(moved).toBe(false);
      expect(ch._x).toBe(2);
      expect(ch._y).toBe(2);
    });
  });

  describe('angleToNearestDirection', () =>
  {
    it.each([
      [ 0, 'RIGHT' ],
      [ 44, 'RIGHT' ],
      [ 350, 'RIGHT' ],
      [ 45, 'DOWN' ],
      [ 134, 'DOWN' ],
      [ 135, 'LEFT' ],
      [ 224, 'LEFT' ],
      [ 225, 'UP' ],
      [ 314, 'UP' ],
    ])('snaps %i degrees to %s', (angle, dirKey) =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act & Assert
      expect(ch.angleToNearestDirection(angle)).toBe(D()[dirKey]);
    });

    it('normalizes angles outside the 0-360 range', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act & Assert
      expect(ch.angleToNearestDirection(-90)).toBe(D().UP);
      expect(ch.angleToNearestDirection(720)).toBe(D().RIGHT);
    });
  });
});
//endregion plugins/pixel/core/_component/game-character-base-pixel-movement-resolvers.test.js
