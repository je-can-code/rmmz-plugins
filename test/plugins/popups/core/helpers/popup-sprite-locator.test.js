//region plugins/popups/core/helpers/popup-sprite-locator.test.js
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

describe('PopupSpriteLocator (direct src import)', () =>
{
  let PopupSpriteLocator;

  beforeAll(async () =>
  {
    function Scene_Map()
    {
    }

    globalThis.Scene_Map = Scene_Map;

    ({ default: PopupSpriteLocator } =
      await import('../../../../../src/plugins/popups/core/helpers/PopupSpriteLocator.js'));
  });

  afterEach(() =>
  {
    delete globalThis.SceneManager;
  });

  it('returns null when there is no active scene', () =>
  {
    // Arrange
    globalThis.SceneManager = { _scene: null };

    // Act
    const result = PopupSpriteLocator.findSpriteCharacterForGameCharacter({});

    // Assert
    expect(result).toBeNull();
  });

  it('returns null when the active scene is not the map scene', () =>
  {
    // Arrange
    function Scene_Battle()
    {
    }

    globalThis.SceneManager = { _scene: new Scene_Battle() };

    // Act
    const result = PopupSpriteLocator.findSpriteCharacterForGameCharacter({});

    // Assert
    expect(result).toBeNull();
  });

  it('returns null when the map scene has no spriteset', () =>
  {
    // Arrange
    const scene = new globalThis.Scene_Map();
    scene._spriteset = null;
    globalThis.SceneManager = { _scene: scene };

    // Act
    const result = PopupSpriteLocator.findSpriteCharacterForGameCharacter({});

    // Assert
    expect(result).toBeNull();
  });

  it('returns null when the spriteset has no character sprites', () =>
  {
    // Arrange
    const scene = new globalThis.Scene_Map();
    scene._spriteset = { _characterSprites: null };
    globalThis.SceneManager = { _scene: scene };

    // Act
    const result = PopupSpriteLocator.findSpriteCharacterForGameCharacter({});

    // Assert
    expect(result).toBeNull();
  });

  it('returns null when no character sprite wraps the given game character', () =>
  {
    // Arrange
    const gameCharacter = { name: 'target' };
    const otherCharacter = { name: 'other' };
    const scene = new globalThis.Scene_Map();
    scene._spriteset = {
      _characterSprites: [ { character: () => otherCharacter } ],
    };
    globalThis.SceneManager = { _scene: scene };

    // Act
    const result = PopupSpriteLocator.findSpriteCharacterForGameCharacter(gameCharacter);

    // Assert
    expect(result).toBeNull();
  });

  it('returns the sprite that wraps the given game character', () =>
  {
    // Arrange
    const gameCharacter = { name: 'target' };
    const targetSprite = { character: () => gameCharacter };
    const scene = new globalThis.Scene_Map();
    scene._spriteset = {
      _characterSprites: [ { character: () => ({ name: 'other' }) }, targetSprite ],
    };
    globalThis.SceneManager = { _scene: scene };

    // Act
    const result = PopupSpriteLocator.findSpriteCharacterForGameCharacter(gameCharacter);

    // Assert
    expect(result).toBe(targetSprite);
  });
});
//endregion plugins/popups/core/helpers/popup-sprite-locator.test.js
