//region Game_Party
import StatistopediaRecords from './../__models/StatistopediaRecords.js';

/**
 * Extends {@link #initOmnipediaMembers}.<br/>
 * Includes the statistopedia's records.
 */
J.OMNI.EXT.STATS.Aliased.Game_Party.set('initOmnipediaMembers', Game_Party.prototype.initOmnipediaMembers);
Game_Party.prototype.initOmnipediaMembers = function()
{
  // perform original logic.
  J.OMNI.EXT.STATS.Aliased.Game_Party.get('initOmnipediaMembers')
    .call(this);

  // initialize the statistopedia.
  this.initStatistopediaMembers();
};

/**
 * Initialize members related to the omnipedia's statistopedia.
 */
Game_Party.prototype.initStatistopediaMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * The grouping of all properties related to the omnipedia.
   */
  this._j._omni ||= {};

  /**
   * The party's lifetime record of everything a game variable cannot hold.
   *
   * A single instance rather than a keyed collection of saveables, because unlike the monsterpedia
   * there is nothing here to enumerate- the party has exactly one combat history.
   * @type {StatistopediaRecords}
   */
  this._j._omni._statistopediaRecords = new StatistopediaRecords();
};

/**
 * Gets the party's statistopedia records.
 * @returns {StatistopediaRecords}
 */
Game_Party.prototype.getStatistopediaRecords = function()
{
  return this._j._omni._statistopediaRecords;
};
//endregion Game_Party