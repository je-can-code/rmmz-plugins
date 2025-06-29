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
J.LEVEL.Metadata = new J_LevelPluginMetadata(`J-LevelMaster`, '1.2.0');

/**
 * All aliased methods for this plugin.
 */
J.LEVEL.Aliased = {
  Game_Action: new Map(),
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  Game_Enemy: new Map(),
  Game_Event: new Map(),
  Game_System: new Map(),
  Game_Temp: new Map(),
  Game_Troop: new Map(),

  DataManager: new Map(),

  Sprite_Character: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.LEVEL.RegExp = {
  /**
   * The regex for hiding the level display of a battler.
   * @type {RegExp}
   */
  HideLevel: /<hideLevel>/i,

  /**
   * The regex for the level tag on various database objects.
   * @type {RegExp}
   */
  Level: /<(?:lv|lvl|level):[ ]?(-?\+?\d+)>/i,

  /**
   * The regex for when a skill id is learned at a designated level.
   * @type {RegExp}
   */
  Learning: /<learning: ?(\[\d+, ?\d+])>/i,

  /**
   * The regex for granting bonuses or penalties to max level (for actors only).
   * @type {RegExp}
   */
  MaxLevelBoost: /<maxLevelBoost: ?(-?\+?\d+)>/i,
};
//endregion initialization