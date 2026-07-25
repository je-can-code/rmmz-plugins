//region Game_Party
import JABS_Battler from '../models/JABS_Battler.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
/**
 * Extends the initialize to include additional objects for JABS.
 */
J.ABS.Aliased.Game_Party.set('initialize', Game_Party.prototype.initialize);
Game_Party.prototype.initialize = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_Party.get('initialize')
    .call(this);

  // initialize party data for JABS.
  this.initJabsPartyData();
};

/**
 * Initializes the stuff related to tracking JABS party cycle capabilities.
 */
Game_Party.prototype.initJabsPartyData = function()
{
  /**
   * The master reference to the `_j` object containing all plugin properties.
   * @type {{}}
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  /**
   * Whether or not the party is allowed to party cycle.
   * @type {boolean}
   */
  this._j._abs._canPartyCycle ||= true;
};

/**
 * (re-)Enables the JABS party cycle functionality.
 */
Game_Party.prototype.enablePartyCycling = function()
{
  this._j._abs._canPartyCycle = true;
};

/**
 * Disables the JABS party cycle functionality.
 */
Game_Party.prototype.disablePartyCycling = function()
{
  this._j._abs._canPartyCycle = false;
};

/**
 * Gets whether or not the party can cycle between members.
 * @returns {boolean} True if party cycling is enabled, false otherwise.
 */
Game_Party.prototype.canPartyCycle = function()
{
  return this._j._abs._canPartyCycle;
};

/**
 * Gets the {@link JABS_Battler} of the leader.
 * If no leader is present or no leader is tracked, this will return `undefined`.
 * @returns {JABS_Battler|undefined}
 */
Game_Party.prototype.leaderJabsBattler = function()
{
  // if we don't have a leader, then we don't have a leader battler.
  if (!this.leader()) return undefined;

  // grab the leader's uuid.
  const leaderUuid = this.leader()
    .getUuid();

  // return the leader's battler.
  return JABS_AiManager.getBattlerByUuid(leaderUuid);
};

/**
 * Gets whether any current party battle member is in combat.
 * @returns {boolean}
 */
Game_Party.prototype.anyMemberInCombat = function()
{
  // if globally forced, then the party is in combat.
  if ($jabsEngine.forcedCombat === true) return true;

  // check each battle member for a tracked JABS battler that is in combat.
  const members = this.battleMembers();
  for (let i = 0; i < members.length; i++)
  {
    const actor = members[i];
    const jabsBattler = JABS_AiManager.getBattlerByUuid(actor.getUuid());
    if (jabsBattler && jabsBattler.isInCombat())
    {
      return true;
    }
  }

  // nobody is in combat.
  return false;
};
//endregion Game_Party