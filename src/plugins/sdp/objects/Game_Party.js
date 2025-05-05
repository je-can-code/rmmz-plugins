//region Game_Party
/**
 * Extends {@link #initialize}.<br>
 * Also initializes our SDP members.
 */
J.SDP.Aliased.Game_Party.set('initialize', Game_Party.prototype.initialize);
Game_Party.prototype.initialize = function()
{
  // perform original logic.
  J.SDP.Aliased.Game_Party.get('initialize')
    .call(this);

  // init sdp members.
  this.initSdpMembers();
};

/**
 * Initializes all members of the sdp system.
 */
Game_Party.prototype.initSdpMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the sdp system.
   */
  this._j._sdp ||= {};
};

/**
 * Checks if any member of the party has any unlocked panels.
 * @returns {boolean} True if at least one member has at least one panel unlocked, false otherwise.
 */
Game_Party.prototype.hasAnyUnlockedSdps = function()
{
  return $gameActors.actors()
    .some(actor => actor.hasAnyUnlockedSdps());
};

/**
 * Unlocks an SDP being tracked by its key.
 * @param {string} key The key of the SDP to unlock.
 */
Game_Party.prototype.unlockSdp = function(key)
{
  // validate the panel exists before unlocking.
  if (J.SDP.Metadata.panelsMap.has(key) === false)
  {
    // stop processing.
    console.error(`The SDP key of ${key} was not found in the list of panels to unlock.`);
    return;
  }

  // unlock the panel.
  $gameActors.actors()
    .forEach(member => member.unlockSdpByKey(key));
};

/**
 * Checks if a particular panel is unlocked for the whole party.
 * @param {string} key The key of the panel to check.
 * @returns {boolean} True if every actor has it unlocked, false otherwise.
 */
Game_Party.prototype.isSdpUnlocked = function(key)
{
  return $gameActors.actors()
    .every(actor => actor.isSdpUnlocked(key));
};

/**
 * Locks a panel for all party members.
 * @param {string} key The key of the panel unlock.
 */
Game_Party.prototype.lockSdp = function(key)
{
  // validate the panel exists before unlocking.
  if (J.SDP.Metadata.panelsMap.has(key) === false)
  {
    // stop processing.
    console.error(`The SDP key of ${key} was not found in the list of panels to lock.`);
    return;
  }

  // lock the panel.
  $gameActors.actors()
    .forEach(member => member.lockSdpByKey(key));
};

// noinspection JSUnusedGlobalSymbols
/**
 * Gets the rank of a given SDP for an actor by its key.
 * @param {number} actorId The id of the actor to get the rank from.
 * @param {string} key The key of the SDP to get the rank for.
 * @return {number} The rank of the SDP for the given actor.
 */
Game_Party.prototype.getSdpRankByActorAndKey = function(actorId, key)
{
  // make sure the actor id is valid.
  const actor = $gameActors.actor(actorId);
  if (!actor)
  {
    console.error(`The actor id of ${actorId} was invalid.`);
    return 0;
  }

  // make sure the actor has ranks in the panel and return the rank.
  const panelRanking = actor.getSdpByKey(key);
  if (panelRanking)
  {
    return panelRanking.currentRank;
  }
  else
  {
    return 0;
  }
};
//endregion Game_Party