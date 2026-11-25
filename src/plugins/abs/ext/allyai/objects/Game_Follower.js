//region Game_Follower
/**
 * Extends {@link #chaseCharacter}.<br/>
 * Adjust the chaseCharacter function to prevent chasing the player
 * while this follower is engaged.
 * @param {Game_Character} character The character this follower is following.
 */
J.ABS.EXT.ALLYAI.Aliased.Game_Follower.set('chaseCharacter', Game_Follower.prototype.chaseCharacter);
Game_Follower.prototype.chaseCharacter = function(character)
{
  // if this isn't a valid battler or followers aren't being shown, then don't control them.
  if (!this.canObeyJabsAi())
  {
    // perform original logic.
    J.ABS.EXT.ALLYAI.Aliased.Game_Follower.get('chaseCharacter')
      .call(this, character);
  }
};

/**
 * Determines whether or not this follower should be controlled by the {@link JABS_AiManager}.<br>
 * @returns {boolean} True if this follower should be controlled, false otherwise.
 */
Game_Follower.prototype.canObeyJabsAi = function()
{
  // if we are not visible, then we should not be controlled by JABS AI.
  if (!this.isVisible()) return false;

  // if we do not have a JABS battler, then we should not be controlled by JABS AI.
  if (!this.getJabsBattler()) return false;

  // lets get controlled!
  return true;
};

/**
 * Extends {@link #setDirectionFix}.<br/>
 * Allows JABS to prevent the direction fix from applying as-needed.
 */
J.ABS.EXT.ALLYAI.Aliased.Game_Follower.set('setDirectionFix', Game_Follower.prototype.setDirectionFix);
Game_Follower.prototype.setDirectionFix = function(isDirectionFixed)
{
  // grab the follower's battler.
  const battler = this.getJabsBattler();
  if (!battler)
  {
    // perform original logic if we are not.
    J.ABS.EXT.ALLYAI.Aliased.Game_Follower.get('setDirectionFix')
      .call(this, isDirectionFixed);

    // do no further processing.
    return;
  }

  // only lock direction if the battler isn't engaged, and there is no event running.
  if (battler.isEngaged() || !$gameMap._interpreter.isRunning()) return;

  // perform original logic if we are not.
  J.ABS.EXT.ALLYAI.Aliased.Game_Follower.get('setDirectionFix')
    .call(this, isDirectionFixed);
};

/**
 * Jump to the player from wherever you are.
 */
Game_Follower.prototype.jumpToPlayer = function()
{
  const sx = $gamePlayer.deltaXFrom(this.x);
  const sy = $gamePlayer.deltaYFrom(this.y);
  this.jump(sx, sy);
};

/**
 * Extends {@link #realMoveSpeed}.<br/>
 * Also lets an ally sprint back into the party's stance when it has strayed far from it.
 *
 * A follower copies the player's speed every frame, so an ally is never faster than its leader on its own.
 * That leaves an ally kept in front of the leader stranded behind them after a turn, for as long as they
 * keep walking. The sprint is what lets it get back in front.
 * @returns {number}
 */
J.ABS.EXT.ALLYAI.Aliased.Game_Follower.set('realMoveSpeed', Game_Follower.prototype.realMoveSpeed);
Game_Follower.prototype.realMoveSpeed = function()
{
  // perform original logic.
  const originalSpeed = J.ABS.EXT.ALLYAI.Aliased.Game_Follower.get('realMoveSpeed')
    .call(this);

  // a follower not racing back into its stance moves at the party's pace.
  if (!this.isCatchingUpToStance()) return originalSpeed;

  // a follower racing back into its stance gets a burst of speed.
  return originalSpeed + J.ABS.EXT.ALLYAI.Metadata.StanceCatchUpSpeedBoost;
};

/**
 * Whether this follower is sprinting back into the party's stance right now.
 * @returns {boolean} True if it is sprinting, false otherwise.
 */
Game_Follower.prototype.isCatchingUpToStance = function()
{
  // grab the follower's battler.
  const battler = this.getJabsBattler();

  // a follower without a battler has no stance to keep.
  if (!battler) return false;

  // the battler knows whether it is sprinting.
  return battler.isStanceCatchingUp();
};

//endregion Game_Follower