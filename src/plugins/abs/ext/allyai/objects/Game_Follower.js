//region Game_Follower
/**
 * OVERWRITE Adjust the chaseCharacter function to prevent chasing the player
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

//endregion Game_Follower