//region Sprite_Character (juice flip hook)
/**
 * Extends {@link Sprite_Character#updatePosition}.<br/>
 * When a flip-body juice effect is active, compensates for the anchor shift from (0.5, 1)
 * to (0.5, 0.5) by adding half the sprite height back to y each frame so the character
 * does not visually drop during the animation.
 */
J.ABS.EXT.JUICE.Aliased.Sprite_Character.set('updatePosition', Sprite_Character.prototype.updatePosition);
Sprite_Character.prototype.updatePosition = function()
{
  // perform original logic.
  J.ABS.EXT.JUICE.Aliased.Sprite_Character.get('updatePosition').call(this);

  if (this.juiceFlipping() === true)
  {
    this.y -= this.height / 2;
  }
};

//region properties
/**
 * Gets the juice flipping.
 * @returns {*} The juiceFlipping.
 */
Sprite_Character.prototype.juiceFlipping = function()
{
  // hand back the juice flipping.
  return this._juiceFlipping;
};
//endregion properties
//endregion Sprite_Character (juice flip hook)
