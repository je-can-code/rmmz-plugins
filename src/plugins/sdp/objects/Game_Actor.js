//region Game_Actor
/**
 * Extends {@link #initMembers}.<br>
 * Also initializes the SDP members.
 */
J.SDP.Aliased.Game_Actor.set('initMembers', Game_Actor.prototype.initMembers);
Game_Actor.prototype.initMembers = function()
{
  // perform original logic.
  J.SDP.Aliased.Game_Actor.get('initMembers')
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the SDP system.
   */
  this._j._sdp ||= {}

  /**
   * The accumulative total number of points this actor has ever gained.
   * @type {number}
   */
  this._j._sdp._pointsEverGained = 0;

  /**
   * The accumulative total number of points this actor has ever spent.
   * @type {number}
   */
  this._j._sdp._pointsSpent = 0;

  /**
   * The points that this current actor has.
   * @type {number}
   */
  this._j._sdp._points = 0;

  /**
   * A collection of the ranks for each panel that have had points invested.
   * @type {PanelRanking[]}
   */
  this._j._sdp._ranks = [];
};

/**
 * Adds a new panel ranking for tracking the progress of a given panel.
 * @param {string} key The less-friendly unique key that represents this SDP.
 * @return {PanelRanking} The created panel ranking.
 */
Game_Actor.prototype.getOrCreateSdpRankByKey = function(key)
{
  // grab all the rankings this actor has.
  const rankings = this.getAllSdpRankings();

  // find the sdp ranking.
  const existingRanking = rankings.find(panelRank => panelRank.key === key);

  // check if we already have the ranking.
  if (existingRanking)
  {
    // return what already exists, no need to recreate it!
    return existingRanking;
  }

  // build a new sdp ranking.
  const newRanking = new PanelRanking(key, this.actorId());

  // add it to the running list.
  rankings.push(newRanking);

  // return the newly created ranking.
  return newRanking;
};

/**
 * Searches for a ranking in a given panel based on key and returns it.
 * @param {string} key The key of the panel we seek.
 * @returns {PanelRanking} The sdp ranking.
 */
Game_Actor.prototype.getSdpByKey = function(key)
{
  return this.getOrCreateSdpRankByKey(key);
};

/**
 * Gets all rankings that this actor has.
 * @returns {PanelRanking[]}
 */
Game_Actor.prototype.getAllSdpRankings = function()
{
  return this._j._sdp._ranks;
};

/**
 * Gets all unlocked panels for this actor.
 * @returns {PanelRanking[]}
 */
Game_Actor.prototype.getAllUnlockedSdps = function()
{
  return this.getAllSdpRankings()
    .filter(panelRanking => panelRanking.isUnlocked());
};

/**
 * Unlocks a panel by its key.
 * @param {string} key The key of the panel to unlock.
 */
Game_Actor.prototype.unlockSdpByKey = function(key)
{
  // grab the panel ranking by its key.
  const panelRanking = this.getSdpByKey(key);

  // unlock the ranking.
  panelRanking.unlock();
};

/**
 * Checks if a particular panel is unlocked.
 * @param {string} key The key of the panel to check.
 * @returns {boolean}
 */
Game_Actor.prototype.isSdpUnlocked = function(key)
{
  return this.getSdpByKey(key)
    .isUnlocked();
};

/**
 * Check if this actor has any unlocked panels.
 * @returns {boolean}
 */
Game_Actor.prototype.hasAnyUnlockedSdps = function()
{
  return this.getAllUnlockedSdps().length > 0;
};

/**
 * Locks a panel by its key.
 * @param {string} key The key of the panel to lock.
 */
Game_Actor.prototype.lockSdpByKey = function(key)
{
  // grab the panel ranking by its key.
  const panelRanking = this.getSdpByKey(key);

  // lock the ranking.
  panelRanking.lock();
};

/**
 * Gets the accumulative total of points this actor has ever gained.
 * @returns {number}
 */
Game_Actor.prototype.getAccumulatedTotalSdpPoints = function()
{
  return this._j._sdp._pointsEverGained;
};

/**
 * Increase the amount of accumulated total points for this actor by a given amount.
 * This amount should never be reduced.
 * @param {number} points The number of points to increase the total by.
 */
Game_Actor.prototype.modAccumulatedTotalSdpPoints = function(points)
{
  // ensure the points are positive- you cannot decrease the accumulative total.
  if (points > 0)
  {
    // add the points to the accumulative total.
    this._j._sdp._pointsEverGained += points;
  }
};

