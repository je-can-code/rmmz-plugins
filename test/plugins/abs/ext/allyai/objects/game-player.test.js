//region plugins/abs/ext/allyai/objects/game-player.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI Game_Player (unit, all downstream dependencies mocked)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {};

    function Game_Player()
    {
    }

    globalThis.Game_Player = Game_Player;

    await import('../../../../../../src/plugins/abs/ext/allyai/objects/Game_Player.js');
  });

  describe('jumpFollowersToMe', () =>
  {
    it('jumps every follower back to the player', () =>
    {
      // Arrange
      const follower1 = { jumpToPlayer: vi.fn() };
      const follower2 = { jumpToPlayer: vi.fn() };
      const player = Object.create(globalThis.Game_Player.prototype);
      player.followers = () => ({ data: () => [ follower1, follower2 ] });

      // Act
      player.jumpFollowersToMe();

      // Assert
      expect(follower1.jumpToPlayer).toHaveBeenCalledTimes(1);
      expect(follower2.jumpToPlayer).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/allyai/objects/game-player.test.js
