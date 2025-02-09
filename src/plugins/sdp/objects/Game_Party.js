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
 * Updates the {@link PanelTracking}s with any new ones found from the metadata.
 */
Game_Party.prototype.updateSdpTrackingsFromConfig = function()
{
  // grab the current list of trackings by reference.
  const trackings = this.getAllSdpTrackings();

  J.SDP.Metadata.panels.forEach(panel =>
  {
    // skip ones that we shouldn't be adding.
    if (!this.canGainEntry(panel.name)) return;

    // find one by the same key in the existing trackings.
    const foundTracking = trackings.find(tracking => tracking.key === panel.key);

    // check if we found a tracking that has had its default unlock status changed.
    if (foundTracking && !foundTracking.unlocked && panel.unlockedByDefault)
    {
      // unlock it.
      panel.unlock();
      return;
    }

    // check if we actually didn't find any panel by that key.
    if (!foundTracking)
    {
      // add it anew.
      const newTracking = new PanelTracking(panel.key, panel.unlockedByDefault);
      trackings.push(newTracking);
      console.log(`adding new sdp: ${newTracking.key}`);
    }
  });

  // sort them.
  trackings.sort((a, b) => a.key - b.key);
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
  return this.getAllSdpTrackings()
    .filter(panel => panel.isUnlocked());
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
  this.getUnlockedSdpTrackings()
    .forEach(tracking =>
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
  // validate the panel exists before unlocking.
  if (J.SDP.Metadata.panelsMap.has(key) === false)
  {
    // stop processing.
    console.error(`The SDP key of ${key} was not found in the list of panels to unlock.`);
    return;
  }

  // unlock the panel.
  this.allMembers()
    .forEach(member => member.unlockSdpByKey(key));
};

/**
 * Unlocks all defined SDPs.
 */
Game_Party.prototype.unlockAllSdps = function()
{
  // unlock the panel.
  this.getAllSdpTrackings()
    .forEach(tracking => this.unlockSdp(tracking.key));
};

Game_Party.prototype.translatePartySdpsToActorSdps = function()
{
  const unlockedSdps = this.getUnlockedSdps();
  this.allMembers()
    .forEach(member =>
    {
      unlockedSdps.forEach(tracking => member.unlockSdpByKey(tracking.key));
    });
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
  return this.getAllSdpsAsMap()
    .get(key);
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

Game_Party.prototype.normalizeSdpRankings = function()
{
  this.allMembers()
    .forEach(member =>
    {
      member._j._sdp._ranks.forEach(ranking => ranking.normalizeRank())
    });
};
//endregion Game_Party