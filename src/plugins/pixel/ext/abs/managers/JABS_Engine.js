//region JABS_Engine
/**
 * Extends {@link JABS_Engine.getBattlerAabbModel}.<br>
 * Enemy battlers with PIXEL hitbox-size data provide their own feet-anchored
 * rectangular AABB so JABS combat collision and overlays stay synchronized.
 * @param {Game_CharacterBase} character The character whose AABB is being queried.
 * @returns {JABS_Aabb}
 */
J.PIXEL.EXT.ABS.Aliased.JABS_Engine.set('getBattlerAabbModel', JABS_Engine.getBattlerAabbModel);
JABS_Engine.getBattlerAabbModel = function(character)
{
  // if the character exposes a custom battler hitbox model, then use it.
  if (character && typeof character.getPixelAbsBattlerAabbModel === 'function')
  {
    const customAabb = character.getPixelAbsBattlerAabbModel();

    // if a custom model exists, then it is the single source of truth.
    if (customAabb)
    {
      return customAabb;
    }
  }

  // otherwise, perform original logic.
  return J.PIXEL.EXT.ABS.Aliased.JABS_Engine.get('getBattlerAabbModel').call(this, character);
};
//endregion JABS_Engine