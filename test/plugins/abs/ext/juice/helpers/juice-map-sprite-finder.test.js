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
      globalThis.SceneManager._scene = { isMapScene: () => false };
      expect(JuiceMapSpriteFinder.findSpriteCharacterFor({})).toBeNull();
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
