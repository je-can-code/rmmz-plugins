import J_LevelPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.LEVEL = {};

/**
 * The grouping for extensions of this plugin.
 */
J.LEVEL.EXT = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.LEVEL.Metadata = new J_LevelPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * The maximum level definable in the level. Any level below this can be determined without extra calculations.
 * @type {number}
 */
J.LEVEL.EditorMaxLevel = 99;

/**
 * All aliased methods for this plugin.
 */
J.LEVEL.Aliased = {
  Game_Action: new Map(),
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  Game_BattlerBase: new Map(),
  Game_Enemy: new Map(),
  Game_Event: new Map(),
  Game_System: new Map(),
  Game_Temp: new Map(),
  Game_Troop: new Map(),

  DataManager: new Map(),
  JABS_AiManager: new Map(),

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
   * The array capture group is [SKILL_ID, LEVEL_LEARNED].
   * @type {RegExp}
   */
  Learning: /<learning: ?(\[\d+, ?\d+])>/i,

  /**
   * The regex for granting bonuses or penalties to max level (for actors only).
   * @type {RegExp}
   */
  MaxLevelBoost: /<maxLevelBoost: ?(-?\+?\d+)>/i,

  /**
   * The regexes for the 8 base parameters' `GrowthCurve` tags, indexed by base paramId (0-7:
   * mhp/mmp/atk/def/mat/mdf/agi/luk). Authored via the jmz-data-editor's Classes board and read by
   * {@link GrowthCurveFormula.readForClass} to derive beyond-level-99 growth directly from the formula
   * instead of {@link Game_Temp.buildBeyondMaxDataForClass}'s slope-extrapolation fallback.
   * @type {RegExp[]}
   */
  GrowthCurveByParamId: [
    /<mhpGrowthCurve:\[([+\-*/ ().\w]+)]>/gi,
    /<mmpGrowthCurve:\[([+\-*/ ().\w]+)]>/gi,
    /<atkGrowthCurve:\[([+\-*/ ().\w]+)]>/gi,
    /<defGrowthCurve:\[([+\-*/ ().\w]+)]>/gi,
    /<matGrowthCurve:\[([+\-*/ ().\w]+)]>/gi,
    /<mdfGrowthCurve:\[([+\-*/ ().\w]+)]>/gi,
    /<agiGrowthCurve:\[([+\-*/ ().\w]+)]>/gi,
    /<lukGrowthCurve:\[([+\-*/ ().\w]+)]>/gi,
  ],

  /**
   * The regex for MTP's `GrowthCurve` tag. Unlike the 8 base params, MTP has no `params[]` array in
   * Classes.json (it's a J-Base/J-NaturalGrowth note-tag-only stat), so when present this formula is
   * evaluated live for every level, not just beyond 99- see {@link Game_Actor.maxTp}.
   * @type {RegExp}
   */
  MtpGrowthCurve: /<mtpGrowthCurve:\[([+\-*/ ().\w]+)]>/gi,
};
//endregion initialization