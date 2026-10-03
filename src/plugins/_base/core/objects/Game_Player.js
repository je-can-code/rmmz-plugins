//region Game_Player
/**
 * Determines if this character is actually a player.
 * @returns {boolean}
 */
Game_Player.prototype.isPlayer = function()
{
  return true;
};

//region reserved transfer
/**
 * Gets the x coordinate a reserved transfer will land the player on.<br/>
 * Vanilla holds a reserved landing in fields it only ever reads itself, and offers an accessor for
 * none of it but the map ({@link Game_Player#newMapId}). Anything that has to look at a transfer
 * between its reservation and its arrival reads the rest through these.
 * @returns {number} The reserved x coordinate, in tiles.
 */
Game_Player.prototype.newX = function()
{
  return this._newX;
};

/**
 * Gets the y coordinate a reserved transfer will land the player on.
 * See {@link Game_Player#newX} for why these exist.
 * @returns {number} The reserved y coordinate, in tiles.
 */
Game_Player.prototype.newY = function()
{
  return this._newY;
};

/**
 * Gets the direction a reserved transfer will leave the player facing.
 * See {@link Game_Player#newX} for why these exist.
 * @returns {number} The reserved direction, where 0 keeps whatever the player already faces.
 */
Game_Player.prototype.newDirection = function()
{
  return this._newDirection;
};
//endregion reserved transfer
//endregion Game_Player