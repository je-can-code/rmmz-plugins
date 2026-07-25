//region Game_BattlerBase
/**
 * Extends {@link #initMembers}.<br/>
 * Initializes the level cache members for this battler.
 */
J.LEVEL.Aliased.Game_BattlerBase.set('initMembers', Game_BattlerBase.prototype.initMembers);
Game_BattlerBase.prototype.initMembers = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_BattlerBase.get('initMembers')
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with levels.
   */
  this._j._level ||= {};

  /**
   * The cached computed level for this battler.
   * Null when the cache is cold and must be recomputed via {@link #getLevel}.
   * Invalidated by {@link #refreshLevel} whenever battler data changes.
   * @type {number|null}
   */
  this._j._level._cachedLevel = null;

  /**
   * Re-entrancy guard for {@link #computeLevel}.
   * Prevents infinite recursion when level sources themselves reference level.
   * @type {boolean}
   */
  this._j._level._isComputingGetLevel = false;
};
//endregion Game_BattlerBase
