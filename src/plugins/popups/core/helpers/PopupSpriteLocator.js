//region PopupSpriteLocator
/**
 * Locates map sprites for popup anchoring.
 */
class PopupSpriteLocator
{
  /**
   * Locates the {@link Sprite_Character} that renders a given {@link Game_Character} on the current map scene.
   *
   * @param {Game_Character} gameCharacter The logical map character.
   * @returns {Sprite_Character|null} The sprite wrapper when present.
   */
  static findSpriteCharacterForGameCharacter(gameCharacter)
  {
    const scene = SceneManager._scene;

    if (!scene || scene.constructor !== Scene_Map)
    {
      return null;
    }

    const spriteset = scene._spriteset;

    if (!spriteset || !spriteset._characterSprites)
    {
      return null;
    }

    const list = spriteset._characterSprites;

    for (let i = 0; i < list.length; i++)
    {
      const spriteCharacter = list[i];

      if (spriteCharacter.character() === gameCharacter)
      {
        return spriteCharacter;
      }
    }

    return null;
  }
}

export default PopupSpriteLocator;
//endregion PopupSpriteLocator