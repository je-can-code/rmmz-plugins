//region plugins/pixel/ext/abs/objects/game-follower.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The JABS-aware half of follower movement. Pixel core moves followers along the player's
 * breadcrumb trail; this plugin hands allies over to formation movement instead, and everything
 * here is about making that handoff clean. Two systems writing a position to the same sprite each
 * frame is what these guards exist to prevent, so the assertions are about who is allowed to move
 * an ally rather than about where it ends up.
 */
describe('J-ABS-Pixelistics Game_Follower ally handoff (direct src import)', () =>
{
  let Game_Follower;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      PIXEL: {
        Aliased: { Game_Follower: new Map() },
        EXT: { ABS: { Aliased: { Game_Follower: new Map() } } },
        Directions: { DOWN: 2, LEFT: 4, RIGHT: 6, UP: 8 },
      },
    };

    function StubGameFollower()
    {
    }

    StubGameFollower.prototype.chaseCharacter = vi.fn();
    StubGameFollower.prototype.update = vi.fn();
    StubGameFollower.prototype.moveStraight = vi.fn();
    StubGameFollower.prototype.moveDiagonally = vi.fn();
    globalThis.Game_Follower = StubGameFollower;

    // pixel core defines the neutral `isPixelTrainSuspended` default and the coordinate-sync
    // half of `update`; this plugin's file layers the ally-aware behavior on top of it, so both
    // have to be loaded in ship order for the alias chain to be real.
    await import('../../../../../../src/plugins/pixel/core/objects/Game_Follower.js');
    await import('../../../../../../src/plugins/pixel/ext/abs/objects/Game_Follower.js');

    Object.defineProperties(globalThis.Game_Follower.prototype, {
      x: { get() { return this._x; }, set(v) { this._x = v; }, configurable: true },
      y: { get() { return this._y; }, set(v) { this._y = v; }, configurable: true },
    });

    globalThis.Game_Follower.prototype.setRealX = function(v) { this._realX = v; };
    globalThis.Game_Follower.prototype.setRealY = function(v) { this._realY = v; };
    globalThis.Game_Follower.prototype.realX = function() { return this._realX; };
    globalThis.Game_Follower.prototype.realY = function() { return this._realY; };
    globalThis.Game_Follower.prototype.setStopCount = function(v) { this._stopCount = v; };

    ({ Game_Follower } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gamePlayer = { oldestPositionalRecord: vi.fn() };
  });

  /**
   * Builds a follower, optionally claimed by Ally AI. `jabsBattler` of `undefined` models the real
   * Map-lookup miss that `getJabsBattler` performs for a follower with no registered battler.
   * @param {number} x The tile x.
   * @param {number} y The tile y.
   * @param {object|undefined} jabsBattler The battler steering this follower, if any.
   * @returns {Game_Follower}
   */
  function makeFollower(x, y, jabsBattler = undefined)
  {
    const follower = new Game_Follower();
    follower._x = x;
    follower._y = y;
    follower._realX = x;
    follower._realY = y;
    follower._stopCount = 0;
    follower.setDirection = vi.fn();
    follower.getJabsBattler = vi.fn()
      .mockReturnValue(jabsBattler);
    follower.isMovePressed = vi.fn()
      .mockReturnValue(false);

    return follower;
  }

  /**
   * Builds an ally battler in a given combat posture.
   * @param {boolean} engaged Whether the ally is engaged with a target.
   * @param {boolean} alerted Whether the ally has been alerted.
   * @returns {object}
   */
  function makeAllyBattler(engaged = false, alerted = false)
  {
    return {
      isEngaged: () => engaged,
      isAlerted: () => alerted,
    };
  }

  //region isPixelTrainSuspended
  describe('isPixelTrainSuspended', () =>
  {
    it('claims a follower that Ally AI has given a battler', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, makeAllyBattler());

      // Act
      const result = follower.isPixelTrainSuspended();

      // Assert
      expect(result).toBe(true);
    });

    it('leaves an ordinary follower on the breadcrumb train', () =>
    {
      // Arrange: a battler-less follower resolves to undefined through the Map lookup.
      const follower = makeFollower(0, 0, undefined);

      // Act
      const result = follower.isPixelTrainSuspended();

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion isPixelTrainSuspended

  //region chaseCharacter
  describe('chaseCharacter', () =>
  {
    it('suppresses vanilla chasing for an ally owned by formation movement', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, makeAllyBattler());

      // Act
      follower.chaseCharacter({});

      // Assert
      expect(globalThis.J.PIXEL.EXT.ABS.Aliased.Game_Follower.get('chaseCharacter'))
        .not.toHaveBeenCalled();
    });

    it('chases normally for an ordinary follower', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, undefined);
      const character = {};

      // Act
      follower.chaseCharacter(character);

      // Assert
      expect(globalThis.J.PIXEL.EXT.ABS.Aliased.Game_Follower.get('chaseCharacter'))
        .toHaveBeenCalledWith(character);
    });
  });
  //endregion chaseCharacter

  //region update
  describe('update', () =>
  {
    it('preserves the pixel-core coordinate sync for an ordinary follower', () =>
    {
      // Arrange: pixel core's own update snaps render coordinates onto logical ones. Layering
      // the ally clamp on top must not cost an ordinary follower that behavior.
      const follower = makeFollower(3, 4, undefined);
      follower._realX = 0;
      follower._realY = 0;

      // Act
      follower.update();

      // Assert
      expect([ follower._realX, follower._realY ]).toEqual([ 3, 4 ]);
    });

    it('leaves an ordinary follower stop count alone', () =>
    {
      // Arrange
      const follower = makeFollower(2, 2, undefined);
      follower._stopCount = 15;

      // Act
      follower.update();

      // Assert
      expect(follower._stopCount).toBe(15);
    });

    it('clamps a resting ally so it stops drifting off its slot', () =>
    {
      // Arrange: formation movement issues steps deliberately, so a frame with no step means
      // the ally is meant to be still- any lingering interpolation is drift.
      const follower = makeFollower(2, 2, makeAllyBattler());
      follower._stopCount = 15;

      // Act
      follower.update();

      // Assert
      expect(follower._stopCount).toBe(0);
    });

    it('pins the render coordinates of a resting ally to its logical position', () =>
    {
      // Arrange
      const follower = makeFollower(2, 2, makeAllyBattler());
      follower._realX = 1.5;
      follower._realY = 1.5;

      // Act
      follower.update();

      // Assert
      expect([ follower._realX, follower._realY ]).toEqual([ 2, 2 ]);
    });

    it('does not interrupt an ally mid-step', () =>
    {
      // Arrange
      const follower = makeFollower(2, 2, makeAllyBattler());
      follower._stopCount = 15;
      follower.isMovePressed.mockReturnValue(true);

      // Act
      follower.update();

      // Assert
      expect(follower._stopCount).toBe(15);
    });
  });
  //endregion update

  //region idle formation movement guard
  describe('isIdleFormationMoveBlocked', () =>
  {
    it('never blocks an ordinary follower', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, undefined);

      // Act
      const result = follower.isIdleFormationMoveBlocked();

      // Assert
      expect(result).toBe(false);
    });

    it('blocks a resting ally, whose only legitimate movement comes from formation', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, makeAllyBattler(false, false));

      // Act
      const result = follower.isIdleFormationMoveBlocked();

      // Assert
      expect(result).toBe(true);
    });

    it('allows an ally that took a pixel step this frame', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, makeAllyBattler(false, false));
      follower.isMovePressed.mockReturnValue(true);

      // Act
      const result = follower.isIdleFormationMoveBlocked();

      // Assert
      expect(result).toBe(false);
    });

    it('allows an engaged ally, which moves on its combat AI terms', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, makeAllyBattler(true, false));

      // Act
      const result = follower.isIdleFormationMoveBlocked();

      // Assert
      expect(result).toBe(false);
    });

    it('allows an alerted ally, which is no longer in formation phase', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, makeAllyBattler(false, true));

      // Act
      const result = follower.isIdleFormationMoveBlocked();

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion idle formation movement guard

  //region movement
  describe('moveStraight', () =>
  {
    it('blocks a stray straight move on a resting ally', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, makeAllyBattler());

      // Act
      follower.moveStraight(2);

      // Assert
      expect(globalThis.J.PIXEL.EXT.ABS.Aliased.Game_Follower.get('moveStraight'))
        .not.toHaveBeenCalled();
    });

    it('permits a straight move on an ordinary follower', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, undefined);

      // Act
      follower.moveStraight(2);

      // Assert
      expect(globalThis.J.PIXEL.EXT.ABS.Aliased.Game_Follower.get('moveStraight'))
        .toHaveBeenCalledWith(2);
    });
  });

  describe('moveDiagonally', () =>
  {
    it('blocks a stray diagonal move on a resting ally', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, makeAllyBattler());

      // Act
      follower.moveDiagonally(6, 2);

      // Assert
      expect(globalThis.J.PIXEL.EXT.ABS.Aliased.Game_Follower.get('moveDiagonally'))
        .not.toHaveBeenCalled();
    });

    it('permits a diagonal move on an ordinary follower', () =>
    {
      // Arrange
      const follower = makeFollower(0, 0, undefined);

      // Act
      follower.moveDiagonally(6, 2);

      // Assert
      expect(globalThis.J.PIXEL.EXT.ABS.Aliased.Game_Follower.get('moveDiagonally'))
        .toHaveBeenCalledWith(6, 2);
    });
  });
  //endregion movement
});
//endregion plugins/pixel/ext/abs/objects/game-follower.test.js