//region plugins/abs/ext/allyai/objects/game-interpreter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI Game_Interpreter (unit, all downstream dependencies mocked)', () =>
{
  let originalCommand205;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { ALLYAI: { Aliased: { Game_Interpreter: new Map() } } } } };

    function Game_Interpreter()
    {
    }

    originalCommand205 = vi.fn();
    Game_Interpreter.prototype.command205 = originalCommand205;
    globalThis.Game_Interpreter = Game_Interpreter;

    await import('../../../../../../src/plugins/abs/ext/allyai/objects/Game_Interpreter.js');
  });

  beforeEach(() =>
  {
    originalCommand205.mockReset();
    globalThis.$gamePlayer = {
      followers: () => ({ setDirectionFixAll: vi.fn() }),
      isDirectionFixed: () => true,
      jumpFollowersToMe: vi.fn(),
    };
  });

  function buildInterpreter()
  {
    return Object.create(globalThis.Game_Interpreter.prototype);
  }

  describe('command205', () =>
  {
    it('syncs follower direction-fix and jumps them to the player when moving the player', () =>
    {
      // Arrange
      originalCommand205.mockReturnValue(true);
      const interpreter = buildInterpreter();

      // Act
      const result = interpreter.command205([ -1 ]);

      // Assert
      expect(globalThis.$gamePlayer.followers().setDirectionFixAll).not.toBeUndefined();
      expect(globalThis.$gamePlayer.jumpFollowersToMe).toHaveBeenCalledTimes(1);
      expect(result).toBe(true);
    });

    it('does not sync followers when the moved character is not the player', () =>
    {
      // Arrange
      originalCommand205.mockReturnValue(true);
      const interpreter = buildInterpreter();

      // Act
      interpreter.command205([ 1 ]);

      // Assert
      expect(globalThis.$gamePlayer.jumpFollowersToMe).not.toHaveBeenCalled();
    });

    it('does not sync followers when the original command reports no result', () =>
    {
      // Arrange
      originalCommand205.mockReturnValue(false);
      const interpreter = buildInterpreter();

      // Act
      interpreter.command205([ -1 ]);

      // Assert
      expect(globalThis.$gamePlayer.jumpFollowersToMe).not.toHaveBeenCalled();
    });

    it('returns whatever the original command returned', () =>
    {
      // Arrange
      originalCommand205.mockReturnValue('outcome');
      const interpreter = buildInterpreter();

      // Act
      const result = interpreter.command205([ 1 ]);

      // Assert
      expect(result).toBe('outcome');
    });
  });
});
//endregion plugins/abs/ext/allyai/objects/game-interpreter.test.js
