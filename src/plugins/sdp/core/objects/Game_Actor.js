//region Game_Actor
import PanelRanking from '../models/PanelRanking.js';

/**
 * Extends {@link #initMembers}.<br/>
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
 * Sum of all panel current ranks for this actor (convenience for menus / reporting).
 * @returns {number}
 */
Game_Actor.prototype.getTotalSdpRanks = function()
{
  return this.getAllSdpRankings()
    .reduce((total, panelRanking) => total + panelRanking.currentRank, 0);
};

/**
 * The number of panels this actor has reached max rank on.
 * @returns {number}
 */
Game_Actor.prototype.getMasteryCount = function()
{
  // count every panel ranking where the actor has hit max rank.
  return this.getAllSdpRankings()
    .filter(panelRanking => panelRanking.isPanelMaxed() === true)
    .length;
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
  return this._j._sdp._pointsSpent;
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
 * Sets the amount of SDP points this actor has.
 * @param {number} points The new amount of points.
 */
Game_Actor.prototype.setSdpPoints = function(points)
{
  this._j._sdp._points = points;
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
    // then apply the SDR multiplier (panels, tags, and SDP gear) to the gained points.
    gainedSdpPoints = Math.round(gainedSdpPoints * this.sdpMultiplier);

    // evaluate any formula-based bonus multipliers sourced from all note objects on this actor.
    const formulaBonus = RPGManager.getResultsFromAllNotesByRegex(
      this.getAllNotes(),
      J.SDP.RegExp.SdpBonusFormula,
      0,
      this
    );

    // if any formula tags contributed a bonus, layer their multiplier on top of SDR.
    if (formulaBonus !== 0)
    {
      gainedSdpPoints = Math.round(gainedSdpPoints * (1 + formulaBonus));
    }

    // add to the running accumulative total.
    this.modAccumulatedTotalSdpPoints(gainedSdpPoints);
  }

  // add the points onto the actor, never letting the balance fall below zero.
  this.setSdpPoints(Math.max(0, this.getSdpPoints() + gainedSdpPoints));

  // return the final amount so callers can surface accurate feedback (e.g. popups).
  return gainedSdpPoints;
};

/**
 * SDP points multiplier for this actor.
 */
Object.defineProperty(Game_Actor.prototype, 'sdpMultiplier', {
  get: function()
  {
    // initializing with base 100, representing 1x.
    const multiplier = 100;

    // get all the objects to scan for possible sdp multipliers.
    const objectsToCheck = this.getAllNotes();

    // get the vision multiplier from anything this battler has available.
    const sdpMultiplierBonus = RPGManager.getSumFromAllNotesByRegex(objectsToCheck, J.SDP.RegExp.SdpMultiplier);

    // add SDP panel bonuses (percent-points, same unit as sdpMultiplierBonus).
    const sdpPanelBonus = this.getSdpBonusForParameterKey
      ? this.getSdpBonusForParameterKey('sdr', 1)
      : 0;

    // return the factor form by dividing by 100 (all values are percent-points).
    return ((multiplier + sdpMultiplierBonus + sdpPanelBonus) / 100);
  },
  configurable: true,
});

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
 * Calculates SDP panel bonuses for a catalog parameter key (cdm, lst, mtp, etc.).
 * @param {string} parameterKey The registry key to accumulate panel growth for.
 * @param {number} baseParam The base value used for percent-based panel growth.
 * @returns {number}
 */
Game_Actor.prototype.getSdpBonusForParameterKey = function(parameterKey, baseParam)
{
  if (!J.SDP) return 0;
  if (!parameterKey) return 0;

  const panelRankings = this.getAllSdpRankings();
  if (!panelRankings.length) return 0;

  let val = 0;

  panelRankings.forEach(panelRanking =>
  {
    const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);
    if (!panel) return;

    val += panel.calculateBonusByRank(parameterKey, panelRanking.currentRank, baseParam, false);
  });

  return val;
};

/**
 * Calculates SDP panel bonuses for a custom catalog parameter (legacy numeric id wrapper).
 * @param {number} paramId The legacy panel parameter id.
 * @param {number} baseParam The base value used for percent-based panel growth.
 * @returns {number}
 */
Game_Actor.prototype.getSdpBonusForCustomParam = function(paramId, baseParam)
{
  const parameterKey = ParameterKeys.legacyLongParamKey(paramId);

  return this.getSdpBonusForParameterKey(parameterKey, baseParam);
};

/**
 * Calculates the value of the bonus stats for a designated core parameter.
 * @param {number} paramId The id of the parameter to get the bonus for.
 * @param {number} baseParam The base value of the designated parameter.
 * @returns {number}
 */
