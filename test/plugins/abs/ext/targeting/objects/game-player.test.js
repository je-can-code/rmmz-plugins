//region plugins/abs/ext/targeting/objects/game-player.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Targeting Game_Player augments (direct src import)', () =>
{
  let Game_Player;
  let originalCanMove;
  let isActiveMock;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { TARGETING: { Aliased: { Game_Player: new Map() } } } } };

    function StubGamePlayer()
    {
    }
    originalCanMove = vi.fn(() => true);
    StubGamePlayer.prototype.canMove = originalCanMove;
    globalThis.Game_Player = StubGamePlayer;

    isActiveMock = vi.fn(() => false);
    vi.doMock('../../../../../../src/plugins/abs/ext/targeting/managers/JABS_TargetingManager.js', () => ({
      default: { isActive: isActiveMock },
    }));

    await import('../../../../../../src/plugins/abs/ext/targeting/objects/Game_Player.js');
    ({ Game_Player } = globalThis);
  });

  beforeEach(() =>
  {
    originalCanMove.mockClear().mockReturnValue(true);
    isActiveMock.mockClear().mockReturnValue(false);
  });

  describe('canMove', () =>
  {
    it('is false when a targeting session is active, without calling through', () =>
    {
      isActiveMock.mockReturnValue(true);
      const player = new Game_Player();

      expect(player.canMove()).toBe(false);
      expect(originalCanMove).not.toHaveBeenCalled();
    });

    it('falls through to the original logic when no targeting session is active', () =>
    {
      isActiveMock.mockReturnValue(false);
      originalCanMove.mockReturnValue(true);
      const player = new Game_Player();

      expect(player.canMove()).toBe(true);
      expect(originalCanMove).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/targeting/objects/game-player.test.js
