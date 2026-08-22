//region plugins/pixel/core/objects/game-player.test.js
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
 * Builds a real, wall-aware map so movement outcomes come from genuine tile geometry. A wall tile
 * cannot be exited in any direction, and no neighbor may enter it- the same per-edge semantics
 * vanilla `isPassable` carries.
 * @param {number} width The map width in tiles.
 * @param {number} height The map height in tiles.
 * @param {Set<string>} [wallTiles] Wall tiles keyed `"x,y"`.
 * @returns {object}
 */
function buildWalledPixelGameMap(width, height, wallTiles = new Set())
{
  const isWall = (x, y) => wallTiles.has(`${x},${y}`);

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

      return isWall(nx, ny) === false;
    },
    distance(x0, y0, x1, y1)
    {
      const dx = x0 - x1;
      const dy = y0 - y1;

      return Math.sqrt(dx * dx + dy * dy);
    },
    isDashDisabled()
    {
      return this._dashDisabled === true;
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
 * Pixel core's `Game_Player` input, dashing, vector-angle and follower-train behavior, driven
 * against real collision geometry rather than pre-decided booleans.
 */
describe('J-Pixelistics Game_Player (direct src import)', () =>
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
    await import('../../../../../src/plugins/pixel/core/objects/Game_Follower.js');
    await import('../../../../../src/plugins/pixel/core/objects/Game_Player.js');

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
   * Builds a player standing at the given tile with a clean follower roster.
   * @param {number} x The tile x.
   * @param {number} y The tile y.
   * @returns {Game_Player}
   */
  function makePlayer(x, y)
  {
    const player = new globalThis.Game_Player();
    player.initMembers();
    player.setMoveSpeed(4);
    player.relocate(x, y);

    // the follower train reads `$gamePlayer` directly as the character the lead follower
    // trails, so the player under test has to actually be the game's player.
    globalThis.$gamePlayer = player;

    return player;
  }

  /**
   * Builds a real `Game_Follower` with genuine movement primitives, so position changes,
   * breadcrumb records and move flags are all real. Only `pixelFaceCharacter` is recorded rather
   * than executed- its own facing logic has dedicated coverage and is not the subject here.
   * @param {number} x The tile x.
   * @param {number} y The tile y.
   * @returns {Game_Follower}
   */
  function makeFollower(x, y)
  {
    const follower = new globalThis.Game_Follower();
    follower.initMembers();
    follower.setMoveSpeed(4);
    follower.relocate(x, y);
    follower.facedCharacters = [];
    follower.pixelFaceCharacter = function(other)
    {
      this.facedCharacters.push(other);
    };

    return follower;
  }

  /**
   * Replaces the ambient gamepad source. Lives at this altitude because both the analog-angle
   * reader and the vector-movement path in `moveByInput` are driven through it, and because a
   * gamepad left connected by one test would otherwise silently steer the next one.
   * @param {Function|undefined} getGamepads The replacement reader, or undefined to remove it.
   */
  function useGamepadSource(getGamepads)
  {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: getGamepads === undefined
        ? {}
        : { getGamepads },
    });
  }

  beforeEach(() =>
  {
    useMap(buildWalledPixelGameMap(10, 10));
    useGamepadSource(() => []);
    globalThis.Input.dir8 = 0;
    globalThis.J.PIXEL.Metadata.VectorMovementEnabled = false;
    globalThis.$gameTemp = {
      _valid: false,
      _x: 0,
      _y: 0,
      isDestinationValid()
      {
        return this._valid;
      },
      clearDestination()
      {
        this._valid = false;
      },
      destinationX()
      {
        return this._x;
      },
      destinationY()
      {
        return this._y;
      },
    };
  });

  //region dir8ToAngle
  describe('dir8ToAngle', () =>
  {
    it.each([
      [ 'RIGHT', 0 ],
      [ 'LOWERRIGHT', 45 ],
      [ 'DOWN', 90 ],
      [ 'LOWERLEFT', 135 ],
      [ 'LEFT', 180 ],
      [ 'UPPERLEFT', 225 ],
      [ 'UP', 270 ],
      [ 'UPPERRIGHT', 315 ],
    ])('maps %s to %i degrees in the Y-down space', (dirKey, expected) =>
    {
      // Arrange
      const player = makePlayer(2, 2);

      // Act
      const angle = player.dir8ToAngle(globalThis.J.PIXEL.Directions[dirKey]);

      // Assert
      expect(angle)
        .toBe(expected);
    });

    it('falls back to zero degrees for a direction outside the 8-way set', () =>
    {
      // Arrange: dir8 never emits 5 (neutral), but the switch still needs a defined answer.
      const player = makePlayer(2, 2);

      // Act
      const angle = player.dir8ToAngle(5);

      // Assert
      expect(angle)
        .toBe(0);
    });
  });
  //endregion dir8ToAngle

  //region _readGamepadAnalogAngle
  describe('_readGamepadAnalogAngle', () =>
  {
    it('reports no angle when the Gamepad API is unavailable', () =>
    {
      // Arrange: not every environment the game runs in exposes the Gamepad API at all.
      useGamepadSource(undefined);
      const player = makePlayer(2, 2);

      // Act
      const angle = player._readGamepadAnalogAngle();

      // Assert
      expect(angle)
        .toBeNull();
    });

    it('reports no angle when the gamepad list itself is null', () =>
    {
      // Arrange
      useGamepadSource(() => null);
      const player = makePlayer(2, 2);

      // Act
      const angle = player._readGamepadAnalogAngle();

      // Assert
      expect(angle)
        .toBeNull();
    });

    it('reports no angle when no gamepads are connected', () =>
    {
      // Arrange
      useGamepadSource(() => []);
      const player = makePlayer(2, 2);

      // Act
      const angle = player._readGamepadAnalogAngle();

      // Assert
      expect(angle)
        .toBeNull();
    });

    it('skips empty slots in the gamepad list', () =>
    {
      // Arrange: the Gamepad API pads its array with nulls for unoccupied slots.
      useGamepadSource(() => [ null ]);
      const player = makePlayer(2, 2);

      // Act
      const angle = player._readGamepadAnalogAngle();

      // Assert
      expect(angle)
        .toBeNull();
    });

    it('skips a gamepad that is present but disconnected', () =>
    {
      // Arrange
      useGamepadSource(() => [ { connected: false, axes: [ 1, 0 ] } ]);
      const player = makePlayer(2, 2);

      // Act
      const angle = player._readGamepadAnalogAngle();

      // Assert
      expect(angle)
        .toBeNull();
    });

    it('ignores stick positions inside the dead zone', () =>
    {
      // Arrange: 0.1 magnitude is joystick drift, below the 0.15 circular dead zone.
      useGamepadSource(() => [ { connected: true, axes: [ 0.1, 0 ] } ]);
      const player = makePlayer(2, 2);

      // Act
      const angle = player._readGamepadAnalogAngle();

      // Assert
      expect(angle)
        .toBeNull();
    });

    it('reports the true stick angle once outside the dead zone', () =>
    {
      // Arrange: a full push right is 0 degrees in the RMMZ Y-down space.
      useGamepadSource(() => [ { connected: true, axes: [ 1, 0 ] } ]);
      const player = makePlayer(2, 2);

      // Act
      const angle = player._readGamepadAnalogAngle();

      // Assert
      expect(angle)
        .toBe(0);
    });

    it('preserves sub-45 degree precision the digital input layer would discard', () =>
    {
      // Arrange: this precision is the entire reason the Gamepad API is read directly instead
      // of going through Input.dir8, which quantizes to eight fixed directions.
      useGamepadSource(() => [ { connected: true, axes: [ 1, 1 ] } ]);
      const player = makePlayer(2, 2);

      // Act
      const angle = player._readGamepadAnalogAngle();

      // Assert
      expect(angle)
        .toBeCloseTo(45, 5);
    });
  });
  //endregion _readGamepadAnalogAngle

  //region getVectorInputAngle
  describe('getVectorInputAngle', () =>
  {
    it('reports no angle at all while vector movement is disabled', () =>
    {
      // Arrange
      globalThis.J.PIXEL.Metadata.VectorMovementEnabled = false;
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;
      const player = makePlayer(2, 2);

      // Act
      const angle = player.getVectorInputAngle();

      // Assert
      expect(angle)
        .toBeNull();
    });

    it('prefers the analog stick angle when one is available', () =>
    {
      // Arrange: the stick pushes down while the d-pad reads right; the stick must win.
      globalThis.J.PIXEL.Metadata.VectorMovementEnabled = true;
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {
          getGamepads()
          {
            return [ { connected: true, axes: [ 0, 1 ] } ];
          },
        },
      });
      const player = makePlayer(2, 2);

      // Act
      const angle = player.getVectorInputAngle();

      // Assert
      expect(angle)
        .toBe(90);
    });

    it('falls back to the digital direction when no stick is active', () =>
    {
      // Arrange
      globalThis.J.PIXEL.Metadata.VectorMovementEnabled = true;
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.LEFT;
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {
          getGamepads()
          {
            return [];
          },
        },
      });
      const player = makePlayer(2, 2);

      // Act
      const angle = player.getVectorInputAngle();

      // Assert
      expect(angle)
        .toBe(180);
    });

    it('reports no angle when there is no directional input at all', () =>
    {
      // Arrange
      globalThis.J.PIXEL.Metadata.VectorMovementEnabled = true;
      globalThis.Input.dir8 = 0;
      Object.defineProperty(globalThis, 'navigator', {
        configurable: true,
        value: {
          getGamepads()
          {
            return [];
          },
        },
      });
      const player = makePlayer(2, 2);

      // Act
      const angle = player.getVectorInputAngle();

      // Assert
      expect(angle)
        .toBeNull();
    });
  });
  //endregion getVectorInputAngle

  //region updateDashing
  describe('updateDashing', () =>
  {
    it('leaves dash state untouched while drifting without a held button', () =>
    {
      // Arrange: movement not driven by the player's own input must not flip dash state,
      // otherwise scripted or residual motion would toggle the dash animation.
      const player = makePlayer(2, 2);
      player.setRealX(1.5);
      player.setMovePressed(false);
      player._dashing = true;

      // Act
      player.updateDashing();

      // Assert
      expect(player._dashing)
        .toBe(true);
    });

    // The three refusals below each disable one of the eligibility conditions. Every one of them
    // holds the dash button down while doing it, and that is what makes them mean anything: the
    // permitted branch sets dash from the button, so with the button *up* it also lands on false
    // and the two arms of the check become indistinguishable. Holding it makes the branches
    // disagree, so a `false` here proves this condition refused rather than merely that no dash
    // input arrived.
    it('stops dashing when the player cannot move at all', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      player._canMove = false;
      player._dashButtonPressed = true;
      player._dashing = true;

      // Act
      player.updateDashing();

      // Assert
      expect(player._dashing)
        .toBe(false);
    });

    it('stops dashing while riding a vehicle', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      player._vehicleType = 'boat';
      player._dashButtonPressed = true;
      player._dashing = true;

      // Act
      player.updateDashing();

      // Assert
      expect(player._dashing)
        .toBe(false);
    });

    it('stops dashing on a map that forbids dashing', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      globalThis.$gameMap._dashDisabled = true;
      player._dashButtonPressed = true;
      player._dashing = true;

      // Act
      player.updateDashing();

      // Assert
      expect(player._dashing)
        .toBe(false);
    });

    it('dashes while the dash button is held', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      player._dashButtonPressed = true;

      // Act
      player.updateDashing();

      // Assert
      expect(player._dashing)
        .toBe(true);
    });

    it('dashes while pathing toward a clicked destination', () =>
    {
      // Arrange: click-to-move implies dashing, matching vanilla's own behavior.
      const player = makePlayer(2, 2);
      globalThis.$gameTemp._valid = true;

      // Act
      player.updateDashing();

      // Assert
      expect(player._dashing)
        .toBe(true);
    });

    it('does not dash while standing still with no dash input', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);

      // Act
      player.updateDashing();

      // Assert
      expect(player._dashing)
        .toBe(false);
    });
  });
  //endregion updateDashing

  //region moveByInput
  describe('moveByInput', () =>
  {
    it('releases the move flag when the player cannot move', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      player._canMove = false;
      player.setMovePressed(true);

      // Act
      player.moveByInput();

      // Assert
      expect(player.isMovePressed())
        .toBe(false);
    });

    it('releases the move flag when no input and no destination exist', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      player.setMovePressed(true);

      // Act
      player.moveByInput();

      // Assert
      expect(player.isMovePressed())
        .toBe(false);
    });

    it('refuses a pressed direction outright while the player cannot move', () =>
    {
      // Arrange: the sibling case for this branch presses nothing, so the fall-through and the
      // refusal land on the same released flag and cannot be told apart. With a direction held,
      // the movement lock is the only thing standing between the player and a step - which is
      // what it is for, since a running event must not be walked out from under.
      const player = makePlayer(2, 2);
      player._canMove = false;
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert
      expect(player.x)
        .toBe(2);
    });

    it('refuses a pressed direction while drifting with the button released', () =>
    {
      // Arrange: mid-slide with nothing held is residual motion rather than a fresh command.
      // Acting on it would keep walking the player after they let go of the direction.
      const player = makePlayer(2, 2);
      player.setRealX(1.9);
      player.setMovePressed(false);
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert
      expect(player.x)
        .toBe(2);
    });

    it('moves the player along the pressed direction', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert
      expect(player.x)
        .toBeGreaterThan(2);
    });

    it('faces the direction it successfully moved in', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert
      expect(player.direction())
        .toBe(globalThis.J.PIXEL.Directions.RIGHT);
    });

    it('holds the move flag while a step succeeds', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert
      expect(player.isMovePressed())
        .toBe(true);
    });

    it('releases the move flag when the step is blocked by a wall', () =>
    {
      // Arrange: one frame only advances 0.0625 tiles, so the player has to already be flush
      // against the wall for the step to be refused. With a 0.5 x-pivot and a 0.3 radius the
      // body's right edge sits at x + 0.8, putting x = 2.2 exactly on the tile-3 seam.
      useMap(buildWalledPixelGameMap(10, 10, new Set([ '3,2' ])));
      const player = makePlayer(2.2, 2);
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert
      expect(player.isMovePressed())
        .toBe(false);
    });

    it('keeps accepting input while already moving with the button held', () =>
    {
      // Arrange: mid-slide the player is "moving", so only the held-button half of the gate
      // keeps input flowing; without it, held movement would stutter every other frame.
      const player = makePlayer(2, 2);
      player.setRealX(1.9);
      player.setMovePressed(true);
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert
      expect(player.x)
        .toBeGreaterThan(2);
    });

    it('preserves follower breadcrumbs while the button stays held', () =>
    {
      // Arrange: the trail is only reset on a fresh press; wiping it mid-hold would make the
      // followers jump rather than trail.
      const player = makePlayer(2, 2);
      const follower = makeFollower(1, 2);
      follower.recordPixelPosition();
      player._followers = { _data: [ follower ] };
      player.setMovePressed(true);
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert: the seeded record survived alongside the one taken this frame.
      expect(follower.positionalRecords().length)
        .toBe(2);
    });

    it('resets follower breadcrumbs when input begins from a standstill', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      const follower = makeFollower(1, 2);
      follower.recordPixelPosition();
      player._followers = { _data: [ follower ] };
      player.setMovePressed(false);
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert: the seeded record was dropped, leaving only the one taken this frame- the
      // held-button case above keeps both, which is the difference this branch controls.
      expect(follower.positionalRecords().length)
        .toBe(1);
    });

    it('clears stale breadcrumbs when input begins from a standstill', () =>
    {
      // Arrange: a fresh press must not drag followers along a trail recorded before the
      // player stopped, which would teleport them across whatever happened in between.
      const player = makePlayer(2, 2);
      player.recordPixelPosition();
      player.setMovePressed(false);
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert: the only record present is the one this frame's movement recorded.
      expect(player.positionalRecords().length)
        .toBe(1);
    });

    it('moves by vector angle when vector movement is active', () =>
    {
      // Arrange
      globalThis.J.PIXEL.Metadata.VectorMovementEnabled = true;
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;
      const player = makePlayer(2, 2);

      // Act
      player.moveByInput();

      // Assert
      expect(player.x)
        .toBeGreaterThan(2);
    });

    it('holds the move flag while a vector step succeeds', () =>
    {
      // Arrange
      globalThis.J.PIXEL.Metadata.VectorMovementEnabled = true;
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;
      const player = makePlayer(2, 2);

      // Act
      player.moveByInput();

      // Assert
      expect(player.isMovePressed())
        .toBe(true);
    });

    it('releases the move flag when a vector step is blocked', () =>
    {
      // Arrange
      globalThis.J.PIXEL.Metadata.VectorMovementEnabled = true;
      useMap(buildWalledPixelGameMap(10, 10, new Set([ '3,2' ])));
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;
      const player = makePlayer(2.2, 2);

      // Act
      player.moveByInput();

      // Assert
      expect(player.isMovePressed())
        .toBe(false);
    });

    it('travels at the analog angle rather than the cardinal the d-pad would report', () =>
    {
      // Arrange: the stick is pushed right and slightly down, which the digital layer quantizes
      // to a flat rightward step. Sub-cardinal precision is the entire reason the vector branch
      // exists, so the y displacement is what proves the analog angle was the one obeyed.
      globalThis.J.PIXEL.Metadata.VectorMovementEnabled = true;
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;
      useGamepadSource(() => [ { connected: true, axes: [ 1, 0.5 ] } ]);
      const player = makePlayer(2, 2);

      // Act
      player.moveByInput();

      // Assert
      expect(player.y)
        .toBeGreaterThan(2);
    });

    it('clears a pending click destination once a direction is pressed', () =>
    {
      // Arrange: pressing a direction is an explicit override of click-to-move.
      const player = makePlayer(2, 2);
      globalThis.$gameTemp._valid = true;
      globalThis.Input.dir8 = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert
      expect(globalThis.$gameTemp.isDestinationValid())
        .toBe(false);
    });

    it('paths toward a pending destination when no direction is pressed', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      globalThis.$gameTemp._valid = true;
      globalThis.$gameTemp._x = 5;
      globalThis.$gameTemp._y = 2;
      player._forcedPathDirection = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert
      expect(player.x)
        .toBeGreaterThan(2);
    });

    it('does not path toward a destination that has been invalidated', () =>
    {
      // Arrange: $gameTemp keeps the last clicked coordinates around after the destination is
      // cleared, so a route is still derivable from them. Only the validity flag says whether
      // anyone actually asked to go there, and pathing anyway would drag the player off on a
      // journey nobody ordered.
      const player = makePlayer(2, 2);
      globalThis.$gameTemp._valid = false;
      globalThis.$gameTemp._x = 5;
      globalThis.$gameTemp._y = 2;
      player._forcedPathDirection = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.moveByInput();

      // Assert
      expect(player.x)
        .toBe(2);
    });
  });
  //endregion moveByInput

  //region pixelMoveTowardDestination
  describe('pixelMoveTowardDestination', () =>
  {
    it('clears the destination upon arriving at the target tile', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      globalThis.$gameTemp._valid = true;
      globalThis.$gameTemp._x = 2;
      globalThis.$gameTemp._y = 2;

      // Act
      player.pixelMoveTowardDestination();

      // Assert
      expect(globalThis.$gameTemp.isDestinationValid())
        .toBe(false);
    });

    it.each([
      [ 'the same column but a different row', 2, 5, 'DOWN' ],
      [ 'the same row but a different column', 5, 2, 'RIGHT' ],
    ])('keeps pathing toward a destination on %s', (_label, destX, destY, dirKey) =>
    {
      // Arrange: arrival is both coordinates matching, and the case above matches both at once -
      // so either half could be forced true and the other would still report arrival. A
      // destination sharing one axis with the player is the ordinary mid-journey state of any
      // click-to-move path, and calling that arrival would abandon the route halfway.
      // A path direction has to be supplied, or the separate no-route-available branch gives up
      // and clears the destination for its own reasons, which would mask the arrival check.
      const player = makePlayer(2, 2);
      globalThis.$gameTemp._valid = true;
      globalThis.$gameTemp._x = destX;
      globalThis.$gameTemp._y = destY;
      player._forcedPathDirection = globalThis.J.PIXEL.Directions[ dirKey ];

      // Act
      player.pixelMoveTowardDestination();

      // Assert
      expect(globalThis.$gameTemp.isDestinationValid())
        .toBe(true);
    });

    it('counts arrival by the tile the player rounds onto, not an exact coordinate match', () =>
    {
      // Arrange: pixel movement almost never parks a character on an integer coordinate, so
      // arrival has to be judged against the rounded tile or a click-to-move route would never
      // finish. A route direction is supplied deliberately - without one the no-route branch
      // would clear the destination for its own reasons and hide what is under test.
      const player = makePlayer(2.4, 2);
      globalThis.$gameTemp._valid = true;
      globalThis.$gameTemp._x = 2;
      globalThis.$gameTemp._y = 2;
      player._forcedPathDirection = globalThis.J.PIXEL.Directions.LEFT;

      // Act
      player.pixelMoveTowardDestination();

      // Assert: arriving stops the journey where it stands rather than stepping again.
      expect(globalThis.$gameTemp.isDestinationValid())
        .toBe(false);
      expect(player.x)
        .toBe(2.4);
    });

    it('releases the move flag upon arrival', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      player.setMovePressed(true);
      globalThis.$gameTemp._valid = true;
      globalThis.$gameTemp._x = 2;
      globalThis.$gameTemp._y = 2;

      // Act
      player.pixelMoveTowardDestination();

      // Assert
      expect(player.isMovePressed())
        .toBe(false);
    });

    it('gives up and clears the destination when no route exists', () =>
    {
      // Arrange: a zero direction is how the pathfinder reports an unreachable destination.
      const player = makePlayer(2, 2);
      globalThis.$gameTemp._valid = true;
      globalThis.$gameTemp._x = 8;
      globalThis.$gameTemp._y = 8;
      player._forcedPathDirection = 0;

      // Act
      player.pixelMoveTowardDestination();

      // Assert
      expect(globalThis.$gameTemp.isDestinationValid())
        .toBe(false);
    });

    it('steps in the direction the pathfinder returned', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      globalThis.$gameTemp._valid = true;
      globalThis.$gameTemp._x = 5;
      globalThis.$gameTemp._y = 2;
      player._forcedPathDirection = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.pixelMoveTowardDestination();

      // Assert
      expect(player.x)
        .toBeGreaterThan(2);
    });

    it('faces the direction of travel while pathing', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      globalThis.$gameTemp._valid = true;
      globalThis.$gameTemp._x = 5;
      globalThis.$gameTemp._y = 2;
      player._forcedPathDirection = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.pixelMoveTowardDestination();

      // Assert
      expect(player.direction())
        .toBe(globalThis.J.PIXEL.Directions.RIGHT);
    });

    it('holds the move flag while a pathed step succeeds', () =>
    {
      // Arrange: the flag is what keeps the follower train walking, so a successful step toward
      // a clicked destination has to raise it just as a held direction would.
      const player = makePlayer(2, 2);
      player.setMovePressed(false);
      globalThis.$gameTemp._valid = true;
      globalThis.$gameTemp._x = 5;
      globalThis.$gameTemp._y = 2;
      player._forcedPathDirection = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.pixelMoveTowardDestination();

      // Assert
      expect(player.isMovePressed())
        .toBe(true);
    });

    it('releases the move flag when the pathed step is blocked', () =>
    {
      // Arrange
      useMap(buildWalledPixelGameMap(10, 10, new Set([ '3,2' ])));
      const player = makePlayer(2.2, 2);
      player.setMovePressed(true);
      globalThis.$gameTemp._valid = true;
      globalThis.$gameTemp._x = 5;
      globalThis.$gameTemp._y = 2;
      player._forcedPathDirection = globalThis.J.PIXEL.Directions.RIGHT;

      // Act
      player.pixelMoveTowardDestination();

      // Assert
      expect(player.isMovePressed())
        .toBe(false);
    });
  });
  //endregion pixelMoveTowardDestination

  //region onStep
  describe('onStep', () =>
  {
    it('counts the step against the player step tally', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);

      // Act
      player.onStep();

      // Assert
      expect(player._steps)
        .toBe(1);
    });
  });
  //endregion onStep

  //region follower train
  describe('processFollowersPixelMoving', () =>
  {
    it('walks the lead follower onto the player breadcrumb trail', () =>
    {
      // Arrange: the player lays down a breadcrumb, then moves away from it.
      const player = makePlayer(2, 2);
      const follower = makeFollower(9, 9);
      player._followers = { _data: [ follower ] };
      player.recordPixelPosition();
      player.relocate(4, 2);

      // Act
      player.processFollowersPixelMoving();

      // Assert: the follower snapped onto the oldest recorded player position.
      expect(follower.x)
        .toBe(2);
    });

    it('flags the moved follower as actively pixel-moving', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      const follower = makeFollower(9, 9);
      player._followers = { _data: [ follower ] };
      player.recordPixelPosition();

      // Act
      player.processFollowersPixelMoving();

      // Assert
      expect(follower.isMovePressed())
        .toBe(true);
    });

    it('faces the lead follower at the player', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      const follower = makeFollower(9, 9);
      player._followers = { _data: [ follower ] };
      globalThis.$gamePlayer = player;

      // Act
      player.processFollowersPixelMoving();

      // Assert
      expect(follower.facedCharacters)
        .toContain(player);
    });

    it('chains each follower onto the one ahead of it rather than onto the player', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      const lead = makeFollower(9, 9);
      const trailing = makeFollower(9, 9);
      player._followers = { _data: [ lead, trailing ] };
      globalThis.$gamePlayer = player;

      // Act
      player.processFollowersPixelMoving();

      // Assert
      expect(trailing.facedCharacters)
        .toContain(lead);
    });

    it('leaves a follower put when the character ahead of it laid down no trail', () =>
    {
      // Arrange: a suspended follower is skipped before it ever records a breadcrumb, so the
      // follower behind it is trailing a character with an empty history. There is nowhere to
      // walk to, and the only correct answer is to stand still.
      const player = makePlayer(2, 2);
      const lead = makeFollower(9, 9);
      const trailing = makeFollower(8, 8);
      lead.isPixelTrainSuspended = () => true;
      player._followers = { _data: [ lead, trailing ] };

      // Act
      player.processFollowersPixelMoving();

      // Assert
      expect(trailing.x)
        .toBe(8);
    });

    it('leaves a follower alone once another system has claimed it', () =>
    {
      // Arrange: relocating a follower that something else is already steering would make the
      // two fight over the sprite every frame, so the train stands down entirely.
      const player = makePlayer(2, 2);
      const follower = makeFollower(9, 9);
      follower.isPixelTrainSuspended = () => true;
      player._followers = { _data: [ follower ] };
      player.recordPixelPosition();

      // Act
      player.processFollowersPixelMoving();

      // Assert
      expect(follower.x)
        .toBe(9);
    });
  });

  describe('stopFollowersPixelMoving', () =>
  {
    it('halts a follower so it does not drift after the player stops', () =>
    {
      // Arrange
      const player = makePlayer(2, 2);
      const follower = makeFollower(3, 2);
      follower.setMovePressed(true);
      player._followers = { _data: [ follower ] };

      // Act
      player.stopFollowersPixelMoving();

      // Assert
      expect(follower.isMovePressed())
        .toBe(false);
    });

    it('does not halt a follower another system has claimed', () =>
    {
      // Arrange: the claiming system decides when that follower stops, not the train.
      const player = makePlayer(2, 2);
      const follower = makeFollower(3, 2);
      follower.setMovePressed(true);
      follower.isPixelTrainSuspended = () => true;
      player._followers = { _data: [ follower ] };

      // Act
      player.stopFollowersPixelMoving();

      // Assert
      expect(follower.isMovePressed())
        .toBe(true);
    });
  });
  //endregion follower train

  //region collision pivot
  describe('getCollisionPivotY', () =>
  {
    it('anchors the player collision center near the feet rather than the tile center', () =>
    {
      // Arrange: the feet anchor is what gives the top-down view its depth feel, letting the
      // player slide closer to objects from below than from above.
      const player = makePlayer(2, 2);

      // Act
      const pivot = player.getCollisionPivotY();

      // Assert
      expect(pivot)
        .toBe(0.70);
    });
  });
  //endregion collision pivot
});
//endregion plugins/pixel/core/objects/game-player.test.js