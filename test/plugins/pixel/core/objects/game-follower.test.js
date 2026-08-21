//region plugins/pixel/core/objects/game-follower.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Follower ext/pixel augments (direct src import)', () =>
{
  let Game_Follower;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      PIXEL: {
        Aliased: { Game_Follower: new Map() },
        Directions: { DOWN: 2, LEFT: 4, RIGHT: 6, UP: 8 },
      },
      ABS: { EXT: { ALLYAI: true } },
    };

    function StubGameFollower()
    {
    }

    StubGameFollower.prototype.chaseCharacter = vi.fn();
    StubGameFollower.prototype.update = vi.fn();
    StubGameFollower.prototype.moveStraight = vi.fn();
    StubGameFollower.prototype.moveDiagonally = vi.fn();
    globalThis.Game_Follower = StubGameFollower;

    await import('../../../../../src/plugins/pixel/core/objects/Game_Follower.js');

    // RMMZ exposes map coordinates as native properties on Game_CharacterBase.
    Object.defineProperties(globalThis.Game_Follower.prototype, {
      // vanilla exposes these read-only; the double allows writes so tests can position freely.
      x: { get() { return this._x; }, set(v) { this._x = v; }, configurable: true },
      y: { get() { return this._y; }, set(v) { this._y = v; }, configurable: true },
    });

    // J-Base coordinate accessors the pixel/abs layers read and write through.
    globalThis.Game_Follower.prototype.setX = function(v) { this._x = v; };
    globalThis.Game_Follower.prototype.setY = function(v) { this._y = v; };
    globalThis.Game_Follower.prototype.realX = function() { return this._realX; };
    globalThis.Game_Follower.prototype.realY = function() { return this._realY; };
    globalThis.Game_Follower.prototype.setRealX = function(v) { this._realX = v; };
    globalThis.Game_Follower.prototype.setRealY = function(v) { this._realY = v; };

    // J-Base accessor the production code now writes through.
    StubGameFollower.prototype.setStopCount = function(v) { this._stopCount = v; };
    ({ Game_Follower } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gamePlayer = { oldestPositionalRecord: vi.fn() };
  });

  function makeFollower(x, y, jabsBattler = null)
  {
    const follower = new Game_Follower();
    follower._x = x;
    follower._y = y;
    follower.setDirection = vi.fn();
    follower.getJabsBattler = vi.fn().mockReturnValue(jabsBattler);
    follower.isMovePressed = vi.fn().mockReturnValue(false);
    return follower;
  }

  describe('pixelFaceCharacter', () =>
  {
    it('does nothing when the preceding character has no positional record', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0);
      const other = { oldestPositionalRecord: () => null };

      // Act
      follower.pixelFaceCharacter(other);

      // Assert
      expect(follower.setDirection).not.toHaveBeenCalled();
    });

    it('faces down when the preceding character is vertically below', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0);
      const other = { oldestPositionalRecord: () => ({ x: 0, y: 5 }) };

      // Act
      follower.pixelFaceCharacter(other);

      // Assert
      expect(follower.setDirection).toHaveBeenCalledWith(2);
    });

    it('faces up when the preceding character is vertically above', () =>
    {
      // Arrange
      const follower = makeFollower(0, 5);
      const other = { oldestPositionalRecord: () => ({ x: 0, y: 0 }) };

      // Act
      follower.pixelFaceCharacter(other);

      // Assert
      expect(follower.setDirection).toHaveBeenCalledWith(8);
    });

    it('faces right when the preceding character is horizontally ahead', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0);
      const other = { oldestPositionalRecord: () => ({ x: 5, y: 0 }) };

      // Act
      follower.pixelFaceCharacter(other);

      // Assert
      expect(follower.setDirection).toHaveBeenCalledWith(6);
    });

    it('faces left when the preceding character is horizontally behind', () =>
    {
      // Arrange
      const follower = makeFollower(5, 0);
      const other = { oldestPositionalRecord: () => ({ x: 0, y: 0 }) };

      // Act
      follower.pixelFaceCharacter(other);

      // Assert
      expect(follower.setDirection).toHaveBeenCalledWith(4);
    });

    it('defaults to $gamePlayer as the other character when none is provided', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0);
      globalThis.$gamePlayer.oldestPositionalRecord.mockReturnValue({ x: 0, y: 5 });

      // Act
      follower.pixelFaceCharacter();

      // Assert
      expect(follower.setDirection).toHaveBeenCalledWith(2);
    });
  });

  describe('update', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, null);
      follower._realX = 0;
      follower._realY = 0;

      // Act
      follower.update();

      // Assert
      expect(globalThis.J.PIXEL.Aliased.Game_Follower.get('update')).toHaveBeenCalled();
    });

    it('snaps render coordinates to logical coordinates when they differ', () =>
    {
      // Arrange
      const follower = makeFollower(3, 4, null);
      follower._realX = 0;
      follower._realY = 0;

      // Act
      follower.update();

      // Assert
      expect(follower._realX).toEqual(3);
      expect(follower._realY).toEqual(4);
    });

    it.each([
      [ 'horizontal', 3, 0, 4, 4 ],
      [ 'vertical', 3, 3, 4, 0 ],
    ])('snaps render coordinates when only the %s axis has drifted', (_label, x, realX, y, realY) =>
    {
      // Arrange: the case above drifts both axes at once, so either half of the desync check could
      // be forced false and the other half would still fire the snap. A follower trailing along a
      // corridor drifts on one axis at a time, and a check that had lost one of its halves would
      // leave that axis rendering at a stale coordinate while the follower walked on without it.
      const follower = makeFollower(x, y, null);
      follower._realX = realX;
      follower._realY = realY;

      // Act
      follower.update();

      // Assert
      expect(follower._realX).toEqual(x);
      expect(follower._realY).toEqual(y);
    });
  });

  describe('isPixelTrainSuspended', () =>
  {
    it('never suspends the follower train under plain pixel movement', () =>
    {
      // Arrange: with no other system steering followers, the breadcrumb train is the only
      // thing moving them, so it must never stand down.
      const follower = makeFollower(0, 0, null);

      // Act
      const result = follower.isPixelTrainSuspended();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getCollisionPivotY', () =>
  {
    it('anchors the collision pivot near the feet (0.70)', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, null);

      // Act
      const result = follower.getCollisionPivotY();

      // Assert
      expect(result).toEqual(0.70);
    });
  });
});
//endregion plugins/pixel/core/objects/game-follower.test.js
