//region Spriteset_Base
/**
 * Gets the sprite everything belonging to the world is drawn into.
 *
 * Worth having a name for because it is a boundary rather than merely a container: `_baseColorFilter`
 * is attached here, and a PIXI filter repaints its own subtree and nothing else. So whether something
 * is parented inside this sprite is exactly the question of whether the screen tone reaches it -
 * whether it is part of the world or a layer floating over one.
 *
 * Rain belongs inside. A nameplate does not.
 * @returns {Sprite} The baseSprite.
 */
Spriteset_Base.prototype.baseSprite = function()
{
  // hand back the sprite the world is drawn into.
  return this._baseSprite;
};
//endregion Spriteset_Base