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

  /**
   * Which generation of the weather this plane was last built against.
   * @type {number}
   */
  this.setWeatherGeneration(0);

  this.baseSprite()
    .addChild(this.weatherPlane());

  this.refreshWeatherLayers();
};

/**
 * Gets the generation of the weather this plane was last built against.
 * @returns {number} The weatherGeneration.
 */
Spriteset_Map.prototype.weatherGeneration = function()
{
  // hand back which weather this plane is currently showing.
  return this._j._weatherGeneration;
};

/**
 * Sets the generation of the weather this plane was last built against.
 * @param {number} newGeneration The new weatherGeneration.
 */
Spriteset_Map.prototype.setWeatherGeneration = function(newGeneration)
{
  // assign which weather this plane is currently showing.
  this._j._weatherGeneration = newGeneration;
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

  this.setWeatherGeneration(WeatherDirector.generation());

  WeatherDirector.layers()
    .forEach(layer => plane.addChild(new Sprite_WeatherLayer(layer, true)));
};

/**
 * Extends {@link Spriteset_Base.update}.<br/>
 * Also crossfades the weather when the sky has moved underneath it.
 *
 * **Nothing else would ever notice.** The plane is populated once, when the spriteset is built, so
 * without this a phase turning over mid-play changes the variables and the audio and leaves the
 * screen showing the previous weather until the player next opens a menu.
 */
J.WEATHER.Aliased.Spriteset_Map.set('update', Spriteset_Map.prototype.update);
Spriteset_Map.prototype.update = function()
{
  // perform original logic.
  J.WEATHER.Aliased.Spriteset_Map.get('update')
    .call(this);

  // and then see whether what is on screen is still what the weather is.
  this.updateWeatherLayers();
};

/**
 * Brings the plane into line with whatever the weather has become.
 *
 * Clearing out the emptied layers happens first and unconditionally, because a layer retired by an
 * earlier change is still draining while a later one arrives - three changes inside one fog's
 * drain would otherwise leave three dead populations on the plane.
 */
Spriteset_Map.prototype.updateWeatherLayers = function()
{
  this.dropDrainedWeatherLayers();

  if (WeatherDirector.hasChangedSince(this.weatherGeneration()) === false) return;

  this.crossfadeWeatherLayers();
};

/**
 * Starts the outgoing weather emptying and the incoming weather arriving.
 *
 * **Both populations are on the plane at once**, which is what makes this a crossfade rather than
 * a cut - and it is also the ceiling on how heavy this can get, since for the length of one drain
 * the screen is carrying roughly double the heaviest preset. Rain and leaves clear in seconds; fog
 * takes a minute or two.
 */
Spriteset_Map.prototype.crossfadeWeatherLayers = function()
{
  const plane = this.weatherPlane();

  this.setWeatherGeneration(WeatherDirector.generation());

  plane.children.forEach(layer => layer.retire());

  // built as a change rather than an arrival, so they stagger in over their own entry queue instead
  // of settling - which would cost millions of iterations in a single frame, in front of a player.
  WeatherDirector.layers()
    .forEach(layer => plane.addChild(new Sprite_WeatherLayer(layer, false)));
};

/**
 * Throws away the retired layers that have finished emptying.
 */
Spriteset_Map.prototype.dropDrainedWeatherLayers = function()
{
  const plane = this.weatherPlane();

  const spent = plane.children.filter(layer => layer.isRetired() === true && layer.isDrained() === true);

  spent.forEach(layer => plane.removeChild(layer));
};
//endregion Spriteset_Map