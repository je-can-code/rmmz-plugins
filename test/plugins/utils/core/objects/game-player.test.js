//region plugins/utils/core/objects/game-player.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Player ext/utils augments (direct src import)', () =>
{
  let Game_Player;

  beforeAll(async () =>
  {
    vi.resetModules();

    function StubGamePlayer()
    {
    }

    globalThis.Game_Player = StubGamePlayer;

    await import('../../../../../src/plugins/utils/core/objects/Game_Player.js');
    ({ Game_Player } = globalThis);
  });

  beforeEach(() =>
  {
    vi.restoreAllMocks();
  });

  describe('battler', () =>
  {
    it('returns the party leader battler', () =>
    {
      // Arrange
      const player = new Game_Player();
      const leader = {};
      globalThis.$gameParty = { leader: () => leader };

      // Act
      const result = player.battler();

      // Assert
      expect(result).toBe(leader);
    });

    it('warns and returns null when there is no leader', () =>
    {
      // Arrange
      const player = new Game_Player();
      globalThis.$gameParty = { leader: () => null };
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = player.battler();

      // Assert
      expect(result).toEqual(null);
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
//endregion plugins/utils/core/objects/game-player.test.js