Game_Actor.prototype.getSdpBonusForCoreParam = function(paramId, baseParam)
{
  const parameterKey = ParameterKeys.bparamKey(paramId);
  const panelRankings = this.getAllSdpRankings();
  if (!panelRankings.length) return 0;
  if (!parameterKey) return 0;

  let panelModifications = 0;
  // for each of the panel rankings this actor has established-
  panelRankings.forEach(panelRanking =>
  {
    // get the corresponding SDP's panel parameters.
    const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);
    if (!panel)
    {
      return;
    }

    const panelParameters = panel.getPanelParameterByKey(parameterKey);
    if (!panelParameters.length) return;

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
  const parameterKey = idExtra === 8
    ? ParameterKeys.xparamKey(sparamId)
    : ParameterKeys.sparamKey(sparamId);
  const panelRankings = this.getAllSdpRankings();
  if (!panelRankings.length) return 0;
  if (!parameterKey) return 0;

  let panelModifications = 0;
  // for each of the panel rankings this actor has established-
  panelRankings.forEach(panelRanking =>
  {
    // get the corresponding SDP's panel parameters.
    const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);
    if (!panel)
    {
      return;
    }

    const panelParameters = panel.getPanelParameterByKey(parameterKey);
    if (!panelParameters.length) return;

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
  });

  return panelModifications;
};

/**
 * Combines pre-SDP base with panel delta and enforces stat floors after downs.
 * @param {number} baseParam Pre-SDP base.
 * @param {number} panelModifications Net SDP panel delta.
 * @param {number} minResult Minimum allowed total (MHP uses {@link J.SDP.Metadata#panelStatFloorMhp}).
 * @returns {number}
 */
Game_Actor.prototype.applySdpPanelStatFloor = function(baseParam, panelModifications, minResult)
{
  const raw = baseParam + panelModifications;

  if (raw >= minResult)
  {
    return raw;
  }

  return minResult;
};

/**
 * Extends the base parameters with the SDP bonuses.
 */
J.SDP.Aliased.Game_Actor.set('param', Game_Actor.prototype.param);
Game_Actor.prototype.param = function(paramId)
{
  // perform original logic.
  const baseParam = J.SDP.Aliased.Game_Actor.get('param')
    .call(this, paramId);

  const panelModifications = this.getSdpBonusForCoreParam(paramId, baseParam);
  const minResult = paramId === 0
    ? J.SDP.Metadata.panelStatFloorMhp
    : J.SDP.Metadata.panelStatFloorDefault;

  return this.applySdpPanelStatFloor(baseParam, panelModifications, minResult);
};

/**
 * Extends the ex-parameters with the SDP bonuses.
 */
J.SDP.Aliased.Game_Actor.set('xparam', Game_Actor.prototype.xparam);
Game_Actor.prototype.xparam = function(xparamId)
{
  // perform original logic.
  const baseParam = J.SDP.Aliased.Game_Actor.get('xparam')
    .call(this, xparamId);

  const panelModifications = this.getSdpBonusForNonCoreParam(xparamId, baseParam, 8);

  return this.applySdpPanelStatFloor(
    baseParam,
    panelModifications,
    J.SDP.Metadata.panelStatFloorDefault,
  );
};

/**
 * Extends the sp-parameters with the SDP bonuses.
 */
J.SDP.Aliased.Game_Actor.set('sparam', Game_Actor.prototype.sparam);
Game_Actor.prototype.sparam = function(sparamId)
{
  // perform original logic.
  const baseParam = J.SDP.Aliased.Game_Actor.get('sparam')
    .call(this, sparamId);

  const panelModifications = this.getSdpBonusForNonCoreParam(sparamId, baseParam, 18);

  return this.applySdpPanelStatFloor(
    baseParam,
    panelModifications,
    J.SDP.Metadata.panelStatFloorDefault,
  );
};

/**
 * Extends {@link #maxTp}.<br/>
 * Includes bonuses from panels as well.
 * @returns {number}
 */
J.SDP.Aliased.Game_Actor.set('maxTp', Game_Actor.prototype.maxTp);
Game_Actor.prototype.maxTp = function()
{
  // perform original logic.
  const baseMaxTp = J.SDP.Aliased.Game_Actor.get('maxTp')
    .call(this);

  // calculate the bonus max tp from the panels.
  const bonusMaxTpFromSdp = this.maxTpSdpBonuses(baseMaxTp);

  return this.applySdpPanelStatFloor(
    baseMaxTp,
    bonusMaxTpFromSdp,
    J.SDP.Metadata.panelStatFloorDefault,
  );
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
    const panel = J.SDP.Metadata.panelsMap.get(panelRanking.key);
    if (!panel)
    {
      return;
    }

    // TODO: generalize this whole thing.
    const panelParameters = panel.getPanelParameterByKey('mtp');

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