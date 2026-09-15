//region Spriteset_Map
import Sprite_LightMask from './Sprite_LightMask.js';

/**
 * Extends {@link Spriteset_Map.createLowerLayer}.<br/>
 * Builds the light mask and slots it directly above the weather.
 */
J.LIGHTING.Aliased.Spriteset_Map.set('createLowerLayer', Spriteset_Map.prototype.createLowerLayer);
Spriteset_Map.prototype.createLowerLayer = function()
{
  // perform original logic.
  J.LIGHTING.Aliased.Spriteset_Map.get('createLowerLayer')
    .call(this);

  // also create the light mask.
  this.createLightMask();
};

/**
 * Creates the light mask and places it in the display tree.
 *
 * The mask is inserted at an index rather than appended, and that one decision draws the line
 * between what goes dark and what does not. Appending would put it above or below the other
 * plugins' spriteset layers depending purely on the order `plugins.js` happens to list them, which
 * is the kind of dependency that works until somebody reorders their plugin manager.
 *
 * Indexing off the weather is deterministic whoever runs first, and it puts the line exactly where
 * it already sits for the screen tone: everything painted into the base sprite - the tilemap, the
 * characters, their captions, the damage popups - is below and gets darkened. Everything a plugin
 * adds to the spriteset itself is above and stays lit, which is where J-ABS already puts its cast
 * previews and debug hitboxes. **Adding yourself to the spriteset is how you opt out of the dark.**
 *
 * Weather stays below deliberately. Rain falling through a pitch-black cavern should be rain you
 * cannot see.
 */
Spriteset_Map.prototype.createLightMask = function()
{
  const mask = new Sprite_LightMask();
  const weatherIndex = this.getChildIndex(this.weather());

  this.setLightMask(mask);
  this.addChildAt(mask, weatherIndex + 1);
};

/**
 * Gets the sprite taking light away from this map.
 * @returns {Sprite_LightMask} The lightMask.
 */
Spriteset_Map.prototype.lightMask = function()
{
  // hand back the mask.
  return this._j._lighting._lightMask;
};

/**
 * Sets the sprite taking light away from this map.
 * @param {Sprite_LightMask} mask The new mask.
 */
Spriteset_Map.prototype.setLightMask = function(mask)
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with lighting.
   */
  this._j._lighting ||= {};

  this._j._lighting._lightMask = mask;
};
//endregion Spriteset_Map