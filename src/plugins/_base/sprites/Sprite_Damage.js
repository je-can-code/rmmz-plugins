//region Sprite_Damage
/**
 * Gets the remaining frames before this popup disappears.
 * @returns {number} The duration.
 */
Sprite_Damage.prototype.duration = function()
{
  // hand back the remaining frames before this popup disappears.
  return this._duration;
};

/**
 * Sets the remaining frames before this popup disappears.
 * @param {number} newDuration The new duration.
 */
Sprite_Damage.prototype.setDuration = function(newDuration)
{
  // assign the remaining frames before this popup disappears.
  this._duration = newDuration;
};

/**
 * Gets the rgba flash applied while this popup is displayed.
 * @returns {number[]} The flashColor.
 */
Sprite_Damage.prototype.flashColor = function()
{
  // hand back the rgba flash applied while this popup is displayed.
  return this._flashColor;
};
//endregion Sprite_Damage
