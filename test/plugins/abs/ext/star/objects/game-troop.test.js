//region plugins/abs/ext/star/objects/game-troop.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Star Game_Troop (unit, all downstream dependencies mocked)', () =>
{
  let originalInitialize;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { STAR: { Aliased: { Game_Troop: new Map() } } } } };
    globalThis.JABS_AiManager = { getOpposingBattlers: vi.fn(() => []) };
    globalThis.$jabsEngine = { getPlayer1: vi.fn() };

    function Game_Troop()
    {
    }

    originalInitialize = vi.fn();
    Game_Troop.prototype.initialize = originalInitialize;
    globalThis.Game_Troop = Game_Troop;

    await import('../../../../../../src/plugins/abs/ext/star/objects/Game_Troop.js');
  });

  beforeEach(() =>
  {
    originalInitialize.mockReset();
    globalThis.JABS_AiManager.getOpposingBattlers.mockReset().mockReturnValue([]);
  });

  function buildTroop()
  {
    const troop = Object.create(globalThis.Game_Troop.prototype);
    troop.initialize();
    return troop;
  }

  describe('initialize / initMembers', () =>
  {
    it('calls the original then defaults the remaining enemy count to zero', () =>
    {
      const troop = Object.create(globalThis.Game_Troop.prototype);
      troop.initialize();
      expect(originalInitialize).toHaveBeenCalledTimes(1);
      expect(troop.getRemainingEnemyCount()).toBe(0);
    });
  });

  describe('getRemainingEnemyCount / areEnemiesAlive', () =>
  {
    it('reports no enemies alive by default', () =>
    {
      const troop = buildTroop();
      expect(troop.areEnemiesAlive()).toBe(false);
    });
  });

  describe('updateRemainingEnemyCount', () =>
  {
    it('KNOWN BUG: does not actually update the count read by getRemainingEnemyCount, since it assigns `this._remainingEnemyCount` (no `_j._abs.` prefix) while the getter reads `this._j._abs._remainingEnemyCount`- this means areEnemiesAlive() is permanently stuck reading the initial 0, so victory conditions gated on it would trigger instantly every battle', () =>
    {
      // Arrange
      const troop = buildTroop();
      globalThis.JABS_AiManager.getOpposingBattlers.mockReturnValue([ { id: 1 }, { id: 2 } ]);

      // Act
      troop.updateRemainingEnemyCount();

      // Assert- the stray top-level property IS set...
      expect(troop._remainingEnemyCount).toBe(2);
      // ...but the getter (and therefore areEnemiesAlive) never sees it.
      expect(troop.getRemainingEnemyCount()).toBe(0);
      expect(troop.areEnemiesAlive()).toBe(false);
    });
  });
});
//endregion plugins/abs/ext/star/objects/game-troop.test.js
