//region Spriteset_Map
import Sprite_CaptionPlane from './Sprite_CaptionPlane.js';

/**
 * Gets the tilemap rendering the current map.
 * @returns {Tilemap} The tilemap.
 */
Spriteset_Map.prototype.tilemap = function()
{
  // hand back the tilemap rendering the current map.
  return this._tilemap;
};

/**
 * Gets the sprite rendering the weather over the current map.
 *
 * Worth having a name for because the weather is a useful landmark in the display tree rather than
 * only a visual effect: it is the last thing the engine itself adds to the spriteset, so it marks
 * the boundary between what belongs to the world and what a plugin has layered on top of it.
 * @returns {Weather} The weather.
 */
Spriteset_Map.prototype.weather = function()
{
  // hand back the sprite rendering the weather.
  return this._weather;
};

/**
 * Gets the sprites representing every character on the map.
 * @returns {Sprite_Character[]} The characterSprites.
 */
Spriteset_Map.prototype.characterSprites = function()
{
  // hand back the sprites representing every character on the map.
  return this._characterSprites;
};

/**
 * Sets the sprites representing every character on the map.
 * @param {Sprite_Character[]} newCharacterSprites The new characterSprites.
 */
Spriteset_Map.prototype.setCharacterSprites = function(newCharacterSprites)
{
  // assign the sprites representing every character on the map.
  this._characterSprites = newCharacterSprites;
};

/**
 * Extends {@link Spriteset_Map.createLowerLayer}.<br/>
 * Also builds the plane that every character's captions are drawn on.
 */
J.BASE.Aliased.Spriteset_Map.set('createLowerLayer', Spriteset_Map.prototype.createLowerLayer);
Spriteset_Map.prototype.createLowerLayer = function()
{
  // perform original logic.
  J.BASE.Aliased.Spriteset_Map.get('createLowerLayer')
    .call(this);

  // also build the plane that captions are drawn on.
  this.createCaptionPlane();
};

/**
 * Builds the plane that every character's captions are drawn on.
 *
 * Added to the spriteset rather than into the tilemap, and that is the entire point: everything
 * painted into `_baseSprite` is inside `_baseColorFilter`, so the tilemap and everything in it takes
 * the screen tone. A caption is not part of the world and should not be graded like one.
 *
 * **Slotted directly beneath the weather, and that index is doing real work.** J-Lighting inserts
 * its ambient mask at the weather's index plus one, so taking the weather's own index puts this
 * plane underneath the mask no matter which of the two plugins runs first. That is deliberate:
 * unlike the tone, the mask is not a colour grade - it multiplies the scene against darkness with
 * holes cut for each light, which is a statement about what can be seen. Captions are meant to obey
 * that. A named enemy in torchlight and an unnamed one in an unlit corner is the behavior, and it
 * costs nothing but the choice of index.
 *
 * Damage popups are the exception and do not come here; J-Popups gives them a plane of their own
 * above the mask, because being hit is felt rather than seen.
 */
Spriteset_Map.prototype.createCaptionPlane = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * The plane that every character's captions are drawn on.
   * @type {Sprite_CaptionPlane}
   */
  this.setCaptionPlane(new Sprite_CaptionPlane());

  const weatherIndex = this.getChildIndex(this.weather());

  this.addChildAt(this.captionPlane(), weatherIndex);
};

/**
 * Gets the plane that every character's captions are drawn on.
 * @returns {Sprite_CaptionPlane} The captionPlane.
 */
Spriteset_Map.prototype.captionPlane = function()
{
  // hand back the plane the captions are drawn on.
  return this._j._captionPlane;
};

/**
 * Sets the plane that every character's captions are drawn on.
 * @param {Sprite_CaptionPlane} newCaptionPlane The new captionPlane.
 */
Spriteset_Map.prototype.setCaptionPlane = function(newCaptionPlane)
{
  // assign the plane the captions are drawn on.
  this._j._captionPlane = newCaptionPlane;
};

/**
 * Extends {@link Spriteset_Map.update}.<br/>
 * Also brings the caption plane's roster in line with who is actually on the map.
 *
 * The reconcile happens *before* the original runs, and that ordering is load-bearing. The original
 * is what walks the spriteset's children, which is what updates every caption on the plane - and a
 * caption whose character sprite was destroyed since the last frame throws the moment it reads a
 * position off it. J-ABS destroys expired action and loot sprites routinely, so this is the normal
 * case rather than an unlucky one. Correcting the roster first means every caption that gets walked
 * still has a character to ask.
 */
J.BASE.Aliased.Spriteset_Map.set('update', Spriteset_Map.prototype.update);
Spriteset_Map.prototype.update = function()
{
  // admit arrivals and evict departures before anything walks the plane.
  this.captionPlane()
    .reconcileCaptions(this.characterSprites());

  // perform original logic.
  J.BASE.Aliased.Spriteset_Map.get('update')
    .call(this);
};
//endregion Spriteset_Map