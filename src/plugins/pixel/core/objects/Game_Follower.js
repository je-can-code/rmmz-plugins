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
  const isFacingVertically = Math.abs(otherPosition.y - this._y) > Math.abs(otherPosition.x - this._x);

  // determine which direction to face; only one of these can be true at any given time.
  const shouldFaceDown = isFacingVertically && otherPosition.y > this._y;
  const shouldFaceUp = isFacingVertically && otherPosition.y < this._y;
  const shouldFaceRight = !isFacingVertically && otherPosition.x > this._x;
  const shouldFaceLeft = !isFacingVertically && otherPosition.x < this._x;

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
 * Extends {@link Game_Follower.chaseCharacter}.<br/>
 * Suppresses vanilla chasing when ALLYAI controls this follower, so formation owns movement.
 * @param {Game_Character} character The character to chase (usually the preceding character).
 */
J.PIXEL.Aliased.Game_Follower.set("chaseCharacter", Game_Follower.prototype.chaseCharacter);
Game_Follower.prototype.chaseCharacter = function(character)
{
  // If Ally AI exists and this follower is AI-controlled, defer to formation logic entirely.
  if (J.ABS.EXT.ALLYAI && this.getJabsBattler()) return;

  // Perform original vanilla chase behavior for non-AI followers.
  // perform original logic.
  J.PIXEL.Aliased.Game_Follower.get("chaseCharacter")
    .call(this, character);
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
  if (this._realX !== this._x || this._realY !== this._y)
  {
    // Snap the render coordinates to the logical coordinates.
    this._realX = this._x;
    this._realY = this._y;
  }

  // Defensive: if this follower is an AI-controlled ally and did not move via PIXEL this frame,
  // ensure no residual drift continues. This does not interfere with formation moves.
  if (J.ABS.EXT.ALLYAI && this.getJabsBattler())
  {
    // If there was no active pixel-move input this frame, clamp any lingering movement state.
    if (this.isMovePressed() === false)
    {
      // Reset stop count so the engine considers us stationary immediately.
      this._stopCount = 0;

      // Synchronize the render one more time (belt-and-suspenders).
      this._realX = this._x;
      this._realY = this._y;
    }
  }
};

/**
 * Extends {@link Game_Follower.moveStraight}.<br/>
 * When AllyAI controls this follower and it is idle (not alerted/engaged),
 * block generic straight movement unless PIXEL is actively driving movement.
 * @param {2|4|6|8} direction The cardinal direction to move.
 */
J.PIXEL.Aliased.Game_Follower.set("moveStraight", Game_Follower.prototype.moveStraight);
Game_Follower.prototype.moveStraight = function(direction)
{
  // If AllyAI exists and this follower is AI-controlled, enforce idle guard.
  if (J.ABS.EXT.ALLYAI && this.getJabsBattler())
  {
    // Acquire the JABS battler for engagement/alert state.
    const jabsBattler = this.getJabsBattler();

    // If not engaged and not alerted (formation/idle phase)...
    if (!jabsBattler.isEngaged() && !jabsBattler.isAlerted())
    {
      // Only allow movement if pixel movement is actively pressing (issued this frame).
      if (this.isMovePressed() === false)
      {
        // Block stray straight moves during idle formation.
        return;
      }
    }
  }

  // Perform original logic.
  // perform original logic.
  J.PIXEL.Aliased.Game_Follower.get("moveStraight")
    .call(this, direction);
};

/**
 * Extends {@link Game_Follower.moveDiagonally}.<br/>
 * When AllyAI controls this follower and it is idle (not alerted/engaged),
 * block generic diagonal movement unless PIXEL is actively driving movement.
 * @param {4|6} horz The horizontal component direction (4=left, 6=right).
 * @param {2|8} vert The vertical component direction (2=down, 8=up).
 */
J.PIXEL.Aliased.Game_Follower.set("moveDiagonally", Game_Follower.prototype.moveDiagonally);
Game_Follower.prototype.moveDiagonally = function(horz, vert)
{
  // If AllyAI exists and this follower is AI-controlled, enforce idle guard.
  if (J.ABS.EXT.ALLYAI && this.getJabsBattler())
  {
    // Acquire the JABS battler for engagement/alert state.
    const jabsBattler = this.getJabsBattler();

    // If not engaged and not alerted (formation/idle phase)...
    if (!jabsBattler.isEngaged() && !jabsBattler.isAlerted())
    {
      // Only allow movement if pixel movement is actively pressing (issued this frame).
      if (this.isMovePressed() === false)
      {
        // Block stray diagonal moves during idle formation.
        return;
      }
    }
  }

  // Perform original logic.
  // perform original logic.
  J.PIXEL.Aliased.Game_Follower.get("moveDiagonally")
    .call(this, horz, vert);
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