//region plugins/sdp/core/objects/game-player.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Player ext/sdp augments (direct src import)', () =>
{
  let Game_Player;

  beforeAll(async () =>
  {
    globalThis.J = { SDP: { Aliased: { Game_Player: new Map() } } };

    function StubGamePlayer()
    {
    }

    StubGamePlayer.prototype.useOnPickup = vi.fn();
    StubGamePlayer.prototype.requestAnimation = vi.fn();
    globalThis.Game_Player = StubGamePlayer;

    await import('../../../../../src/plugins/sdp/core/objects/Game_Player.js');
    ({ Game_Player } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.$gameParty = { unlockSdp: vi.fn() };
    globalThis.$jabsEngine = { onSdpPanelUnlocked: vi.fn(), createSdpUnlockLog: vi.fn() };
  });

  describe('useOnPickup', () =>
  {
    it('calls through to the original implementation when the loot has no sdp key', () =>
    {
      // Arrange
      const player = new Game_Player();
      const lootData = {};

      // Act
      player.useOnPickup(lootData);

      // Assert
      expect(globalThis.J.SDP.Aliased.Game_Player.get('useOnPickup')).toHaveBeenCalledWith(lootData);
      expect(globalThis.$gameParty.unlockSdp).not.toHaveBeenCalled();
    });

    it('unlocks the sdp, notifies, logs, and animates without calling through when the loot has an sdp key', () =>
    {
      // Arrange
      const player = new Game_Player();
      const lootData = { sdpKey: 'panel-1', animationId: 42 };

      // Act
      player.useOnPickup(lootData);

      // Assert
      expect(globalThis.$gameParty.unlockSdp).toHaveBeenCalledWith('panel-1');
      expect(globalThis.$jabsEngine.onSdpPanelUnlocked).toHaveBeenCalledWith('panel-1', player);
      expect(globalThis.$jabsEngine.createSdpUnlockLog).toHaveBeenCalledWith('panel-1');
      expect(player.requestAnimation).toHaveBeenCalledWith(42);
      expect(globalThis.J.SDP.Aliased.Game_Player.get('useOnPickup')).not.toHaveBeenCalled();
    });

    it('defaults the pickup animation id to 119 when the loot has none', () =>
    {
      // Arrange
      const player = new Game_Player();
      const lootData = { sdpKey: 'panel-1' };

      // Act
      player.useOnPickup(lootData);

      // Assert
      expect(player.requestAnimation).toHaveBeenCalledWith(119);
    });
  });
});
//endregion plugins/sdp/core/objects/game-player.test.js
