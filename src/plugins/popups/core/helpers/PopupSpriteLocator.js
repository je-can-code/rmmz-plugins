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

    // when not scene  or  scene.constructor  differs from  Scene_Map, take this branch.
    if (!scene || scene.constructor !== Scene_Map)
    {
      return null;
    }

    // capture spriteset for downstream policy in this routine.
    const spriteset = scene._spriteset;

    // when not spriteset  or  not spriteset._characterSprites, take this branch.
    if (!spriteset || !spriteset._characterSprites)
    {
      return null;
    }

    // capture list for downstream policy in this routine.
    const list = spriteset._characterSprites;

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < list.length; i++)
    {
      const spriteCharacter = list[i];

      // when spriteCharacter.character()  equals  gameCharacter, take this branch.
      if (spriteCharacter.character() === gameCharacter)
      {
        return spriteCharacter;
      }
    }

    // hand back null to the caller.
    return null;
  }
}

export default PopupSpriteLocator;
//endregion PopupSpriteLocator