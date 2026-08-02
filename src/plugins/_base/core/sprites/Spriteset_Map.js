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
