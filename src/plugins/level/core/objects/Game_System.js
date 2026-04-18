//region Game_System
/**
 * Extends `initialize()` to include properties for this plugin.
 */
J.LEVEL.Aliased.Game_System.set('initialize', Game_System.prototype.initialize);
Game_System.prototype.initialize = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_System.get('initialize')
    .call(this);

  /**
   * The overarching _j object, where all my stateful plugin data is stored.
   */
  this._j ||= {};

  /**
   * Whether or not the level scaling is enabled.
   * @type {boolean}
   */
  this._j._levelScalingEnabled ||= J.LEVEL.Metadata.enabled;
};

/**
 * Gets whether or not the level scaling is enabled.
 * @returns {boolean}
 */
Game_System.prototype.isLevelScalingEnabled = function()
{
  return this._j._levelScalingEnabled;
};

/**
 * Enables level scaling functionality.
 */
Game_System.prototype.enableLevelScaling = function()
{
  this._j._levelScalingEnabled = true;
};

/**
 * Disables level scaling functionality.
 */
Game_System.prototype.disableLevelScaling = function()
{
  this._j._levelScalingEnabled = false;
};

/**
 * Rebuilds the beyond max parameter data for all actors.
 */
J.LEVEL.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.LEVEL.Aliased.Game_System.get('onAfterLoad')
    .call(this);

  // build the beyond max data.
  $gameTemp.buildBeyondMaxData();
};
//endregion Game_System