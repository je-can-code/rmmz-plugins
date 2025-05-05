/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.LEVEL = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.LEVEL.Metadata = new J_LevelPluginMetadata(`J-LevelMaster`, '1.1.1');

/**
 * All aliased methods for this plugin.
 */
J.LEVEL.Aliased = {
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  Game_Action: new Map(),
  Game_System: new Map(),
  Game_Temp: new Map(),
  Game_Troop: new Map(),

  DataManager: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.LEVEL.RegExp = {
  /**
   * The regex for the level tag on various database objects.
   * @type {RegExp}
   */
  BattlerLevel: /<(?:lv|lvl|level):[ ]?(-?\+?\d+)>/i,

  /**
   * The regex for granting bonuses or penalties to max level (for actors only).
   * @type {RegExp}
   */
  MaxLevelBoost: /<maxLevelBoost: ?(-?\+?\d+)>/i,
};
//endregion initialization