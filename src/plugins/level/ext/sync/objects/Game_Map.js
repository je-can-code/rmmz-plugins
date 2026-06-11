//region Game_Map
/**
 * Extends {@link #initialize}.<br/>
 * Initializes the level sync state so accessors are safe before the first map setup.
 */
J.LEVEL.EXT.SYNC.Aliased.Game_Map.set('initialize', Game_Map.prototype.initialize);
Game_Map.prototype.initialize = function()
{
  // perform original logic.
  J.LEVEL.EXT.SYNC.Aliased.Game_Map.get('initialize')
    .call(this);

  // initialize level sync state immediately so getLevel calls before setup() are safe.
  this.initLevelSyncMembers();
};

/**
 * Initializes all level sync members to their defaults.
 */
Game_Map.prototype.initLevelSyncMembers = function()
{
  /**
   * The overarching _j object, where all my stateful plugin data is stored.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with this plugin.
   */
  this._j._levelSync ||= {};

  /**
   * The content sync level parsed from the map note, or null if not present.
   * @type {number|null}
   */
  this._j._levelSync._contentSyncLevel = null;

  /**
   * Whether the map note opts into uplevel (exact sync) mode.
   * @type {boolean}
   */
  this._j._levelSync._contentSyncUplevel = false;
};

/**
 * Extends {@link #setup}.<br/>
 * Also parses content sync tags from the map note and refreshes the party
 * when a map-note-driven sync is detected and no session is active.
 */
J.LEVEL.EXT.SYNC.Aliased.Game_Map.set('setup', Game_Map.prototype.setup);
Game_Map.prototype.setup = function(mapId)
{
  // perform original logic.
  J.LEVEL.EXT.SYNC.Aliased.Game_Map.get('setup')
    .call(this, mapId);

  // reset sync state for the new map.
  this.initLevelSyncMembers();

  // parse the map note for sync tags.
  this.parseMapContentSyncTags();

  // if no session is active, refresh the party so the map-note sync takes effect.
  if ($gameSystem.hasContentSyncSession() === false)
  {
    // refresh all party members so stats and HUD reflect the map's sync state.
    $gameParty.members().forEach(actor =>
    {
      // refresh parameter buffs if J-Natural is loaded.
      if (J.NATURAL) actor.refreshAllParameterBuffs();

      // notify the actor that battler data has changed.
      actor.onBattlerDataChange();
    });
  }
};

/**
 * Parses the map note for content sync level and uplevel tags.
 */
Game_Map.prototype.parseMapContentSyncTags = function()
{
  // parse the sync level from the map note.
  const syncLevel = RPGManager.getNumberFromNoteByRegex(
    $dataMap,
    J.LEVEL.EXT.SYNC.RegExp.ContentSyncLevel);

  // store the sync level, defaulting to null if not found.
  this._j._levelSync._contentSyncLevel = syncLevel > 0
    ? syncLevel
    : null;

  // parse the uplevel flag from the map note.
  const uplevel = RPGManager.checkForBooleanFromNoteByRegex(
    $dataMap,
    J.LEVEL.EXT.SYNC.RegExp.ContentSyncUplevel);

  // store the uplevel flag.
  this._j._levelSync._contentSyncUplevel = uplevel === true;
};

/**
 * Gets the content sync level declared in this map's note, or null if absent.
 * @returns {number|null}
 */
Game_Map.prototype.getMapContentSyncLevel = function()
{
  return this._j._levelSync._contentSyncLevel;
};

/**
 * Gets whether this map's note opts into uplevel (exact sync) mode.
 * @returns {boolean}
 */
Game_Map.prototype.isMapContentSyncUplevel = function()
{
  return this._j._levelSync._contentSyncUplevel;
};
//endregion Game_Map
