//region plugins/sdp/core/objects/game-troop.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('Game_Troop ext/sdp augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    function StubGameTroop()
    {
    }

    globalThis.Game_Troop = StubGameTroop;

    await import('../../../../../src/plugins/sdp/core/objects/Game_Troop.js');
  });

  describe('sdpTotal', () =>
  {
    it('returns 0 when there are no dead members', () =>
    {
      // Arrange
      const troop = new globalThis.Game_Troop();
      troop.deadMembers = vi.fn().mockReturnValue([]);

      // Act
      const result = troop.sdpTotal();

      // Assert
      expect(result).toEqual(0);
    });

    it('sums the sdpPoints of every dead member', () =>
    {
      // Arrange
      const troop = new globalThis.Game_Troop();
      troop.deadMembers = vi.fn().mockReturnValue([
        { sdpPoints: () => 5 },
        { sdpPoints: () => 3 },
      ]);

      // Act
      const result = troop.sdpTotal();

      // Assert
      expect(result).toEqual(8);
    });
  });
});
//endregion plugins/sdp/core/objects/game-troop.test.js
