//region Spriteset_Map
import Sprite_WeatherLayer from './Sprite_WeatherLayer.js';
import WeatherDirector from './../managers/WeatherDirector.js';

/**
 * Extends {@link Spriteset_Map.createLowerLayer}.<br/>
 * Also builds the plane the weather is drawn on.
 */
J.WEATHER.Aliased.Spriteset_Map.set('createLowerLayer', Spriteset_Map.prototype.createLowerLayer);
Spriteset_Map.prototype.createLowerLayer = function()
{
  // perform original logic.
  J.WEATHER.Aliased.Spriteset_Map.get('createLowerLayer')
    .call(this);

  // also build the weather.
  this.createWeatherPlane();
};

/**
 * Builds the plane the weather is drawn on, and populates it.
 *
 * **Weather goes inside the base sprite, which is what makes it part of the world rather than a
 * layer floating over one.** `_baseColorFilter` is attached there, so rain at midnight is
 * midnight-coloured rain - which is the honest answer to the question the screen tone is asking.
 * You cannot see a downpour at Moontide the way you can see one at noon, and weather drawn outside
 * the tone reads as bright white confetti over a dark blue world.
 *
 * That places it correctly against everything else without any index arithmetic. Appended after the
 * tilemap, so it draws over the terrain and the characters standing on it. Inside `_baseSprite`, so
 * it is beneath the caption plane, the ambient mask and the popup plane - every one of which is
 * information about the world rather than part of it, and none of which should be rained on.
 *
 * Being beneath the mask matters as much as being inside the tone: rain falling through a
 * pitch-black cavern should be rain you cannot see.
 */
Spriteset_Map.prototype.createWeatherPlane = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * The plane the weather is drawn on.
   * @type {Sprite}
   */
  this.setWeatherPlane(new Sprite());

  this.baseSprite()
    .addChild(this.weatherPlane());

  this.refreshWeatherLayers();
};

/**
 * Gets the plane the weather is drawn on.
 * @returns {Sprite} The weatherPlane.
 */
Spriteset_Map.prototype.weatherPlane = function()
{
  // hand back the plane the weather is drawn on.
  return this._j._weatherPlane;
};

/**
 * Sets the plane the weather is drawn on.
 * @param {Sprite} newWeatherPlane The new weatherPlane.
 */
Spriteset_Map.prototype.setWeatherPlane = function(newWeatherPlane)
{
  // assign the plane the weather is drawn on.
  this._j._weatherPlane = newWeatherPlane;
};

/**
 * Rebuilds the plane's contents from whatever the weather currently is.
 *
 * Torn down and rebuilt whole rather than reconciled, because a layer's population is fixed at the
 * moment it is created - the density it was built for *is* the layer. Changing weather therefore
 * means new layers, and reconciling two lists of things that are all being replaced anyway would be
 * bookkeeping in exchange for nothing.
 */
Spriteset_Map.prototype.refreshWeatherLayers = function()
{
  const plane = this.weatherPlane();

  plane.removeChildren();

  WeatherDirector.layers()
    .forEach(layer => plane.addChild(new Sprite_WeatherLayer(layer)));
};
//endregion Spriteset_Map