//region Game_Player
/**
 * Overwrites {@link #getInputDirection}.<br/>
 * Leverages dir8 instead of dir4 by default.
 * @returns {number}
 */
Game_Player.prototype.getInputDirection = function()
{
  return Input.dir8;
};

/**
 * Moves straight in a given direction.
 * If there is an underlying diagonal direction, then move diagonally.
 * @param {number} direction The direction being moved.
 */
J.ABS.EXT.DIAG.Aliased.Game_Player.set('moveStraight', Game_Player.prototype.moveStraight);
Game_Player.prototype.moveStraight = function(direction)
{
  // check if the direction being moved is actually a diagonal direction.
  if (this.isDiagonalDirection(direction) === false)
  {
    // perform original logic.
    return J.ABS.EXT.DIAG.Aliased.Game_Player.get('moveStraight')
      .call(this, direction);
  }

  // break down the diagonal directions from the single directional.
  const [ horz, vert ] = this.getDiagonalDirections(direction);

  // execute the diagonal movement.
  this.moveDiagonally(horz, vert);

  // return the direction moved.
  return direction;
};

/**
 * Extends built-in diagonal movement to also move either horizontally or vertically
 * if a move diagonally should fail.
 * @param {number} horz The horizontal piece of the direction to move.
 * @param {number} vert The vertical piece of the direction to move.
 */
J.ABS.EXT.DIAG.Aliased.Game_Player.set('moveDiagonally', Game_Player.prototype.moveDiagonally);
Game_Player.prototype.moveDiagonally = function(horz, vert)
{
  // perform original logic.
  J.ABS.EXT.DIAG.Aliased.Game_Player.get('moveDiagonally')
    .call(this, horz, vert);

  // check if the movement failed.
  if (this.isMovementSucceeded() === true) return;

  // try sliding vertically.
  this.setMovementSuccess(this.canPass(this.x, this.y, vert));
  if (this.isMovementSucceeded())
  {
    this.moveStraight(vert);
  }

  // try sliding horizontally.
  this.setMovementSuccess(this.canPass(this.x, this.y, horz));
  if (this.isMovementSucceeded())
  {
    this.moveStraight(horz);
  }

  // don't move at all.
};
//endregion Game_Player