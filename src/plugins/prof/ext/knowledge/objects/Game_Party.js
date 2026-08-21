//region Game_Party
/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes the knowledge points this party has accumulated.
 */
J.PROF.EXT.KNOWLEDGE.Aliased.Game_Party.set('initMembers', Game_Party.prototype.initMembers);
Game_Party.prototype.initMembers = function()
{
  // perform original logic.
  J.PROF.EXT.KNOWLEDGE.Aliased.Game_Party.get('initMembers')
    .call(this);

  // init the members.
  this.initKnowledgeMembers();
};

/**
 * Initializes the members of this class.
 *
 * Knowledge is held by the party rather than by the actor who earned it. The whole group learns from
 * what any of them does, and the things it buys land in a shared bag- so splitting the ledger per actor
 * would only invite the player to work out which character to play in order to farm it.
 */
Game_Party.prototype.initKnowledgeMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the proficiency system.
   */
  this._j._proficiency ||= {};

  /**
   * The points held against each knowledge tag, keyed by that tag's key.
   *
   * A map rather than a field per kind, because the kinds are authored in configuration- naming them
   * here would be the one place this system stopped being generic.
   * @type {Map<string, number>}
   */
  this._j._proficiency._knowledgePoints ||= new Map();
};

/**
 * The points held against every knowledge tag.
 * @returns {Map<string, number>}
 */
Game_Party.prototype.knowledgePointsMap = function()
{
  return this._j._proficiency._knowledgePoints;
};

/**
 * The points currently held against a single knowledge tag.
 *
 * A tag never earned against reads as zero rather than being written into the map, because reading a
 * balance is not a reason to start tracking one.
 * @param {string} tagKey The key of the knowledge tag being read.
 * @returns {number}
 */
Game_Party.prototype.knowledgePoints = function(tagKey)
{
  const points = this.knowledgePointsMap();

  if (points.has(tagKey) === false) return 0;

  return points.get(tagKey);
};

/**
 * Adds points to a knowledge tag's balance.
 * @param {string} tagKey The key of the knowledge tag being credited.
 * @param {number} amount How many points to add.
 */
Game_Party.prototype.gainKnowledgePoints = function(tagKey, amount)
{
  const current = this.knowledgePoints(tagKey);
  const updated = current + amount;

  this.setKnowledgePoints(tagKey, updated);
};

/**
 * Removes points from a knowledge tag's balance.
 * @param {string} tagKey The key of the knowledge tag being debited.
 * @param {number} amount How many points to remove.
 */
Game_Party.prototype.loseKnowledgePoints = function(tagKey, amount)
{
  const current = this.knowledgePoints(tagKey);
  const updated = current - amount;

  this.setKnowledgePoints(tagKey, updated);
};

/**
 * Assigns a knowledge tag's balance outright.
 *
 * The floor exists because a balance is a record of what was earned and not yet spent; there is no such
 * thing as owing knowledge, and nothing downstream is prepared to be handed a negative pile.
 * @param {string} tagKey The key of the knowledge tag being written.
 * @param {number} amount The balance to assign.
 */
Game_Party.prototype.setKnowledgePoints = function(tagKey, amount)
{
  const floored = Math.max(0, amount);

  this.knowledgePointsMap()
    .set(tagKey, floored);
};
//endregion Game_Party