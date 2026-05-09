//region JuiceMapSpriteFinder
/**
 * Resolves the {@link Sprite_Character} that renders a map {@link Game_Character}.
 */
class JuiceMapSpriteFinder
{
  /**
   * Finds the character sprite for the given logical character on the current map scene.
   * @param {Game_Character} mapCharacter The character whose sprite we want.
   * @returns {Sprite_Character|null}
   */
  static findSpriteCharacterFor(mapCharacter)
  {
    const scene = SceneManager._scene;
    if (!(scene instanceof Scene_Map))
    {
      return null;
    }

    const spriteset = scene._spriteset;
    if (!spriteset)
    {
      return null;
    }

    return spriteset.findTargetSprite(mapCharacter);
  }
}
//endregion JuiceMapSpriteFinder