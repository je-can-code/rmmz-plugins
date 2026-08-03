/**
 * Gets all valid directions supported by the default system.
 * @returns {number[]}
 */
Game_CharacterBase.prototype.getValidDirections = function()
{
  return [ ...this.getValidCardinalDirections(), ...this.getValidDiagonalDirections() ];
};

/**
 * Gets all valid diagonal directions.
 * @returns {number[]}
 */
Game_CharacterBase.prototype.getValidDiagonalDirections = function()
{
  return [ 1, 3, 7, 9 ];
};

/**
 * Gets all valid cardinal directions.
 * @returns {number[]}
 */
Game_CharacterBase.prototype.getValidCardinalDirections = function()
{
  return [ 2, 4, 6, 8 ];
};

/**
 * Determines if a numeric directional input is diagonal.
 * @param {number} direction The direction to check.
 * @returns {boolean} True if the input is diagonal, false otherwise.
 */
Game_CharacterBase.prototype.isDiagonalDirection = function(direction)
{
  return [ 1, 3, 7, 9 ].contains(direction);
};

/**
 * Determines if a numeric directional input is straight.
 * @param {number} direction The direction to check.
 * @returns {boolean} True if the input is straight, false otherwise.
 */
Game_CharacterBase.prototype.isStraightDirection = function(direction)
{
  return [ 2, 4, 6, 8 ].contains(direction);
};

/**
 * Determines the horz/vert directions to move based on a diagonal direction.
 * @param {[horz: number, vert: number]} direction The diagonal-only numeric direction to move.
 */
Game_CharacterBase.prototype.getDiagonalDirections = function(direction)
{
  switch (direction)
  {
    case 1:
      return [ 4, 2 ];
    case 3:
      return [ 6, 2 ];
    case 7:
      return [ 4, 8 ];
    case 9:
      return [ 6, 8 ];
  }
};

/**
 * Converts a horizontal/vertical direction pair into a single 8-dir code.
 * Valid inputs are (4|6) for horz and (2|8) for vert. Returns 0 if invalid.
 * @param {4|6} horz The horizontal component (4=left, 6=right).
 * @param {2|8} vert The vertical component (2=down, 8=up).
 * @returns {1|3|7|9|0} The 8-dir code for the diagonal, or 0 if invalid.
 */
Game_CharacterBase.prototype.directionFromHorzVert = function(horz, vert)
{
  // Check for down-left (1).
  if (horz === 4 && vert === 2)
  {
    // Return direction 1 for down-left.
    return 1;
  }

  // Check for down-right (3).
  if (horz === 6 && vert === 2)
  {
    // Return direction 3 for down-right.
    return 3;
  }

  // Check for up-left (7).
  if (horz === 4 && vert === 8)
  {
    // Return direction 7 for up-left.
    return 7;
  }

  // Check for up-right (9).
  if (horz === 6 && vert === 8)
  {
    // Return direction 9 for up-right.
    return 9;
  }

  // Invalid combination; return 0.
  return 0;
};

/**
 * Gets the number of frames this character has been standing still.
 * @returns {number} The stopCount.
 */
Game_CharacterBase.prototype.stopCount = function()
{
  // hand back the number of frames this character has been standing still.
  return this._stopCount;
};

/**
 * Sets the number of frames this character has been standing still.
 * @param {number} newStopCount The new stopCount.
 */
Game_CharacterBase.prototype.setStopCount = function(newStopCount)
{
  // assign the number of frames this character has been standing still.
  this._stopCount = newStopCount;
};
/**
 * Sets the x coordinate of this character on the map.
 *
 * RMMZ exposes the matching getter as the native `x` property rather than a method, so reads go
 * through `this.x` while writes come here- defining an `x()` method would clobber that property.
 * @param {number} newX The new x coordinate.
 */
Game_CharacterBase.prototype.setX = function(newX)
{
  // assign the x coordinate of this character on the map.
  this._x = newX;
};

/**
 * Sets the y coordinate of this character on the map.
 *
 * Reads go through the native `y` property, for the same reason described on {@link #setX}.
 * @param {number} newY The new y coordinate.
 */
Game_CharacterBase.prototype.setY = function(newY)
{
  // assign the y coordinate of this character on the map.
  this._y = newY;
};

/**
 * Gets the interpolated x coordinate this character is rendered at mid-step.
 * @returns {number} The realX.
 */
Game_CharacterBase.prototype.realX = function()
{
  // hand back the interpolated x coordinate.
  return this._realX;
};

/**
 * Sets the interpolated x coordinate this character is rendered at mid-step.
 * @param {number} newRealX The new realX.
 */
Game_CharacterBase.prototype.setRealX = function(newRealX)
{
  // assign the interpolated x coordinate.
  this._realX = newRealX;
};

/**
 * Gets the interpolated y coordinate this character is rendered at mid-step.
 * @returns {number} The realY.
 */
Game_CharacterBase.prototype.realY = function()
{
  // hand back the interpolated y coordinate.
  return this._realY;
};

/**
 * Sets the interpolated y coordinate this character is rendered at mid-step.
 * @param {number} newRealY The new realY.
 */
Game_CharacterBase.prototype.setRealY = function(newRealY)
{
  // assign the interpolated y coordinate.
  this._realY = newRealY;
};
