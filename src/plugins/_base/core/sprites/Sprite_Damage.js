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

/**
 * Extends {@link Sprite_Damage.createBitmap}.<br/>
 * Also raises the popup's drawing surface to the resolution of the display.
 *
 * A damage number is the text a player looks at more than any other in an action game, and it was
 * the last surface still being rasterized at logical size and magnified on its way to the screen -
 * so a crit landed with softer edges than the nameplate sitting directly above it.
 *
 * Every popup surface funnels through here, the icon's included, which is what makes this the whole
 * fix. The icon is unaffected in appearance: its source art is unscaled, so blitting it into a
 * scaled context magnifies it exactly as much as the screen was going to anyway.
 * @param {number} width The width of the popup surface.
 * @param {number} height The height of the popup surface.
 * @returns {Bitmap}
 */
J.BASE.Aliased.Sprite_Damage.set('createBitmap', Sprite_Damage.prototype.createBitmap);
Sprite_Damage.prototype.createBitmap = function(width, height)
{
  // perform original logic.
  const bitmap = J.BASE.Aliased.Sprite_Damage.get('createBitmap')
    .call(this, width, height);

  // the caller keeps drawing at the size it asked for; there are simply more pixels behind it now.
  bitmap.applyDeviceScale(Graphics.deviceScale);

  return bitmap;
};
//endregion Sprite_Damage
