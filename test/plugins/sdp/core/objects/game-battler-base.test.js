//region plugins/sdp/core/objects/game-battler-base.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('Game_BattlerBase ext/sdp critSdpBonuses augment (direct src import)', () =>
{
  beforeAll(async () =>
  {
    function StubGameBattlerBase()
    {
    }

    globalThis.Game_BattlerBase = StubGameBattlerBase;

    await import('../../../../../src/plugins/sdp/core/objects/Game_BattlerBase.js');
  });

  describe('critSdpBonuses', () =>
  {
    it('returns 0 by default at the root level', () =>
    {
      // Arrange
      const battler = new globalThis.Game_BattlerBase();

      // Act
      const result = battler.critSdpBonuses(1, 100);

      // Assert
      expect(result).toEqual(0);
    });
  });
});
//endregion plugins/sdp/core/objects/game-battler-base.test.js
