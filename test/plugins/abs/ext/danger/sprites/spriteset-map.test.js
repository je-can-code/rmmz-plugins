//region plugins/abs/ext/danger/sprites/spriteset-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Danger Spriteset_Map (unit, all downstream dependencies mocked)', () =>
{
  /** @type {import('vitest').Mock} the "original" (aliased) refreshAllCharacterSprites. */
  let originalRefreshAllCharacterSprites;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      ABS: {
        EXT: {
          DANGER: {
            Aliased: { Spriteset_Map: new Map() },
          },
        },
      },
    };

    function Spriteset_Map()
    {
    }

    originalRefreshAllCharacterSprites = vi.fn();
    Spriteset_Map.prototype.refreshAllCharacterSprites = originalRefreshAllCharacterSprites;
    globalThis.Spriteset_Map = Spriteset_Map;

    await import('../../../../../../src/plugins/abs/ext/danger/sprites/Spriteset_Map.js');
  });

  beforeEach(() =>
  {
    originalRefreshAllCharacterSprites.mockReset();
  });

  describe('refreshAllCharacterSprites', () =>
  {
    it('sets up the danger indicator for every character sprite before delegating to the original logic', () =>
    {
      // Arrange
      const spriteset = Object.create(globalThis.Spriteset_Map.prototype);
      const sprites = [ { setupDangerIndicator: vi.fn() }, { setupDangerIndicator: vi.fn() } ];
      spriteset._characterSprites = sprites;

      // Act
      spriteset.refreshAllCharacterSprites();

      // Assert
      sprites.forEach(sprite => expect(sprite.setupDangerIndicator).toHaveBeenCalledTimes(1));
      expect(originalRefreshAllCharacterSprites).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/danger/sprites/spriteset-map.test.js
