//region plugins/passive/ext/otib/objects/game-battler.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Battler ext/otib augments (direct src import)', () =>
{
  let Game_Battler;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { PASSIVE: { EXT: { OTIB: { Aliased: { Game_Battler: new Map() } } } } };

    function StubGameBattler()
    {
    }

    StubGameBattler.prototype.consumeItem = vi.fn();
    globalThis.Game_Battler = StubGameBattler;

    await import('../../../../../../src/plugins/passive/ext/otib/objects/Game_Battler.js');
    ({ Game_Battler } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('handleOtibUnlock', () =>
  {
    it('is a no-op default implementation for non-actor battlers', () =>
    {
      // Arrange
      const battler = new Game_Battler();

      // Act/Assert (no throw, no return value)
      expect(() => battler.handleOtibUnlock({})).not.toThrow();
    });
  });

  describe('consumeItem', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const battler = new Game_Battler();
      battler.handleOtibUnlock = vi.fn();
      const item = {};

      // Act
      battler.consumeItem(item);

      // Assert
      expect(globalThis.J.PASSIVE.EXT.OTIB.Aliased.Game_Battler.get('consumeItem')).toHaveBeenCalledWith(item);
    });

    it('delegates to the battler-type-specific OTIB handler', () =>
    {
      // Arrange
      const battler = new Game_Battler();
      battler.handleOtibUnlock = vi.fn();
      const item = {};

      // Act
      battler.consumeItem(item);

      // Assert
      expect(battler.handleOtibUnlock).toHaveBeenCalledWith(item);
    });
  });
});
//endregion plugins/passive/ext/otib/objects/game-battler.test.js
