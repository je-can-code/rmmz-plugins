//region plugins/level/ext/flat/objects/game-troop.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Troop (J-LEVEL-Flat) (direct src import)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) expTotal. */
  let originalExpTotal;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      LEVEL: {
        EXT: {
          FLAT: {
            Aliased: { Game_Troop: new Map() },
            Metadata: { policyMultiplier: 1.0 },
          },
        },
      },
    };

    function Game_Troop()
    {
    }

    originalExpTotal = vi.fn(() => 999);
    Game_Troop.prototype.expTotal = originalExpTotal;
    globalThis.Game_Troop = Game_Troop;

    await import('../../../../../../src/plugins/level/ext/flat/objects/Game_Troop.js');
  });

  beforeEach(() =>
  {
    originalExpTotal.mockClear();
    globalThis.J.LEVEL.EXT.FLAT.Metadata.policyMultiplier = 1.0;
  });

  function buildTroop(overrides = {})
  {
    const troop = Object.create(globalThis.Game_Troop.prototype);
    return Object.assign(troop, overrides);
  }

  describe('expTotal', () =>
  {
    it('delegates to the original aliased implementation when level scaling is disabled', () =>
    {
      // Arrange
      globalThis.$gameSystem = { isLevelScalingEnabled: () => false };
      const troop = buildTroop();

      // Act
      const result = troop.expTotal();

      // Assert
      expect(originalExpTotal).toHaveBeenCalled();
      expect(result).toBe(999);
    });

    it('uses the flat experience result when level scaling is enabled', () =>
    {
      // Arrange
      globalThis.$gameSystem = { isLevelScalingEnabled: () => true };
      const troop = buildTroop({ getFlatExpResult: vi.fn(() => 42) });

      // Act
      const result = troop.expTotal();

      // Assert
      expect(originalExpTotal).not.toHaveBeenCalled();
      expect(result).toBe(42);
    });
  });

  describe('getFlatExpResult', () =>
  {
    it('returns 0 when there are no dead members', () =>
    {
      // Arrange
      globalThis.$gameParty = { averageActorLevel: () => 10 };
      const troop = buildTroop({ deadMembers: () => [] });

      // Act & Assert
      expect(troop.getFlatExpResult()).toBe(0);
    });

    it('sums flat experience and bonus experience across all dead members', () =>
    {
      // Arrange: both enemies are parity (level 10 vs average party level 10), so each grants 25 flat + own bonus.
      globalThis.$gameParty = { averageActorLevel: () => 10 };
      const deadEnemies = [
        { level: 10, exp: () => 5 },
        { level: 10, exp: () => 15 },
      ];
      const troop = buildTroop({ deadMembers: () => deadEnemies });

      // Act
      const result = troop.getFlatExpResult();

      // Assert: (25 + 5) + (25 + 15) = 70.
      expect(result).toBe(70);
    });

    it('rounds the accumulated total to the nearest integer', () =>
    {
      // Arrange: policy multiplier of 0.5 on a parity base of 25 rounds each hit to 13 (12.5 rounds up).
      globalThis.J.LEVEL.EXT.FLAT.Metadata.policyMultiplier = 0.5;
      globalThis.$gameParty = { averageActorLevel: () => 10 };
      const deadEnemies = [ { level: 10, exp: () => 0 } ];
      const troop = buildTroop({ deadMembers: () => deadEnemies });

      // Act
      const result = troop.getFlatExpResult();

      // Assert
      expect(result).toBe(13);
    });
  });
});
//endregion plugins/level/ext/flat/objects/game-troop.test.js
