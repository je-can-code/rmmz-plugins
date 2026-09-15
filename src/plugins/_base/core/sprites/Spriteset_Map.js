//region Spriteset_Map
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
//endregion Spriteset_Map
