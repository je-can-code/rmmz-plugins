//region plugins/abs/ext/allyai/sprites/spriteset-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI Spriteset_Map (unit, all downstream dependencies mocked)', () =>
{
  let originalRefreshAllCharacterSprites;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { ALLYAI: { Aliased: { Spriteset_Map: new Map() } } } } };

    function Spriteset_Map()
    {
    }

    originalRefreshAllCharacterSprites = vi.fn();
    Spriteset_Map.prototype.refreshAllCharacterSprites = originalRefreshAllCharacterSprites;
    globalThis.Spriteset_Map = Spriteset_Map;

    await import('../../../../../../src/plugins/abs/ext/allyai/sprites/Spriteset_Map.js');
  });

  beforeEach(() =>
  {
    originalRefreshAllCharacterSprites.mockReset();
  });

  describe('refreshAllCharacterSprites', () =>
  {
    it('rebuilds allies and clears the refresh request flag when one is pending', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { requestAlliesRefresh: true };
      globalThis.$gameMap = { updateAllies: vi.fn() };
      const spriteset = Object.create(globalThis.Spriteset_Map.prototype);

      // Act
      spriteset.refreshAllCharacterSprites();

      // Assert
      expect(originalRefreshAllCharacterSprites).toHaveBeenCalledTimes(1);
      expect(globalThis.$gameMap.updateAllies).toHaveBeenCalledTimes(1);
      expect(globalThis.$jabsEngine.requestAlliesRefresh).toBe(false);
    });

    it('does nothing extra when no refresh is pending', () =>
    {
      // Arrange
      globalThis.$jabsEngine = { requestAlliesRefresh: false };
      globalThis.$gameMap = { updateAllies: vi.fn() };
      const spriteset = Object.create(globalThis.Spriteset_Map.prototype);

      // Act
      spriteset.refreshAllCharacterSprites();

      // Assert
      expect(globalThis.$gameMap.updateAllies).not.toHaveBeenCalled();
    });
  });
});
//endregion plugins/abs/ext/allyai/sprites/spriteset-map.test.js
