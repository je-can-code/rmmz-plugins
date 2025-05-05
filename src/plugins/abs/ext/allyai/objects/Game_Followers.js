//region Game_Followers
/**
 * OVERWRITE If you're using this, the followers always show up!
 * @returns {boolean}
 */
J.ABS.EXT.ALLYAI.Aliased.Game_Followers.set('show', Game_Followers.prototype.show);
Game_Followers.prototype.show = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Game_Followers.get('show')
    .call(this);

  // update all allies when choosing "show" as an event command.
  $gameMap.updateAllies();

  // refresh the JABS menu.
  $jabsEngine.requestJabsMenuRefresh = true;
};

/**
 * OVERWRITE If you're using this, the followers always show up!
 * @returns {boolean}
 */
J.ABS.EXT.ALLYAI.Aliased.Game_Followers.set('hide', Game_Followers.prototype.hide);
Game_Followers.prototype.hide = function()
{
  // perform original logic.
  J.ABS.EXT.ALLYAI.Aliased.Game_Followers.get('hide')
    .call(this);

  // update all allies when choosing "hide" as an event command.
  $gameMap.updateAllies();

  // refresh the JABS menu.
  $jabsEngine.requestJabsMenuRefresh = true;
};

/**
 * OVERWRITE Adjust the jumpAll function to prevent jumping to the player
 * when the player is hit.
 */
Game_Followers.prototype.jumpAll = function()
{
  // don't make all the followers jump if the player isn't jumping.
  if (!$gamePlayer.isJumping()) return;

  const playerBattler = $gamePlayer.getJabsBattler();

  // iterate over each follower to make them jump as-needed.
  for (const follower of this._data)
  {
    // skip followers that don't exist.
    if (!follower || !follower.isVisible()) return;

    // grab the follower's battler.
    const battler = follower.getJabsBattler();

    // only jump if the battler isn't engaged, and there is no event running.
    if (battler.isEngaged() || !$gameMap._interpreter.isRunning()) return;

    // determine coordinates to jump to.
    const sx = $gamePlayer.deltaXFrom(follower.x);
    const sy = $gamePlayer.deltaYFrom(follower.y);

    // jump!
    follower.jump(sx, sy);
  }
};

/**
 * Sets whether or not all followers are direction-fixed.
 * @param {boolean} isFixed Whether or not the direction should be fixed.
 */
Game_Followers.prototype.setDirectionFixAll = function(isFixed)
{
  this._data.forEach(follower =>
  {
    // skip followers that don't exist.
    if (!follower) return;

    // grab the follower's battler.
    const battler = follower.getJabsBattler();

    // if the follower doesn't have a battler, then don't check anything.
    if (!battler) return;

    // only lock direction if the battler isn't engaged, and there is no event running.
    if (battler.isEngaged() || !$gameMap._interpreter.isRunning()) return;

    // set their direction to be whatever the player's is.
    follower.setDirection(isFixed);
  });
};
//endregion Game_Followers