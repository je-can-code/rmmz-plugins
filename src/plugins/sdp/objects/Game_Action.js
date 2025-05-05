//region Game_Action
//region unlock SDP
/**
 * Extends {@link #applyGlobal}.<br>
 * Also handles any SDP effects such as unlocking.
 */
J.SDP.Aliased.Game_Action.set('applyGlobal', Game_Action.prototype.applyGlobal);
Game_Action.prototype.applyGlobal = function()
{
  // perform original logic.
  J.SDP.Aliased.Game_Action.get('applyGlobal')
    .call(this);

  // apply the SDP effects if appropriate.
  this.applySdpUnlock();
};

/**
 * Handles any SDP-related effects for this action.
 * @param {Game_Actor|Game_Enemy} target The target to apply the SDP-related effect to.
 */
Game_Action.prototype.applySdpUnlock = function(target)
{
  // check if the SDP can be unlocked.
  if (this.canUnlockSdp())
  {
    // perform the unlock.
    this.applySdpUnlockEffect();
  }
};

/**
 * Determines whether or not the SDP on this action can be unlocked.
 * @returns {boolean} True if the SDP can be unlocked, false otherwise.
 */
Game_Action.prototype.canUnlockSdp = function()
{
  // grab the item out.
  const item = this.item();

  // if there is no item, no unlocking panels.
  if (!item) return false;

  // if it is a skill, then no unlocking panels.
  if (item instanceof RPG_Skill) return false;

  // if this doesn't unlock a panel, then no unlocking panels.
  if (!item.sdpKey) return false;

  // unlock that sdp!
  return true;
};

/**
 * Performs any unlock effects associated with the attached item's SDP tag.
 */
Game_Action.prototype.applySdpUnlockEffect = function()
{
  // grab the item out.
  const item = this.item();

  // unlock the SDP.
  $gameParty.unlockSdp(item.sdpKey);
};
//endregion unlock SDP

//region SDP point mod
/**
 * Extends {@link #apply}.<br/>
 * Also applies SDP point modifications as a result of the action execution.
 */
J.SDP.Aliased.Game_Action.set('apply', Game_Action.prototype.apply);
Game_Action.prototype.apply = function(target)
{
  // perform original logic.
  J.SDP.Aliased.Game_Action.get('apply')
    .call(this, target);

  // also attempt to apply SDP point modifications.
  this.applySdpPointMod(target);
};

/**
 * Handles SDP point modification from action execution.
 * @param {Game_Actor|Game_Enemy} target The target to apply the SDP point modification to.
 */
Game_Action.prototype.applySdpPointMod = function(target)
{
  // check if this is an SDP pickup.
  if (this.isSdpPointMod(target))
  {
    // gain the points on the item.
    this.modSdpPointsOnApply(target);
  }
};

/**
 * Determines whether or not this action grants SDP points.
 * @param {Game_Actor|Game_Enemy} target The target to apply the SDP point modification to.
 * @returns {boolean}
 */
Game_Action.prototype.isSdpPointMod = function(target)
{
  // grab the item out.
  const item = this.item();

  // if there is no item, no gaining SDP points.
  if (!item) return false;

  // if it is a skill, then no using skills to gain points.
  if (item instanceof RPG_Skill) return false;

  // SDP points can only be applied to actors.
  if (target.isEnemy()) return false;

  // if there are no points to gain from this item, then don't gain points.
  if (RPGManager.getNumberFromNoteByRegex(item, J.SDP.RegExp.SdpPoints) === 0) return false;

  // gain some points!
  return true;
};

/**
 * Gains (or loses) the points from the pickup against the target actor.
 * @param {Game_Actor|Game_Enemy} target The target to apply the SDP point modification to.
 */
Game_Action.prototype.modSdpPointsOnApply = function(target)
{
  // grab the item out.
  const item = this.item();

  // determine the points modified.
  const points = RPGManager.getNumberFromNoteByRegex(item, J.SDP.RegExp.SdpPoints);

  // apply the points to the target actor.
  target.modSdpPoints(points);
};
//endregion SDP point mod
//endregion Game_Action