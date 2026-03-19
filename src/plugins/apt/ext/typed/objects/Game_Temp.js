//region Game_Temp (typed AP caches)
/**
 * Extends {@link #initMembers}.
 * Also initializes caches for typed AP inference.
 */
J.APT.EXT.TYPED.Aliased.Game_Temp.set('initMembers', Game_Temp.prototype.initMembers);
Game_Temp.prototype.initMembers = function()
{
  // perform original logic.
  J.APT.EXT.TYPED.Aliased.Game_Temp.get('initMembers')
    .call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with APT.
   */
  this._j._apt ||= {};

  /**
   * A grouping of all properties associated with APT-typed.
   */
  this._j._apt._typed = {};

  /**
   * Cache of inferred enemy element type ids by enemy database id.
   * @type {Record<number, number[]>}
   */
  this._j._apt._typed._aptTypedInferredEnemyTypes = {};
};

/**
 * Gets cached inferred element ids for an enemy (if present).
 * @param {number} enemyId The database enemy id.
 * @returns {number[]|null} The cached list or null.
 */
Game_Temp.prototype.getAptTypedInferredEnemyTypes = function(enemyId)
{
  return this._j._apt._typed._aptTypedInferredEnemyTypes[enemyId] || null;
};

/**
 * Sets cached inferred element ids for an enemy.
 * @param {number} enemyId The database enemy id.
 * @param {number[]} ids The element ids to cache.
 */
Game_Temp.prototype.setAptTypedInferredEnemyTypes = function(enemyId, ids)
{
  this._j._apt._typed._aptTypedInferredEnemyTypes[enemyId] = Array.isArray(ids)
    ? ids.slice()
    : [];
};
//endregion Game_Temp (typed AP caches)