//region Game_Follower
/**
 * Updates the direction and position based on the preceding character.
 * This forces followers to always face the character infront of them in the follower train.
 * @param {Game_Follower|Game_Player} otherCharacter The character in front of this character in order.
 */
Game_Follower.prototype.pixelFaceCharacter = function(otherCharacter = $gamePlayer)
{
  // grab the most recently added tracking for the previous character in the train.
  const otherPosition = otherCharacter.oldestPositionalRecord();

  // do not update direction if we don't know the preceding character's previous position.
  if (!otherPosition) return;

  // check if the follower is facing up/down.
  const isFacingVertically = Math.abs(otherPosition.y - this.y) > Math.abs(otherPosition.x - this.x);

  // determine which direction to face; only one of these can be true at any given time.
  const shouldFaceDown = isFacingVertically && otherPosition.y > this.y;
  const shouldFaceUp = isFacingVertically && otherPosition.y < this.y;
  const shouldFaceRight = !isFacingVertically && otherPosition.x > this.x;
  const shouldFaceLeft = !isFacingVertically && otherPosition.x < this.x;

  // face the follower the appropriate direction.
  switch (true)
  {
    case shouldFaceDown:
      this.setDirection(J.PIXEL.Directions.DOWN);
      break;
    case shouldFaceUp:
      this.setDirection(J.PIXEL.Directions.UP);
      break;
    case shouldFaceLeft:
      this.setDirection(J.PIXEL.Directions.LEFT);
      break;
    case shouldFaceRight:
      this.setDirection(J.PIXEL.Directions.RIGHT);
      break;
  }
};

/**
 * Extends {@link Game_Follower.update}.<br/>
 * Ensures follower render coordinates always match logical coordinates.
 */
J.PIXEL.Aliased.Game_Follower.set("update", Game_Follower.prototype.update);
Game_Follower.prototype.update = function()
{
  // Perform original logic.
  // perform original logic.
  J.PIXEL.Aliased.Game_Follower.get("update")
    .call(this);

  // Always synchronize render/smoothing coordinates to the logical coordinates.
  if (this.realX() !== this.x || this.realY() !== this.y)
  {
    // Snap the render coordinates to the logical coordinates.
    this.setRealX(this.x)
    this.setRealY(this.y)
  }
};

/**
 * Whether this follower's position is owned by something other than the player's breadcrumb
 * train. The train relocates each follower onto the trail the character ahead of it left behind;
 * if another system is also steering the same follower, both write a position every frame and the
 * sprite visibly fights itself. A follower that answers true here is skipped by the train entirely,
 * on the understanding that whatever claimed it is now responsible for moving it.
 *
 * Pixel movement on its own has no such other system, so the answer is always no here. Ships that
 * introduce one - J-ABS-Pixelistics handing allies to formation movement, for instance - override
 * this to claim their followers.
 * @returns {boolean} True if the follower train must not move this follower, false otherwise.
 */
Game_Follower.prototype.isPixelTrainSuspended = function()
{
  // nothing competes with the follower train under plain pixel movement.
  return false;
};

/**
 * Overwrites {@link Game_CharacterBase.getCollisionPivotY}.<br/>
 * Anchors the follower's collision center near their feet to match the player's
 * depth-biased collision feel. Keeps the follower train visually consistent.
 * @returns {number} The Y pivot offset in tile units.
 */
Game_Follower.prototype.getCollisionPivotY = function()
{
  return 0.70;
};
//endregion Game_Follower