//region plugins/abs/ext/speed/objects/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Speed Game_Enemy (unit, all downstream dependencies mocked)', () =>
{
  let originalOnBattlerDataChange;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SPEED: { Aliased: { Game_Enemy: new Map() } } } } };

    function Game_Enemy()
    {
    }

    originalOnBattlerDataChange = vi.fn();
    Game_Enemy.prototype.onBattlerDataChange = originalOnBattlerDataChange;
    globalThis.Game_Enemy = Game_Enemy;

    await import('../../../../../../src/plugins/abs/ext/speed/objects/Game_Enemy.js');
  });

  beforeEach(() =>
  {
    originalOnBattlerDataChange.mockReset();
  });

  describe('onBattlerDataChange', () =>
  {
    it('performs the original logic then refreshes speed boosts', () =>
    {
      // Arrange
      const enemy = Object.create(globalThis.Game_Enemy.prototype);
      enemy.refreshSpeedBoosts = vi.fn();

      // Act
      enemy.onBattlerDataChange();

      // Assert
      expect(originalOnBattlerDataChange).toHaveBeenCalledTimes(1);
      expect(enemy.refreshSpeedBoosts).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/speed/objects/game-enemy.test.js