/**
 * Gets the accumulative total of points this actor has ever spent.
 * @returns {number}
 */
Game_Actor.prototype.getAccumulatedSpentSdpPoints = function()
{
  return this._j._sdp._pointsEverGained;
};

/**
 * Increase the amount of accumulated spent points for this actor by a given amount.
 * This number is designed to not be reduced except when refunding.
 * @param {number} points The number of points to increase the spent by.
 */
Game_Actor.prototype.modAccumulatedSpentSdpPoints = function(points)
{
  // add the points to the accumulative spent.
  this._j._sdp._pointsSpent += points;
};

/**
 * Gets the amount of SDP points this actor has.
 */
Game_Actor.prototype.getSdpPoints = function()
{
  return this._j._sdp._points;
};

/**
 * Increase the amount of SDP points the actor has by a given amount.
 * If the parameter provided is negative, it will reduce the actor's points instead.
 *
 * NOTE: An actor's SDP points cannot be less than 0.
 * @param {number} points The number of points we are adding/removing from this actor.
 */
Game_Actor.prototype.modSdpPoints = function(points)
{
  // initialize the gained points.
  let gainedSdpPoints = points;

  // if the modification is a positive amount...
  if (gainedSdpPoints > 0)
  {
    // then add apply the multiplier to the gained points.
    gainedSdpPoints = Math.round(gainedSdpPoints * this.sdpMultiplier());

    // add to the running accumulative total.
    this.modAccumulatedTotalSdpPoints(gainedSdpPoints);
  }

  // add the points onto the actor.
  this._j._sdp._points += gainedSdpPoints;

  // if the actor's points were reduced below zero...
  if (this._j._sdp._points < 0)
  {
    // return it back to 0.
    this._j._sdp._points = 0;
  }
};

/**
 * OVERWRITE Gets the SDP points multiplier for this actor.
 * @returns {number}
 */
Game_Actor.prototype.sdpMultiplier = function()
{
  // initializing with base 100, representing 1x.
  let multiplier = 100;

  // get all the objects to scan for possible sdp multipliers.
  const objectsToCheck = this.getAllNotes();

  // get the vision multiplier from anything this battler has available.
  const sdpMultiplierBonus = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.SDP.RegExp.SdpMultiplier);

  // get the sum of the base and bonus multipliers.
  const sdpMultiplier = (multiplier + sdpMultiplierBonus);

  // return the factor form by now dividing by 100.
  return (sdpMultiplier / 100);
};

/**
 * Ranks up this actor's panel by key.
 * @param {string} panelKey The key of the panel to rank up.
 */
Game_Actor.prototype.rankUpPanel = function(panelKey)
{
  this.getSdpByKey(panelKey)
    .rankUp();
};

/**
 * Calculates the value of the bonus stats for a designated core parameter.
 * @param {number} paramId The id of the parameter to get the bonus for.
 * @param {number} baseParam The base value of the designated parameter.
 * @returns {number}
 */
Game_Actor.prototype.getSdpBonusForCoreParam = function(paramId, baseParam)
{
  const panelRankings = this.getAllSdpRankings();
  if (!panelRankings.length) return 0;

  let panelModifications = 0;
  // for each of the panel rankings this actor has established-
  panelRankings.forEach(panelRanking =>
  {
    // get the corresponding SDP's panel parameters.
    const panelParameters = J.SDP.Metadata.panelsMap.get(panelRanking.key)
      .getPanelParameterById(paramId);
    if (panelParameters.length)
    {
      panelParameters.forEach(panelParameter =>
      {
        const { perRank } = panelParameter;
        const curRank = panelRanking.currentRank;
        if (!panelParameter.isFlat)
        {
          panelModifications += Math.floor(baseParam * (curRank * perRank) / 100);
        }
        else
        {
          panelModifications += curRank * perRank;
        }
      });
    }
  });

  return panelModifications;
};

/**
 * Calculates the value of the bonus stats for a designated [sp|ex]-parameter.
 * @param {number} sparamId The id of the parameter to get the bonus for.
 * @param {number} baseParam The base value of the designated parameter.
 * @param {number} idExtra The id modifier for s/x params.
 * @returns {number}
 */
