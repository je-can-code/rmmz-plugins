//region plugins/sdp/core/objects/game-battler.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('Game_BattlerBase ext/sdp augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    function StubGameBattlerBase()
    {
    }

    globalThis.Game_BattlerBase = StubGameBattlerBase;

    await import('../../../../../src/plugins/sdp/core/objects/Game_Battler.js');
  });

  describe('sdpMultiplier', () =>
  {
    it('defaults to 1.0', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();

      // Act
      const result = battler.sdpMultiplier;

      // Assert
      expect(result).toEqual(1.0);
    });
  });

  describe('baseSdpMultiplier', () =>
  {
    it('answers the neutral factor for a battler that earns no SDP points', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();

      // Act
      const result = battler.baseSdpMultiplier();

      // Assert
      expect(result).toBe(1.0);
    });
  });
});
//endregion plugins/sdp/core/objects/game-battler.test.js
