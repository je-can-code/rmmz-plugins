//region Game_System
/**
 * Extends {@link #initialize}.<br/>
 * Also initializes content sync session storage for this plugin.
 */
J.LEVEL.EXT.SYNC.Aliased.Game_System.set('initialize', Game_System.prototype.initialize);
Game_System.prototype.initialize = function()
{
  // perform original logic.
  J.LEVEL.EXT.SYNC.Aliased.Game_System.get('initialize')
    .call(this);

  /**
   * The overarching _j object, where all my stateful plugin data is stored.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._levelSync ||= {};

  /**
   * The active content sync session, or null when no sync is running.
   * @type {{ level: number, uplevel: boolean }|null}
   */
  this._j._levelSync._contentSyncSession = null;
};

/**
 * Gets the active content sync session.
 * @returns {{ level: number, uplevel: boolean }|null}
 */
Game_System.prototype.getContentSyncSession = function()
{
  return this._j._levelSync._contentSyncSession;
};

/**
 * Sets the active content sync session to the given level and uplevel flag.
 * @param {number} level The sync level all actors will be clamped or boosted to.
 * @param {boolean} uplevel Whether underleveled actors are boosted to the sync level.
 */
Game_System.prototype.setContentSyncSession = function(level, uplevel)
{
  this._j._levelSync._contentSyncSession = { level, uplevel };
};

/**
 * Clears the active content sync session, restoring real effective levels.
 */
Game_System.prototype.clearContentSyncSession = function()
{
  this._j._levelSync._contentSyncSession = null;
};

/**
 * Gets whether a content sync session is currently active.
 * @returns {boolean}
 */
Game_System.prototype.hasContentSyncSession = function()
{
  return this.getContentSyncSession() !== null;
};

/**
 * Extends {@link #onAfterLoad}.<br/>
 * Re-applies party refresh after loading a save so stats and HUD reflect
 * any session that was active when the save was made.
 */
J.LEVEL.EXT.SYNC.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.LEVEL.EXT.SYNC.Aliased.Game_System.get('onAfterLoad')
    .call(this);

  // re-initialize session storage in case this save predates this plugin.
  this._j._levelSync ||= {};
  this._j._levelSync._contentSyncSession ??= null;

  // refresh all party members so stats reflect the loaded session state.
  $gameParty.members().forEach(actor =>
  {
    // refresh parameter buffs if J-Natural is loaded.
    if (J.NATURAL) actor.refreshAllParameterBuffs();

    // notify the actor that battler data has changed.
    actor.onBattlerDataChange();
  });
};
//endregion Game_System
