//region plugins/abs/ext/juice/helpers/juice-map-sprite-finder.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice JuiceMapSpriteFinder (unit, all downstream dependencies mocked)', () =>
{
  let JuiceMapSpriteFinder;

  beforeAll(async () =>
  {
    ({ default: JuiceMapSpriteFinder } = await import('../../../../../../src/plugins/abs/ext/juice/helpers/JuiceMapSpriteFinder.js'));
  });

  beforeEach(() =>
  {
    globalThis.SceneManager = { _scene: null };
  });

  describe('findSpriteCharacterFor', () =>
  {
    it('returns null when the current scene is not the map scene', () =>
    {
      // Arrange: a non-map scene that nonetheless carries a spriteset willing to answer, which is
      // what a battle scene looks like. Without one the very next guard returns the same null, so
      // the map-scene check itself could be dropped and this would still read as passing - and juice
      // meant for a map character would go hunting through whatever scene happened to be up.
      globalThis.SceneManager._scene = {
        isMapScene: () => false,
        _spriteset: { findTargetSprite: vi.fn(() => ({ id: 'wrong-scene-sprite' })) },
      };

      // Act
      const result = JuiceMapSpriteFinder.findSpriteCharacterFor({});

      // Assert
      expect(result).toBeNull();
    });

    it('returns null when the map scene has no spriteset yet', () =>
    {
      globalThis.SceneManager._scene = { isMapScene: () => true, _spriteset: null };
      expect(JuiceMapSpriteFinder.findSpriteCharacterFor({})).toBeNull();
    });

    it('delegates to the spriteset to find the target sprite', () =>
    {
      const sprite = { id: 'sprite' };
      const character = { id: 'character' };
      globalThis.SceneManager._scene = {
        isMapScene: () => true,
        _spriteset: { findTargetSprite: vi.fn(() => sprite) },
      };

      const result = JuiceMapSpriteFinder.findSpriteCharacterFor(character);

      expect(globalThis.SceneManager._scene._spriteset.findTargetSprite).toHaveBeenCalledWith(character);
      expect(result).toBe(sprite);
    });
  });
});
//endregion plugins/abs/ext/juice/helpers/juice-map-sprite-finder.test.js
