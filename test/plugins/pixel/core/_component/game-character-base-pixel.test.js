//region plugins/pixel/core/_component/game-character-base-pixel.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildDefaultPixelGameMap,
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

describe('J-Pixelistics Game_CharacterBase pixel movement helpers (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // patches globalThis.Game_CharacterBase.prototype with isStraightDirection/isDiagonalDirection,
    // which pixel core's own Game_CharacterBase.js relies on.
    await import('../../../../../src/plugins/_base/core/objects/Game_CharacterBase.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    // patches globalThis.Game_CharacterBase.prototype directly, no vm involved.
    await import('../../../../../src/plugins/pixel/core/objects/Game_CharacterBase.js');

    ({ default: globalThis.PIXEL_CollisionManager } = await import('../../../../../src/plugins/pixel/core/managers/PIXEL_CollisionManager.js'));
  });

  beforeEach(() =>
  {
    // a fresh $gameMap every test- some tests replace it outright (regionId) or override a single
    // method (movePixelDistance's isPassable override), and neither should leak into the next test.
    globalThis.$gameMap = buildDefaultPixelGameMap();
    globalThis.PIXEL_CollisionManager.initConfig();
    globalThis.PIXEL_CollisionManager.setupCollision();
  });

  it('initMembers wires up the _j._pixel step counter', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();

    // Act
    ch.initMembers();

    // Assert
    expect(ch._j._pixel._steps).toBe(0);
  });

  it('initMembers wires up the pixel move cooldown state', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();

    // Act
    ch.initMembers();

    // Assert
    expect(ch._pixelState()._moveCooldown).toBe(0);
  });

  it('setPixelMoveCooldown flags the character as on cooldown', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();

    // Act
    ch.setPixelMoveCooldown(2);

    // Assert
    expect(ch.isPixelOnCooldown()).toBe(true);
  });

  it('reports no cooldown once the last frame of it has ticked away', () =>
  {
    // Arrange: one frame of cooldown, so the decrement below lands exactly on the boundary
    // between "still waiting" and "free to move" rather than somewhere comfortably past it.
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.setPixelMoveCooldown(1);

    // Act
    ch.decrementPixelMoveCooldown();

    // Assert
    expect(ch.isPixelOnCooldown()).toBe(false);
  });

  it('decrementPixelMoveCooldown reduces the remaining cooldown by one', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.setPixelMoveCooldown(2);

    // Act
    ch.decrementPixelMoveCooldown();

    // Assert
    expect(ch.getPixelMoveCooldown()).toBe(1);
  });

  it('movePixelDistance advances logical X on an open map', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.relocate(0.5, 0.5);

    // Act
    ch.movePixelDistance(globalThis.J.PIXEL.Directions.RIGHT, 0.1);

    // Assert
    expect(ch._x).toBeGreaterThan(0.5);
  });

  it('movePixelDistance reverts when overlapping solid subcells', () =>
  {
    // Arrange
    globalThis.$gameMap.isPassable = function()
    {
      return false;
    };
    globalThis.PIXEL_CollisionManager.setupCollision();
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.relocate(0.5, 0.5);
    const before = ch._x;

    // Act
    ch.movePixelDistance(globalThis.J.PIXEL.Directions.RIGHT, 0.2);

    // Assert
    expect(ch._x).toBe(before);
  });

  it.each([
    [ 'through', ch => ch.setThrough(true) ],
    [ 'debug-through', ch =>
    {
      ch.isDebugThrough = () => true;
    } ],
  ])('movePixelDistance keeps a %s move that lands on solid ground', (_label, enablePassage) =>
  {
    // Arrange: the post-move revert exists to undo a step that ended up inside terrain, and both
    // passage flags are meant to bypass it - that is what walking through walls means. The revert
    // case above leaves both flags off, so neither could be forced on without the outcome staying
    // identical, and a revert that ignored them would strand a debugging playtester the instant
    // they tried to walk into anything.
    globalThis.$gameMap.isPassable = function()
    {
      return false;
    };
    globalThis.PIXEL_CollisionManager.setupCollision();
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.relocate(0.5, 0.5);
    enablePassage(ch);
    const before = ch._x;

    // Act
    ch.movePixelDistance(globalThis.J.PIXEL.Directions.RIGHT, 0.2);

    // Assert
    expect(ch._x).toBeGreaterThan(before);
  });

  it('stopPixelMoving syncs _realX/_realY to the logical tile position', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch._x = 1.25;
    ch._y = 0.75;
    ch._realX = 9;
    ch._realY = 8;

    // Act
    ch.stopPixelMoving();

    // Assert
    expect(ch._realX).toBe(1.25);
    expect(ch._realY).toBe(0.75);
  });

  it('regionId samples the collision pivot tile when _x/_y are fractional', () =>
  {
    // Arrange
    let capturedX = -1;
    let capturedY = -1;
    globalThis.$gameMap = {
      regionId(x, y)
      {
        capturedX = x;
        capturedY = y;
        return 1;
      },
    };
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch._x = 10.5356952975542;
    ch._y = 7.857090246365618;

    // Act
    const result = ch.regionId();

    // Assert
    expect(result).toBe(1);
    expect(capturedX).toBe(11);
    expect(capturedY).toBe(8);
  });

  it('recordPixelPosition appends fractional points when distance warrants', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch._x = 0;
    ch._y = 0;
    ch.recordPixelPosition();
    ch._x = 0.2;
    ch._y = 0;

    // Act
    ch.recordPixelPosition();

    // Assert
    expect(ch.positionalRecords().length).toBe(2);
  });

  it('update ticks down the pixel move cooldown after the engine hook', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.setPixelMoveCooldown(1);

    // Act
    ch.update();

    // Assert
    expect(ch.getPixelMoveCooldown()).toBe(0);
  });

  describe('initPixelMovementMembers', () =>
  {
    it('seeds all pixel-namespace fields with their default sentinels', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();

      // Act
      ch.initMembers();

      // Assert
      expect(ch._j._pixel).toEqual({
        _positionalRecords: [],
        _movePressing: false,
        _moveDistance: 0,
        _steps: 0,
        _moveCooldown: 0,
        _repeatMoveActive: false,
        _repeatMoveCount: 0,
        _movedThisFrame: false,
        _mrDir: 0,
        _mrFrames: 0,
      });
    });

    it('never overwrites pre-existing values on a loaded save', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch._j._pixel._steps = 42;

      // Act
      ch.initPixelMovementMembers();

      // Assert
      expect(ch._j._pixel._steps).toBe(42);
    });
  });

  it('_pixelState returns the namespace seeded by initMembers', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();

    // Act
    const state = ch._pixelState();

    // Assert
    expect(state).toBe(ch._j._pixel);
  });

  describe('repeat-move route state', () =>
  {
    it('isRepeatMoveActive is false before begin is called', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act & Assert
      expect(ch.isRepeatMoveActive()).toBe(false);
    });

    it('beginRepeatMove flags the repeat as active', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.beginRepeatMove();

      // Assert
      expect(ch.isRepeatMoveActive()).toBe(true);
    });

    it('stopRepeatMove clears the active flag', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.beginRepeatMove();

      // Act
      ch.stopRepeatMove();

      // Assert
      expect(ch.isRepeatMoveActive()).toBe(false);
    });

    it('setRepeatMoveCount assigns the given count', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.setRepeatMoveCount(3);

      // Assert
      expect(ch.getRepeatMoveCount()).toBe(3);
    });

    it('decrementRepeatMoveCount reduces a positive count by one', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.setRepeatMoveCount(2);

      // Act
      ch.decrementRepeatMoveCount();

      // Assert
      expect(ch.getRepeatMoveCount()).toBe(1);
    });

    it('decrementRepeatMoveCount is a no-op once the count reaches zero', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.decrementRepeatMoveCount();

      // Assert
      expect(ch.getRepeatMoveCount()).toBe(0);
    });

    it('pixelRepeatCountForRoute covers exactly one tile at the current speed', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.setMoveSpeed(4);

      // Act
      const count = ch.pixelRepeatCountForRoute();

      // Assert
      expect(count).toBe(Math.ceil(1.0 / ch.distancePerFrame()));
    });
  });

  it('decrementPixelMoveCooldown is a no-op once the cooldown reaches zero', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();

    // Act
    ch.decrementPixelMoveCooldown();

    // Assert
    expect(ch.getPixelMoveCooldown()).toBe(0);
  });

  describe('per-frame movement flag', () =>
  {
    it('setMovedThisFrame defaults to true when called with no argument', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.setMovedThisFrame();

      // Assert
      expect(ch.didMoveThisFrame()).toBe(true);
    });

    it('clearMovedThisFrame resets the flag to false', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.setMovedThisFrame(true);

      // Act
      ch.clearMovedThisFrame();

      // Assert
      expect(ch.didMoveThisFrame()).toBe(false);
    });
  });

  describe('micro-route caching', () =>
  {
    it('setMicroRouteDirection assigns the cached direction', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.setMicroRouteDirection(globalThis.J.PIXEL.Directions.UP);

      // Assert
      expect(ch.getMicroRouteDirection()).toBe(globalThis.J.PIXEL.Directions.UP);
    });

    it('setMicroRouteFrames assigns the remaining frame count', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.setMicroRouteFrames(3);

      // Assert
      expect(ch.getMicroRouteFrames()).toBe(3);
    });

    it('decrementMicroRouteFrames reduces a positive count by one', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.setMicroRouteFrames(2);

      // Act
      ch.decrementMicroRouteFrames();

      // Assert
      expect(ch.getMicroRouteFrames()).toBe(1);
    });

    it('decrementMicroRouteFrames is a no-op once frames reach zero', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.decrementMicroRouteFrames();

      // Assert
      expect(ch.getMicroRouteFrames()).toBe(0);
    });

    it('clearMicroRoute resets both the direction and remaining frames', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.setMicroRouteDirection(globalThis.J.PIXEL.Directions.LEFT);
      ch.setMicroRouteFrames(5);

      // Act
      ch.clearMicroRoute();

      // Assert
      expect(ch.getMicroRouteDirection()).toBe(0);
      expect(ch.getMicroRouteFrames()).toBe(0);
    });

    it('isMicroRouting is true while frames remain', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.setMicroRouteFrames(1);

      // Act & Assert
      expect(ch.isMicroRouting()).toBe(true);
    });

    it('isMicroRouting is false once frames are exhausted', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act & Assert
      expect(ch.isMicroRouting()).toBe(false);
    });
  });

  describe('positional record tracking', () =>
  {
    it('oldestPositionalRecord returns null when no records exist', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act & Assert
      expect(ch.oldestPositionalRecord()).toBeNull();
    });

    it('mostRecentPositionalRecord returns null when no records exist', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act & Assert
      expect(ch.mostRecentPositionalRecord()).toBeNull();
    });

    it('addPositionalRecord returns the first-added point from oldestPositionalRecord', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.addPositionalRecord({ x: 1, y: 1 });
      ch.addPositionalRecord({ x: 2, y: 2 });

      // Act & Assert
      expect(ch.oldestPositionalRecord()).toEqual({ x: 1, y: 1 });
      expect(ch.mostRecentPositionalRecord()).toEqual({ x: 2, y: 2 });
    });

    it('addPositionalRecord caps the collection at ten entries, dropping the oldest', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      for (let i = 0; i < 12; i++)
      {
        ch.addPositionalRecord({ x: i, y: i });
      }

      // Assert
      expect(ch.positionalRecords().length).toBe(10);
      expect(ch.oldestPositionalRecord()).toEqual({ x: 2, y: 2 });
    });

    it('clearPositionalRecords empties the collection', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.addPositionalRecord({ x: 1, y: 1 });

      // Act
      ch.clearPositionalRecords();

      // Assert
      expect(ch.positionalRecords()).toEqual([]);
    });

    it('recordPixelPosition flushes the cache when the character teleports, without re-seeding it', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch._x = 0;
      ch._y = 0;
      ch.recordPixelPosition();
      ch._x = 5;
      ch._y = 5;

      // Act
      ch.recordPixelPosition();

      // Assert
      expect(ch.positionalRecords().length).toBe(0);
      expect(ch.mostRecentPositionalRecord()).toBeNull();
    });

    it('recordPixelPosition skips recording when the movement is below the threshold', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch._x = 0;
      ch._y = 0;
      ch.recordPixelPosition();

      // Act
      ch._x = 0.05;
      ch.recordPixelPosition();

      // Assert
      expect(ch.positionalRecords().length).toBe(1);
    });
  });

  describe('update engine-alias override', () =>
  {
    it('does not snap render coordinates when they already match the logical position', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch._x = 1;
      ch._y = 1;
      ch._realX = 1;
      ch._realY = 1;

      // Act
      ch.update();

      // Assert
      expect(ch._realX).toBe(1);
      expect(ch._realY).toBe(1);
    });

    it('does not snap render coordinates while the character is jumping', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch._x = 2;
      ch._y = 2;
      ch._realX = 0;
      ch._realY = 0;
      ch._jumpCount = 5;

      // Act
      ch.update();

      // Assert
      expect(ch._realX).toBe(0);
      expect(ch._realY).toBe(0);
    });

    it('snaps render coordinates to the logical position when not jumping', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch._x = 2;
      ch._y = 2;
      ch._realX = 0;
      ch._realY = 0;

      // Act
      ch.update();

      // Assert
      expect(ch._realX).toBe(2);
      expect(ch._realY).toBe(2);
    });

    it.each([
      [ 'horizontal', 2, 0, 1, 1 ],
      [ 'vertical', 1, 1, 2, 0 ],
    ])('snaps render coordinates when only the %s axis has drifted', (_label, x, realX, y, realY) =>
    {
      // Arrange: the snapping case above drifts both axes at once, so either half of the
      // desync test could be forced false and the other half would still fire the snap. Real
      // drift is per-axis - a character that moved only horizontally has a matching y - and a
      // check that had lost one of its halves would leave that axis rendering at a stale
      // coordinate while the logical position moved on without it.
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch._x = x;
      ch._y = y;
      ch._realX = realX;
      ch._realY = realY;

      // Act
      ch.update();

      // Assert
      expect(ch._realX).toBe(x);
      expect(ch._realY).toBe(y);
    });

    it('clears the moved-this-frame flag after engine logic has run', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.setMovedThisFrame(true);

      // Act
      ch.update();

      // Assert
      expect(ch.didMoveThisFrame()).toBe(false);
    });
  });

  describe('move distance and pixel-step counters', () =>
  {
    it('modMoveDistance accumulates onto the existing distance', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.modMoveDistance(0.3);

      // Act
      ch.modMoveDistance(0.2);

      // Assert
      expect(ch.moveDistance()).toBeCloseTo(0.5);
    });

    it('clearMoveDistance resets the accumulator to zero', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.modMoveDistance(0.5);

      // Act
      ch.clearMoveDistance();

      // Assert
      expect(ch.moveDistance()).toBe(0);
    });

    it('takePixelSteps defaults to incrementing by one', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.takePixelSteps();

      // Assert
      expect(ch.pixelSteps()).toBe(1);
    });

    it('takePixelSteps accepts an explicit step count', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.takePixelSteps(4);

      // Assert
      expect(ch.pixelSteps()).toBe(4);
    });

    it('clearPixelSteps resets the step counter to zero', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.takePixelSteps(4);

      // Act
      ch.clearPixelSteps();

      // Assert
      expect(ch.pixelSteps()).toBe(0);
    });

    it('onStep takes exactly one pixel step', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.onStep();

      // Assert
      expect(ch.pixelSteps()).toBe(1);
    });

    it('stepDistance always considers one full tile a step', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act & Assert
      expect(ch.stepDistance()).toBe(1.0);
    });

    it('updatePixelStepping takes a step and resets distance once the threshold is crossed', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.modMoveDistance(1.0);

      // Act
      ch.updatePixelStepping();

      // Assert
      expect(ch.pixelSteps()).toBe(1);
      expect(ch.moveDistance()).toBe(0);
    });

    it('updatePixelStepping does nothing while below the step threshold', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.modMoveDistance(0.5);

      // Act
      ch.updatePixelStepping();

      // Assert
      expect(ch.pixelSteps()).toBe(0);
      expect(ch.moveDistance()).toBeCloseTo(0.5);
    });
  });

  describe('isMoving engine-alias override', () =>
  {
    it('is true when the engine considers the character mid-tween', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch._realX = 0;
      ch._x = 1;

      // Act & Assert
      expect(ch.isMoving()).toBe(true);
    });

    it('is true when a pixel step occurred this frame even without an engine tween', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.setMovedThisFrame(true);

      // Act & Assert
      expect(ch.isMoving()).toBe(true);
    });

    it('is false when neither the engine nor a pixel step reports movement', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act & Assert
      expect(ch.isMoving()).toBe(false);
    });
  });

  it('setMovePressed toggles the move-input flag read by isMovePressed', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();

    // Act
    ch.setMovePressed(true);

    // Assert
    expect(ch.isMovePressed()).toBe(true);
  });

  it('diagonalDistancePerFrame reduces the straight distance by sqrt(1/2)', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.setMoveSpeed(4);

    // Act & Assert
    expect(ch.diagonalDistancePerFrame()).toBeCloseTo(ch.distancePerFrame() * Math.SQRT1_2);
  });

  it('relocate synchronizes render coordinates and clears the stop counter', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch._stopCount = 9;

    // Act
    ch.relocate(3, 4);

    // Assert
    expect(ch._x).toBe(3);
    expect(ch._y).toBe(4);
    expect(ch._realX).toBe(3);
    expect(ch._realY).toBe(4);
    expect(ch._stopCount).toBe(0);
  });

  it('startPixelMoving flags move-pressed and records the current position', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();

    // Act
    ch.startPixelMoving();

    // Assert
    expect(ch.isMovePressed()).toBe(true);
    expect(ch.positionalRecords().length).toBe(1);
  });

  describe('moveStraightDistance primitives', () =>
  {
    it('moves down by increasing y', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.moveStraightDistance(globalThis.J.PIXEL.Directions.DOWN, 0.1);

      // Assert
      expect(ch._y).toBeCloseTo(0.1);
    });

    it('moves left by decreasing x', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.moveStraightDistance(globalThis.J.PIXEL.Directions.LEFT, 0.1);

      // Assert
      expect(ch._x).toBeCloseTo(-0.1);
    });

    it('moves right by increasing x', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.moveStraightDistance(globalThis.J.PIXEL.Directions.RIGHT, 0.1);

      // Assert
      expect(ch._x).toBeCloseTo(0.1);
    });

    it('moves up by decreasing y', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.moveStraightDistance(globalThis.J.PIXEL.Directions.UP, 0.1);

      // Assert
      expect(ch._y).toBeCloseTo(-0.1);
    });
  });

  describe('moveDiagonalDistance primitives', () =>
  {
    it('moves down-left by decreasing x and increasing y', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.moveDiagonalDistance(globalThis.J.PIXEL.Directions.LOWERLEFT, 0.1);

      // Assert
      expect(ch._x).toBeCloseTo(-0.1);
      expect(ch._y).toBeCloseTo(0.1);
    });

    it('moves down-right by increasing both x and y', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.moveDiagonalDistance(globalThis.J.PIXEL.Directions.LOWERRIGHT, 0.1);

      // Assert
      expect(ch._x).toBeCloseTo(0.1);
      expect(ch._y).toBeCloseTo(0.1);
    });

    it('moves up-left by decreasing both x and y', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.moveDiagonalDistance(globalThis.J.PIXEL.Directions.UPPERLEFT, 0.1);

      // Assert
      expect(ch._x).toBeCloseTo(-0.1);
      expect(ch._y).toBeCloseTo(-0.1);
    });

    it('moves up-right by increasing x and decreasing y', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.moveDiagonalDistance(globalThis.J.PIXEL.Directions.UPPERRIGHT, 0.1);

      // Assert
      expect(ch._x).toBeCloseTo(0.1);
      expect(ch._y).toBeCloseTo(-0.1);
    });
  });

  it('movePixelDistance advances via the diagonal path on an open map', () =>
  {
    // Arrange
    const ch = new globalThis.Game_CharacterBase();
    ch.initMembers();
    ch.relocate(0.5, 0.5);

    // Act
    ch.movePixelDistance(globalThis.J.PIXEL.Directions.LOWERRIGHT, 0.1);

    // Assert
    expect(ch._x).toBeGreaterThan(0.5);
    expect(ch._y).toBeGreaterThan(0.5);
  });

  describe('canPass engine-alias override', () =>
  {
    it('rounds fractional coordinates before delegating to the original engine method', () =>
    {
      // Arrange
      const original = globalThis.J.PIXEL.Aliased.Game_CharacterBase.get('canPass');
      let capturedX = null;
      let capturedY = null;
      globalThis.J.PIXEL.Aliased.Game_CharacterBase.set('canPass', (x, y, _d) =>
      {
        capturedX = x;
        capturedY = y;
        return true;
      });
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();

      // Act
      ch.canPass(1.6, 2.4, globalThis.J.PIXEL.Directions.DOWN);

      // Assert
      expect(capturedX).toBe(2);
      expect(capturedY).toBe(2);

      // Cleanup: restore the real aliased original so later tests aren't affected.
      globalThis.J.PIXEL.Aliased.Game_CharacterBase.set('canPass', original);
    });
  });

  describe('pos overwrite', () =>
  {
    it('matches when the fractional coordinate rounds to the given tile', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch._x = 2.9;
      ch._y = 4.1;

      // Act
      const matched = ch.pos(3, 4);

      // Assert
      expect(matched).toBe(true);
    });

    it('does not match when the fractional coordinate rounds to a different tile', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch._x = 2.4;
      ch._y = 4.1;

      // Act
      const matched = ch.pos(3, 4);

      // Assert
      expect(matched).toBe(false);
    });

    it('matches the tile below when a feet-anchored pivot lands in the round/pivot disagreement band', () =>
    {
      // Arrange: pivotY 0.70 puts frac(_y)=0.35 in the [0.30, 0.50) disagreement band, where
      // Math.round would answer row 4 but the collision pivot's body is actually in row 5.
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.getCollisionPivotY = () => 0.70;
      ch._x = 3;
      ch._y = 4.35;

      // Act
      const matchesBodyRow = ch.pos(3, 5);
      const matchesRoundedRow = ch.pos(3, 4);

      // Assert
      expect(matchesBodyRow).toBe(true);
      expect(matchesRoundedRow).toBe(false);
    });

    it('still matches the same row just below the disagreement band boundary', () =>
    {
      // Arrange: frac(_y)=0.29 is just outside the [0.30, 0.50) band, so the body is still in row 4.
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.getCollisionPivotY = () => 0.70;
      ch._x = 3;
      ch._y = 4.29;

      // Act
      const matched = ch.pos(3, 4);

      // Assert
      expect(matched).toBe(true);
    });

    it('matches at-rest integer coordinates regardless of pivot, so static events keep working', () =>
    {
      // Arrange
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.getCollisionPivotY = () => 0.70;
      ch._x = 3;
      ch._y = 4;

      // Act
      const matched = ch.pos(3, 4);

      // Assert
      expect(matched).toBe(true);
    });

    it('clamps a pivot of 1.0 below the tile boundary so an at-rest custom-hitbox enemy keeps its own tile', () =>
    {
      // Arrange: JABS pixel ext anchors custom-hitbox enemies at pivotY 1.0 ("feet on the tile's
      // bottom edge"). Unclamped, floor(4 + 1.0) would report row 5 instead of the enemy's own row 4.
      const ch = new globalThis.Game_CharacterBase();
      ch.initMembers();
      ch.getCollisionPivotY = () => 1.0;
      ch._x = 3;
      ch._y = 4;

      // Act
      const matchesOwnRow = ch.pos(3, 4);
      const matchesRowBelow = ch.pos(3, 5);

      // Assert
      expect(matchesOwnRow).toBe(true);
      expect(matchesRowBelow).toBe(false);
    });
  });

  describe('occupiedTileX/occupiedTileY', () =>
  {
    it('matches Math.round semantics on the X axis, where the pivot is always 0.5', () =>
    {
      // Arrange
      const roundsUp = new globalThis.Game_CharacterBase();
      roundsUp.initMembers();
      roundsUp._x = 2.9;
      const roundsDown = new globalThis.Game_CharacterBase();
      roundsDown.initMembers();
      roundsDown._x = 2.4;

      // Act
      const upTile = roundsUp.occupiedTileX();
      const downTile = roundsDown.occupiedTileX();

      // Assert
      expect(upTile).toBe(3);
      expect(downTile).toBe(2);
    });
  });
});
//endregion plugins/pixel/core/_component/game-character-base-pixel.test.js
