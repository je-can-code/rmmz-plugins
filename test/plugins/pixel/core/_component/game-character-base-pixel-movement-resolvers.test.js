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
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');
    await import('../../../../../src/plugins/_base/objects/Game_CharacterBase.js');

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

    it('prefers the horizontal fallback leg when its residual is smaller than the vertical one', () =>
    {
      // Arrange: forces diagonalFallback's chooseHorizontalPredicate branch to true —
      // X sits exactly on the tile center (0 residual) while Y drifted (0.3 residual),
      // so the horizontal leg is the closer one to re-align through.
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);
      ch._x = 2;
      ch._y = 1.7;
      ch.canPassDiagonalByDirection = () => false;

      // Act
      const faced = ch.pixelMoveByInput(D().LOWERRIGHT);

      // Assert
      expect(faced).toBe(D().RIGHT);
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

    it('moves purely upward at angle 270', () =>
    {
      // Arrange
      const map = buildWalledPixelGameMap(5, 5);
      const ch = makeCharacterOn(map, 2, 2);

      // Act
      const moved = ch.vectorMoveByAngle(270);

      // Assert
      expect(moved).toBe(true);
      expect(ch._x).toBeCloseTo(2);
      expect(ch._y).toBeLessThan(2);
      expect(ch.direction()).toBe(D().UP);
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
