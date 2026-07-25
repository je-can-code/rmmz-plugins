//region plugins/abs/ext/speed/objects/game-actor.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Speed Game_Actor (unit, all downstream dependencies mocked)', () =>
{
  let originalOnBattlerDataChange;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SPEED: { Aliased: { Game_Actor: new Map() } } } } };

    function Game_Actor()
    {
    }

    originalOnBattlerDataChange = vi.fn();
    Game_Actor.prototype.onBattlerDataChange = originalOnBattlerDataChange;
    globalThis.Game_Actor = Game_Actor;

    await import('../../../../../../src/plugins/abs/ext/speed/objects/Game_Actor.js');
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
      const actor = Object.create(globalThis.Game_Actor.prototype);
      actor.refreshSpeedBoosts = vi.fn();

      // Act
      actor.onBattlerDataChange();

      // Assert
      expect(originalOnBattlerDataChange).toHaveBeenCalledTimes(1);
      expect(actor.refreshSpeedBoosts).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/speed/objects/game-actor.test.js
