//region plugins/abs/ext/diag/objects/game-player.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Diagonal Game_Player (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) prototype methods this file wraps- kept
   *  as stable variables and mutated in place, never reassigned, since the Aliased map captures a
   *  fixed reference to whichever function object sat on the prototype at import time. */
  let originalMoveStraight;
  let originalMoveDiagonally;

  beforeAll(async () =>
  {
    vi.resetModules();

    // minimal J.ABS.EXT.DIAG namespace- only the shape this one file reads/writes.
    globalThis.J = {
      ABS: {
        EXT: {
          DIAG: {
            Aliased: { Game_Player: new Map() },
          },
        },
      },
    };

    // Input is a bare RMMZ singleton global; only getInputDirection reaches for it.
    globalThis.Input = { dir8: 0 };

    // Game_Player.prototype.<method> is aliased ("original") before this file overwrites each; stub
    // each with a canned return value rather than pulling in the real Game_Player/Game_Character chain.
    function Game_Player()
    {
    }

    originalMoveStraight = vi.fn();
    originalMoveDiagonally = vi.fn();
    Game_Player.prototype.moveStraight = originalMoveStraight;
    Game_Player.prototype.moveDiagonally = originalMoveDiagonally;
    globalThis.Game_Player = Game_Player;

    // the file under test- patches globalThis.Game_Player.prototype directly, no vm involved.
    await import('../../../../../../src/plugins/abs/ext/diag/objects/Game_Player.js');
  });

  beforeEach(() =>
  {
    // reset the SAME mock instances the Aliased map already holds a reference to.
    originalMoveStraight.mockReset();
    originalMoveDiagonally.mockReset();
  });

  /**
   * Builds a duck-typed Game_Player carrying the real patched prototype (getInputDirection,
   * moveStraight, moveDiagonally), plus per-test overrides for the collaborator methods this file
   * leans on from elsewhere in the abs/core chain.
   * @param {object} [overrides]
   * @returns {object}
   */
  function buildPlayer(overrides = {})
  {
    const player = Object.create(globalThis.Game_Player.prototype);
    player._x = 0;
    player._y = 0;
    player.isDiagonalDirection = (dir) => [ 1, 3, 7, 9 ].includes(dir);
    player.getDiagonalDirections = (dir) =>
    {
      const map = { 1: [ 4, 2 ], 3: [ 6, 2 ], 7: [ 4, 8 ], 9: [ 6, 8 ] };
      return map[dir];
    };
    player._movementSucceeded = true;
    player.isMovementSucceeded = () => player._movementSucceeded;
    player.setMovementSuccess = (success) => { player._movementSucceeded = success; };
    player.canPass = vi.fn(() => false);

    return Object.assign(player, overrides);
  }

  describe('getInputDirection', () =>
  {
    it('returns Input.dir8', () =>
    {
      // Arrange
      globalThis.Input.dir8 = 7;
      const player = buildPlayer();

      // Act
      const result = player.getInputDirection();

      // Assert
      expect(result).toBe(7);
    });
  });

  describe('moveStraight', () =>
  {
    it('defers to the original logic when the direction is not diagonal', () =>
    {
      // Arrange
      originalMoveStraight.mockReturnValue('original-result');
      const player = buildPlayer();

      // Act
      const result = player.moveStraight(2);

      // Assert
      expect(originalMoveStraight).toHaveBeenCalledWith(2);
      expect(result).toBe('original-result');
    });

    it('moves diagonally and returns the direction when it is a diagonal direction', () =>
    {
      // Arrange
      const player = buildPlayer();
      player.moveDiagonally = vi.fn();

      // Act
      const result = player.moveStraight(9);

      // Assert
      expect(player.moveDiagonally).toHaveBeenCalledWith(6, 8);
      expect(originalMoveStraight).not.toHaveBeenCalled();
      expect(result).toBe(9);
    });
  });

  describe('moveDiagonally', () =>
  {
    it('does not attempt to slide when the original diagonal movement already succeeded', () =>
    {
      // Arrange
      const player = buildPlayer({ _movementSucceeded: true });
      player.moveStraight = vi.fn();

      // Act
      player.moveDiagonally(6, 8);

      // Assert
      expect(originalMoveDiagonally).toHaveBeenCalledWith(6, 8);
      expect(player.canPass).not.toHaveBeenCalled();
      expect(player.moveStraight).not.toHaveBeenCalled();
    });

    it('slides vertically when the diagonal move fails but the vertical direction is passable', () =>
    {
      // Arrange
      const player = buildPlayer({ _movementSucceeded: false });
      player.canPass = vi.fn((_x, _y, dir) => dir === 8);
      player.moveStraight = vi.fn();

      // Act
      player.moveDiagonally(6, 8);

      // Assert
      expect(player.moveStraight).toHaveBeenCalledWith(8);
      expect(player.moveStraight).not.toHaveBeenCalledWith(6);
    });

    it('slides horizontally when the diagonal move fails but the horizontal direction is passable', () =>
    {
      // Arrange
      const player = buildPlayer({ _movementSucceeded: false });
      player.canPass = vi.fn((_x, _y, dir) => dir === 6);
      player.moveStraight = vi.fn();

      // Act
      player.moveDiagonally(6, 8);

      // Assert
      expect(player.moveStraight).toHaveBeenCalledWith(6);
      expect(player.moveStraight).not.toHaveBeenCalledWith(8);
    });

    it('does not move at all when neither slide direction is passable', () =>
    {
      // Arrange
      const player = buildPlayer({ _movementSucceeded: false });
      player.canPass = vi.fn(() => false);
      player.moveStraight = vi.fn();

      // Act
      player.moveDiagonally(6, 8);

      // Assert
      expect(player.moveStraight).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/diag/objects/game-player.test.js