Game_Actor.prototype.getSdpBonusForNonCoreParam = function(sparamId, baseParam, idExtra)
{
  const panelRankings = this.getAllSdpRankings();
  if (!panelRankings.length) return 0;

  let panelModifications = 0;
  // for each of the panel rankings this actor has established-
  panelRankings.forEach(panelRanking =>
  {
    // get the corresponding SDP's panel parameters.
    const panelParameters = J.SDP.Metadata.panelsMap.get(panelRanking.key)
      .getPanelParameterById(sparamId + idExtra); // need +10 because sparams start higher.
    if (panelParameters.length)
    {
      panelParameters.forEach(panelParameter =>
      {
        const { perRank } = panelParameter;
        const curRank = panelRanking.currentRank;
        if (!panelParameter.isFlat)
        {
          panelModifications += baseParam * (curRank * perRank) / 100;
        }
        else
        {
          panelModifications += (curRank * perRank) / 100;
        }
      });
    }
  });

  return panelModifications;
};

/**
 * Extends the base parameters with the SDP bonuses.
 */
J.SDP.Aliased.Game_Actor.set("param", Game_Actor.prototype.param);
Game_Actor.prototype.param = function(paramId)
{
  // perform original logic.
  const baseParam = J.SDP.Aliased.Game_Actor.get("param")
    .call(this, paramId);

  const panelModifications = this.getSdpBonusForCoreParam(paramId, baseParam);
  const result = baseParam + panelModifications;
  return result;
};

/**
 * Extends the ex-parameters with the SDP bonuses.
 */
J.SDP.Aliased.Game_Actor.set("xparam", Game_Actor.prototype.xparam);
Game_Actor.prototype.xparam = function(xparamId)
{
  // perform original logic.
  const baseParam = J.SDP.Aliased.Game_Actor.get("xparam")
    .call(this, xparamId);

  const panelModifications = this.getSdpBonusForNonCoreParam(xparamId, baseParam, 8);
  const result = baseParam + panelModifications;
  return result;
};

/**
 * Extends the sp-parameters with the SDP bonuses.
 */
J.SDP.Aliased.Game_Actor.set("sparam", Game_Actor.prototype.sparam);
Game_Actor.prototype.sparam = function(sparamId)
{
  // perform original logic.
  const baseParam = J.SDP.Aliased.Game_Actor.get("sparam")
    .call(this, sparamId);

  const panelModifications = this.getSdpBonusForNonCoreParam(sparamId, baseParam, 18);
  const result = baseParam + panelModifications;
  return result;
};

/**
 * Extends {@link #maxTp}.<br>
 * Includes bonuses from panels as well.
 * @returns {number}
 */
J.SDP.Aliased.Game_Actor.set("maxTp", Game_Actor.prototype.maxTp);
Game_Actor.prototype.maxTp = function()
{
  // perform original logic.
  const baseMaxTp = J.SDP.Aliased.Game_Actor.get("maxTp")
    .call(this);

  // calculate the bonus max tp from the panels.
  const bonusMaxTpFromSdp = this.maxTpSdpBonuses(baseMaxTp);

  // combine the two for the total max tp.
  const result = bonusMaxTpFromSdp + baseMaxTp;

  // return our calculations.
  return result;
};

/**
 * Calculates the bonuses for Max TP from the actor's currently ranked SDPs.
 * @param {number} baseMaxTp The base max TP for this actor.
 * @returns {number}
 */
Game_Actor.prototype.maxTpSdpBonuses = function(baseMaxTp)
{
  // grab the current rankings of panels for the party.
  const panelRankings = this.getAllSdpRankings();

  // if we have no rankings, then there is no bonuses from SDP.
  if (!panelRankings.length) return 0;

  // initialize the modifier to 0.
  let panelModifications = 0;

  // iterate over each ranking this actor has.
  panelRankings.forEach(panelRanking =>
  {
    // get the corresponding SDP's panel parameters.
    const panelParameters = J.SDP.Metadata.panelsMap.get(panelRanking.key)
      .getPanelParameterById(30); // TODO: generalize this whole thing.

    // validate we have any parameters from this panel.
    if (panelParameters.length)
    {
      // iterate over each panel parameter.
      panelParameters.forEach(panelParameter =>
      {
        // extract the relevant details.
        const {
          perRank,
          isFlat
        } = panelParameter;
        const { currentRank } = panelRanking;

        // check if the panel parameter growth is flat.
        if (isFlat)
        {
          // add it additively.
          panelModifications += currentRank * perRank;
        }
        // the panel parameter growth is percent.
        else
        {
          // add the percent of the base parameter.
          panelModifications += Math.floor(baseMaxTp * (currentRank * perRank) / 100);
        }
      });
    }
  });

  // return the modifier.
  return panelModifications;
};
//endregion Game_Actor