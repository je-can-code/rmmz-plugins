//region Game_Party
/**
 * Extends {@link #initialize}.<br>
 * Also initializes our SDP members.
 */
J.SDP.Aliased.Game_Party.set('initialize', Game_Party.prototype.initialize);
Game_Party.prototype.initialize = function()
{
  // perform original logic.
  J.SDP.Aliased.Game_Party.get('initialize').call(this);

  // init sdp members.
  this.initSdpMembers();

  // populate the trackings.
  this.populateSdpTrackings();
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

  /**
   * A collection of all panels being tracked by this party.
   * There should always be one for every panel imported from the
   * configuration.
   * @type {PanelTracking[]}
   * @private
   */
  this._j._sdp._trackings = [];
};

/**
 * Populates all SDP trackings from the current plugin metadata.
 */
Game_Party.prototype.populateSdpTrackings = function()
{
  this._j._sdp._trackings = J.SDP.Metadata.panels
    .map(panel => new PanelTracking(panel.key, panel.unlockedByDefault));
};

/**
 * Gets all SDP trackings.
 * @return {PanelTracking[]}
 */
Game_Party.prototype.getAllSdpTrackings = function()
{
  return this._j._sdp._trackings;
};

/**
 * Get all unlocked SDP trackings.
 * @return {PanelTracking[]}
 */
Game_Party.prototype.getUnlockedSdpTrackings = function()
{
  return this.getAllSdpTrackings().filter(panel => panel.isUnlocked());
};

/**
 * Gets the SDP tracking associated with a specific key.
 * @param {string} key The key of the SDP tracking to find.
 * @return {PanelTracking}
 */
Game_Party.prototype.getSdpTrackingByKey = function(key)
{
  return this.getAllSdpTrackings()
    .find(tracked => (tracked.key === key));
};

/**
 * Get a current list of all panels that are unlocked.
 * @return {StatDistributionPanel[]}
 */
Game_Party.prototype.getUnlockedSdps = function()
{
  // start our tracking with an empty array.
  const unlockedSdps = [];

  // iterate over each of the unlocked trackings.
  this.getUnlockedSdpTrackings().forEach(tracking =>
  {
    // grab the panel associated with the key.
    const panel = this.getSdpByKey(tracking.key);

    // skip unfound keys if we have those somehow.
    if (!panel) return;

    // add the panel to the list.
    unlockedSdps.push(panel);
  }, this);

  // return what we found.
  return unlockedSdps;
};

/**
 * Unlocks an SDP being tracked by its key.
 * @param {string} key The key of the SDP to unlock.
 */
Game_Party.prototype.unlockSdp = function(key)
{
  const panelTracking = this.getSdpTrackingByKey(key);

  if (!panelTracking)
  {
    // stop processing.
    console.error(`The SDP key of ${key} was not found in the list of panels to unlock.`);
    return;
  }

  // unlock the panel.
  panelTracking.unlock();
};

/**
 * Unlocks all defined SDPs.
 */
Game_Party.prototype.unlockAllSdps = function()
{
  // unlock the panel.
  this.getAllSdpTrackings().forEach(tracking => tracking.unlock());
};

/**
 * Locks an SDP being tracked by its key.
 * @param {string} key The key of the SDP to unlock.
 */
Game_Party.prototype.lockSdp = function(key)
{
  const panelTracking = this.getSdpTrackingByKey(key);

  if (!panelTracking)
  {
    // stop processing.
    console.error(`The SDP key of ${key} was not found in the list of panels to lock.`);
    return;
  }

  // lock the panel.
  panelTracking.lock();
};

/**
 * Locks all SDPs defined.
 */
Game_Party.prototype.lockAllSdps = function()
{
  this.getAllSdpTrackings()
    .forEach(tracking => tracking.lock());
};

/**
 * Returns a map of all SDPs keyed by the SDP's key with the value
 * being the SDP itself.
 * @return {Map<string, StatDistributionPanel>}
 */
Game_Party.prototype.getAllSdpsAsMap = function()
{
  return J.SDP.Metadata.panelsMap;
};

/**
 * Gets the {@link StatDistributionPanel} matching the given key.
 * @param {string} key The key of the SDP to find.
 * @return {StatDistributionPanel}
 */
Game_Party.prototype.getSdpByKey = function(key)
{
  return this.getAllSdpsAsMap().get(key)
};

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