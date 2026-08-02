//region plugins/pixel/core/objects/game-character-base-diagonal-and-lanes.test.js
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
 * Builds a map whose passability is specified per tile AND per direction, so tests can express
 * one-way geometry: a doorway you may walk into but not out of, a ledge you may drop down but not
 * climb. RPG Maker supports exactly this through directional tile passage, and several of the
 * collision kernel's paired checks only diverge under it- a symmetric wall is always caught by the
 * first check of a pair, so the second never gets a chance to speak.
 * @param {number} width The map width in tiles.
 * @param {number} height The map height in tiles.
 * @param {Set<string>} blocked Entries keyed `"x,y,direction"` that are impassable.
 * @returns {object}
 */
function buildDirectionalPixelGameMap(width, height, blocked = new Set())
{
  return {
    _pixelFootTouchTriggerCooldown: 0,
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
      // off-map is always impassable, matching the engine.
      if (x < 0 || y < 0 || x >= width || y >= height) return false;

      return blocked.has(`${x},${y},${d}`) === false;
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
    roundXWithDirection(x, d)
    {
      if (d === globalThis.J.PIXEL.Directions.RIGHT) return x + 1;
      if (d === globalThis.J.PIXEL.Directions.LEFT) return x - 1;

      return x;
    },
    roundYWithDirection(y, d)
    {
      if (d === globalThis.J.PIXEL.Directions.DOWN) return y + 1;
      if (d === globalThis.J.PIXEL.Directions.UP) return y - 1;

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
    eventsXy()
    {
      return [];
    },
    eventsXyNt()
    {
      return [];
    },
    isEventRunning()
    {
      return false;
    },
    isAnyEventStarting()
    {
      return false;
    },
    requestRefresh: noop,
  };
}

/**
 * Builds the full set of directional blocks that make a tile behave as a solid wall: nothing may
 * leave it, and no neighbor may enter it.
 * @param {number} x The wall tile x.
 * @param {number} y The wall tile y.
 * @returns {string[]} The block keys.
 */
function solidTileBlocks(x, y)
{
  const { DOWN, LEFT, RIGHT, UP } = globalThis.J.PIXEL.Directions;

  return [
    // the tile itself cannot be exited in any direction.
    `${x},${y},${DOWN}`, `${x},${y},${LEFT}`, `${x},${y},${RIGHT}`, `${x},${y},${UP}`,
    // no neighbor may move into it.
    `${x},${y - 1},${DOWN}`,
    `${x},${y + 1},${UP}`,
    `${x - 1},${y},${RIGHT}`,
    `${x + 1},${y},${LEFT}`,
  ];
}

/**
 * The diagonal movement path and the directional lane checks of pixel core's collision kernel.
 * Diagonal movement has its own validation pipeline distinct from the straight one- it revalidates
 * each leg at the displaced position of the other, so a diagonal into an inner corner is refused
 * even when both legs pass individually.
 */
describe('J-Pixelistics Game_CharacterBase diagonals and lanes (direct src import)', () =>
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
   * Installs a map and rebuilds the subcell collision table against it.
   * @param {object} gameMap The map to install.
   */
  function useMap(gameMap)
  {
    globalThis.$gameMap = gameMap;
    globalThis.$dataMap = {
      width: gameMap.width(),
      height: gameMap.height(),
    };
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();
  }

  /**
   * Builds a character positioned for kernel-level probing.
   * @param {number} x The fractional x.
   * @param {number} y The fractional y.
   * @returns {Game_CharacterBase}
   */
  function makeCharacter(x, y)
  {
    const character = new globalThis.Game_CharacterBase();
    character.initMembers();
    character.setMoveSpeed(4);
    character.relocate(x, y);

    return character;
  }

  beforeEach(() =>
  {
    // several tests below drop to a single subcell per tile; restore the default first so that
    // choice never leaks into a neighbouring test through the shared metadata object.
    globalThis.J.PIXEL.Metadata.CollisionStepCount = 4;
    useMap(buildDirectionalPixelGameMap(10, 10));
    globalThis.$gamePlayer = new globalThis.Game_Player();
    globalThis.$gamePlayer.initMembers();
  });

  //region movePixelDistance
  describe('movePixelDistance', () =>
  {
    it('moves nowhere for a direction that is neither straight nor diagonal', () =>
    {
      // Arrange: dir 5 is the neutral centre of the numpad layout and never denotes travel.
      const character = makeCharacter(4, 4);

      // Act
      character.movePixelDistance(5, 0.5);

      // Assert
      expect([ character.x, character.y ]).toEqual([ 4, 4 ]);
    });
  });
  //endregion movePixelDistance

  //region diagonal movement
  describe('moveDiagonally', () =>
  {
    it.each([
      [ 'LOWERRIGHT', 'RIGHT', 'DOWN', 'DOWN' ],
      [ 'LOWERLEFT', 'LEFT', 'DOWN', 'DOWN' ],
      [ 'UPPERRIGHT', 'RIGHT', 'UP', 'UP' ],
      [ 'UPPERLEFT', 'LEFT', 'UP', 'UP' ],
    ])('faces a cardinal when travelling %s, since sprite rows only understand cardinals',
      (_label, horzKey, vertKey, facingKey) =>
      {
        // Arrange
        const { Directions } = globalThis.J.PIXEL;
        const character = makeCharacter(4, 4);

        // Act
        character.moveDiagonally(Directions[horzKey], Directions[vertKey]);

        // Assert
        expect(character.direction()).toBe(Directions[facingKey]);
      });

    it.each([
      [ 'LOWERRIGHT', 'RIGHT', 'DOWN', 1, 1 ],
      [ 'LOWERLEFT', 'LEFT', 'DOWN', -1, 1 ],
      [ 'UPPERRIGHT', 'RIGHT', 'UP', 1, -1 ],
      [ 'UPPERLEFT', 'LEFT', 'UP', -1, -1 ],
    ])('displaces on both axes when travelling %s', (_label, horzKey, vertKey, signX, signY) =>
    {
      // Arrange
      const { Directions } = globalThis.J.PIXEL;
      const character = makeCharacter(4, 4);

      // Act
      character.moveDiagonally(Directions[horzKey], Directions[vertKey]);

      // Assert
      expect([ Math.sign(character.x - 4), Math.sign(character.y - 4) ]).toEqual([ signX, signY ]);
    });

    it('refuses a diagonal whose destination leaves the map', () =>
    {
      // Arrange: the top-left corner has no upper-left neighbour to move into.
      const { Directions } = globalThis.J.PIXEL;
      const character = makeCharacter(0, 0);

      // Act
      character.moveDiagonally(Directions.LEFT, Directions.UP);

      // Assert
      expect(character.isMovementSucceeded()).toBe(false);
    });

    it('refuses a diagonal into an inner corner even though both legs pass alone', () =>
    {
      // Arrange: walls below and to the right leave both single-axis moves legal, but the
      // diagonal landing itself sits in the pocket between them.
      const blocks = [ ...solidTileBlocks(5, 4), ...solidTileBlocks(4, 5) ];
      useMap(buildDirectionalPixelGameMap(10, 10, new Set(blocks)));
      const { Directions } = globalThis.J.PIXEL;

      // a 0.5 pivot and 0.3 radius put the body edges at x+0.8 / y+0.8, so 4.2 sits flush in
      // the pocket where the next step crosses both seams at once.
      const character = makeCharacter(4.2, 4.2);

      // Act
      character.moveDiagonally(Directions.RIGHT, Directions.DOWN);

      // Assert
      expect(character.isMovementSucceeded()).toBe(false);
    });
  });
  //endregion diagonal movement

  //region diagonal input fallback
  describe('pixelMoveByInput diagonal fallback', () =>
  {
    it.each([
      [ 'LOWERRIGHT', 5, 4, 4, 5 ],
      [ 'LOWERLEFT', 3, 4, 4, 5 ],
      [ 'UPPERRIGHT', 5, 4, 4, 3 ],
      [ 'UPPERLEFT', 3, 4, 4, 3 ],
    ])('splits a blocked %s diagonal into a single-axis slide', (dirKey, wallAx, wallAy, wallBx, wallBy) =>
    {
      // Arrange: both component legs are individually passable, so the diagonal is attempted and
      // then refused at the landing- the input must degrade to a slide rather than a dead stop.
      const blocks = [ ...solidTileBlocks(wallAx, wallAy), ...solidTileBlocks(wallBx, wallBy) ];
      useMap(buildDirectionalPixelGameMap(10, 10, new Set(blocks)));
      const character = makeCharacter(4, 4);

      // Act
      const faced = character.pixelMoveByInput(globalThis.J.PIXEL.Directions[dirKey]);

      // Assert: a cardinal facing comes back rather than the composite diagonal code.
      expect([ 2, 4, 6, 8 ]).toContain(faced);
    });

    it.each([
      [ 'LOWERRIGHT' ],
      [ 'LOWERLEFT' ],
      [ 'UPPERRIGHT' ],
      [ 'UPPERLEFT' ],
    ])('travels diagonally on %s across open ground', (dirKey) =>
    {
      // Arrange
      const character = makeCharacter(4, 4);

      // Act
      character.pixelMoveByInput(globalThis.J.PIXEL.Directions[dirKey]);

      // Assert: both axes moved, which only a true diagonal step produces.
      expect(character.x === 4 || character.y === 4).toBe(false);
    });
  });
  //endregion diagonal input fallback

  //region vector movement contact triggers
  describe('vectorMoveByAngle blocked-axis contact', () =>
  {
    /**
     * Positions a character against a wall and records which axes it reports front-contact on.
     * Contact is reported by calling through to the engine's front-touch check, which is what
     * ultimately opens a door or bumps an NPC; the direction handed to it is the whole point of
     * the branch, so that is what gets captured. The character's own facing cannot answer this-
     * the angle-based sprite facing later in the same frame overwrites it.
     * @param {number[]} wall The wall tile coordinates.
     * @param {number} x The character x.
     * @param {number} y The character y.
     * @returns {number[]} The directions contact was reported on.
     */
    function recordContactDirections(wall, x, y)
    {
      useMap(buildDirectionalPixelGameMap(10, 10, new Set(solidTileBlocks(wall[0], wall[1]))));

      const character = makeCharacter(x, y);
      const contacts = [];
      character.checkEventTriggerTouchFront = function(direction)
      {
        contacts.push(direction);
      };

      // a 45 degree push keeps the unblocked component alive, so the character slides along the
      // wall rather than stopping dead- which is precisely when contact reporting matters.
      character.vectorMoveByAngle(45);

      return contacts;
    }

    it('reports contact on the blocked vertical axis while sliding along it', () =>
    {
      // Arrange & Act: a wall below only.
      const contacts = recordContactDirections([ 4, 5 ], 4, 4.2);

      // Assert
      expect(contacts).toEqual([ globalThis.J.PIXEL.Directions.DOWN ]);
    });

    it('reports contact on the blocked horizontal axis while sliding along it', () =>
    {
      // Arrange & Act: a wall to the right only.
      const contacts = recordContactDirections([ 5, 4 ], 4.2, 4);

      // Assert
      expect(contacts).toEqual([ globalThis.J.PIXEL.Directions.RIGHT ]);
    });

    it('reports no contact at all when nothing is in the way', () =>
    {
      // Arrange & Act: the wall is far enough away that neither axis touches it.
      const contacts = recordContactDirections([ 9, 9 ], 4, 4);

      // Assert
      expect(contacts).toEqual([]);
    });

    it('keeps sliding along the open axis when the other is blocked', () =>
    {
      // Arrange
      useMap(buildDirectionalPixelGameMap(10, 10, new Set(solidTileBlocks(5, 4))));
      const character = makeCharacter(4.2, 4);

      // Act
      const moved = character.vectorMoveByAngle(45);

      // Assert: blocked on x, but the y component still carried the character.
      expect(moved).toBe(true);
    });

    it('reports failure when both axes of a diagonal push are blocked', () =>
    {
      // Arrange: an inner corner blocks both components of a 45 degree push.
      const blocks = [ ...solidTileBlocks(5, 4), ...solidTileBlocks(4, 5), ...solidTileBlocks(5, 5) ];
      useMap(buildDirectionalPixelGameMap(10, 10, new Set(blocks)));
      const character = makeCharacter(4.2, 4.2);

      // Act
      const moved = character.vectorMoveByAngle(45);

      // Assert
      expect(moved).toBe(false);
    });
  });
  //endregion vector movement contact triggers

  //region paired passage checks
  describe('paired passage checks', () =>
  {
    /**
     * Each passage check validates a seam crossing twice: the subcell being left must permit the
     * exit, and the subcell being entered must permit the entry. A symmetric wall always fails the
     * first half, so the second half only ever speaks under one-way geometry. These paint that
     * geometry directly onto the subcell table, because a tile-level map cannot express "you may
     * leave this subcell but not enter the next one" precisely enough to isolate the second half.
     * @param {number} px The subcell x to paint.
     * @param {number} py The subcell y to paint.
     * @param {string} code The collision code name to paint there.
     * @returns {Game_CharacterBase} A character ready to probe, on an otherwise open map.
     */
    function characterWithPaintedSubcell(px, py, code)
    {
      useMap(buildDirectionalPixelGameMap(10, 10));

      const character = makeCharacter(4, 4);
      const { Codes } = globalThis.PIXEL_CollisionManager;
      globalThis.PIXEL_CollisionManager._set(px, py, Codes[code]);

      return character;
    }

    /**
     * Builds the hitbox and subgrid arguments the passage helpers expect.
     * @param {Game_CharacterBase} character The character being probed.
     * @returns {Array} The hitbox and subcell count.
     */
    function probeArgs(character)
    {
      return [ character._pixelHitbox(character.getEffectiveRadius()), character._pixelCollisionSubCount() ];
    }

    it('refuses leftward passage when the entered subcell forbids being entered from the right', () =>
    {
      // Arrange: the subcell being left permits the exit, so only the destination-side half of
      // the pair can refuse this crossing.
      const character = characterWithPaintedSubcell(4.0, 4.25, 'EdgeRight');
      const [ hitbox, count ] = probeArgs(character);

      // Act
      const result = character._pixelCheckLeftPassage(4.05, 4.05, 3.8, hitbox, count);

      // Assert
      expect(result).toBe(false);
    });

    it('refuses rightward passage when the entered subcell forbids being entered from the left', () =>
    {
      // Arrange
      const character = characterWithPaintedSubcell(5.0, 4.25, 'EdgeLeft');
      const [ hitbox, count ] = probeArgs(character);

      // Act
      const result = character._pixelCheckRightPassage(4.2, 4.2, 4.25, hitbox, count);

      // Assert
      expect(result).toBe(false);
    });

    it('refuses upward passage when the entered subcell forbids being entered from below', () =>
    {
      // Arrange
      const character = characterWithPaintedSubcell(4.25, 4.0, 'EdgeDown');
      const [ hitbox, count ] = probeArgs(character);

      // Act
      const result = character._pixelCheckUpPassage(4.05, 4.05, 3.8, hitbox, count);

      // Assert
      expect(result).toBe(false);
    });

    it('refuses downward passage when the entered subcell forbids being entered from above', () =>
    {
      // Arrange
      const character = characterWithPaintedSubcell(4.25, 5.0, 'EdgeUp');
      const [ hitbox, count ] = probeArgs(character);

      // Act
      const result = character._pixelCheckDownPassage(4.2, 4.2, 4.25, hitbox, count);

      // Assert
      expect(result).toBe(false);
    });

    it('permits a leftward lane transition across open ground', () =>
    {
      // Arrange: the lane checks pick their sample seam from the direction of travel, and the
      // leftward choice is a different seam than the rightward one.
      useMap(buildDirectionalPixelGameMap(10, 10));
      const character = makeCharacter(4, 4);
      const [ hitbox, count ] = probeArgs(character);

      // Act
      const result = character._pixelCheckVerticalAtNewXColumn(4.05, 3.3, 4.05, hitbox, count);

      // Assert
      expect(result).toBe(true);
    });

    it('permits an upward lane transition across open ground', () =>
    {
      // Arrange
      useMap(buildDirectionalPixelGameMap(10, 10));
      const character = makeCharacter(4, 4);
      const [ hitbox, count ] = probeArgs(character);

      // Act
      const result = character._pixelCheckHorizontalAtNewYRow(4.05, 3.3, 4.05, hitbox, count);

      // Assert
      expect(result).toBe(true);
    });
  });
  //endregion paired passage checks

  //region slide lane refusal
  describe('slide lane refusal', () =>
  {
    /**
     * The walker validates a substep three ways: the origin may exit, the destination may be
     * entered, and the newly entered lane leaves somewhere to slide. That third check only gets a
     * seam to inspect when a single substep carries the body clear past its own width, which needs
     * the coarsest subcell setting - at the default four-per-tile a substep is a quarter tile and
     * the body is over half a tile wide, so the lane never reports a crossing.
     *
     * The line codes are the other half of the trick: a vertical line is crossable horizontally
     * while blocking vertical travel, so it satisfies the first two checks and fails only the
     * lane check. That is precisely the shape it exists to describe.
     * @param {number} px The subcell x to paint.
     * @param {number} py The subcell y to paint.
     * @param {string} code The line code to paint.
     * @returns {Game_CharacterBase} A character on a coarse-subcell map.
     */
    function characterOnCoarseMapWithLine(px, py, code)
    {
      globalThis.J.PIXEL.Metadata.CollisionStepCount = 1;
      useMap(buildDirectionalPixelGameMap(12, 12));

      const character = makeCharacter(4, 4);
      const { Codes } = globalThis.PIXEL_CollisionManager;
      globalThis.PIXEL_CollisionManager._set(px, py, Codes[code]);

      return character;
    }

    it('refuses a rightward substep whose entered column has no open vertical lane', () =>
    {
      // Arrange
      const character = characterOnCoarseMapWithLine(5, 4, 'VerticalLine');

      // Act
      const result = character.canPassStraight(globalThis.J.PIXEL.Directions.RIGHT, 0.9);

      // Assert
      expect(result).toBe(false);
    });

    it('refuses a leftward substep whose entered column has no open vertical lane', () =>
    {
      // Arrange
      const character = characterOnCoarseMapWithLine(3, 4, 'VerticalLine');

      // Act
      const result = character.canPassStraight(globalThis.J.PIXEL.Directions.LEFT, 0.9);

      // Assert
      expect(result).toBe(false);
    });

    it('refuses a downward substep whose entered row has no open horizontal lane', () =>
    {
      // Arrange
      const character = characterOnCoarseMapWithLine(4, 5, 'HorizontalLine');

      // Act
      const result = character.canPassStraight(globalThis.J.PIXEL.Directions.DOWN, 0.9);

      // Assert
      expect(result).toBe(false);
    });

    it('refuses an upward substep whose entered row has no open horizontal lane', () =>
    {
      // Arrange
      const character = characterOnCoarseMapWithLine(4, 3, 'HorizontalLine');

      // Act
      const result = character.canPassStraight(globalThis.J.PIXEL.Directions.UP, 0.9);

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion slide lane refusal

  //region directional lane checks
  describe('one-way passage', () =>
  {
    it('refuses leftward travel out of a tile that forbids exiting left', () =>
    {
      // Arrange: a one-way tile the character may enter but not leave heading left.
      const { LEFT } = globalThis.J.PIXEL.Directions;
      useMap(buildDirectionalPixelGameMap(10, 10, new Set([ `4,4,${LEFT}` ])));
      const character = makeCharacter(4, 4);

      // Act
      const canPass = character.canPassStraight(LEFT, 0.5);

      // Assert
      expect(canPass).toBe(false);
    });

    it('refuses rightward travel out of a tile that forbids exiting right', () =>
    {
      // Arrange
      const { RIGHT } = globalThis.J.PIXEL.Directions;
      useMap(buildDirectionalPixelGameMap(10, 10, new Set([ `4,4,${RIGHT}` ])));
      const character = makeCharacter(4, 4);

      // Act
      const canPass = character.canPassStraight(RIGHT, 0.5);

      // Assert
      expect(canPass).toBe(false);
    });

    it('refuses upward travel out of a tile that forbids exiting up', () =>
    {
      // Arrange
      const { UP } = globalThis.J.PIXEL.Directions;
      useMap(buildDirectionalPixelGameMap(10, 10, new Set([ `4,4,${UP}` ])));
      const character = makeCharacter(4, 4);

      // Act
      const canPass = character.canPassStraight(UP, 0.5);

      // Assert
      expect(canPass).toBe(false);
    });

    it('refuses downward travel out of a tile that forbids exiting down', () =>
    {
      // Arrange
      const { DOWN } = globalThis.J.PIXEL.Directions;
      useMap(buildDirectionalPixelGameMap(10, 10, new Set([ `4,4,${DOWN}` ])));
      const character = makeCharacter(4, 4);

      // Act
      const canPass = character.canPassStraight(DOWN, 0.5);

      // Assert
      expect(canPass).toBe(false);
    });

    it('refuses entry into a tile that forbids being entered from the left', () =>
    {
      // Arrange: the destination tile blocks its own left edge while the origin permits exit,
      // so only the destination-side half of the paired check can catch this.
      const { LEFT, RIGHT } = globalThis.J.PIXEL.Directions;
      useMap(buildDirectionalPixelGameMap(10, 10, new Set([ `5,4,${LEFT}` ])));
      const character = makeCharacter(4.5, 4);

      // Act
      const canPass = character.canPassStraight(RIGHT, 0.5);

      // Assert
      expect(canPass).toBe(false);
    });

    it('refuses entry into a tile that forbids being entered from the right', () =>
    {
      // Arrange
      const { LEFT, RIGHT } = globalThis.J.PIXEL.Directions;
      useMap(buildDirectionalPixelGameMap(10, 10, new Set([ `3,4,${RIGHT}` ])));
      const character = makeCharacter(3.5, 4);

      // Act
      const canPass = character.canPassStraight(LEFT, 0.5);

      // Assert
      expect(canPass).toBe(false);
    });

    it('refuses entry into a tile that forbids being entered from above', () =>
    {
      // Arrange
      const { DOWN, UP } = globalThis.J.PIXEL.Directions;
      useMap(buildDirectionalPixelGameMap(10, 10, new Set([ `4,5,${UP}` ])));
      const character = makeCharacter(4, 4.5);

      // Act
      const canPass = character.canPassStraight(DOWN, 0.5);

      // Assert
      expect(canPass).toBe(false);
    });

    it('refuses entry into a tile that forbids being entered from below', () =>
    {
      // Arrange
      const { DOWN, UP } = globalThis.J.PIXEL.Directions;
      useMap(buildDirectionalPixelGameMap(10, 10, new Set([ `4,3,${DOWN}` ])));
      const character = makeCharacter(4, 3.5);

      // Act
      const canPass = character.canPassStraight(UP, 0.5);

      // Assert
      expect(canPass).toBe(false);
    });
  });
  //endregion directional lane checks
});
//endregion plugins/pixel/core/objects/game-character-base-diagonal-and-lanes.test.js