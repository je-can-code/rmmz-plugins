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