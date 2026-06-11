//region initialization
import JLevelSync_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The parent namespace must exist when this ext loads after J-LevelMaster.
 */
J.LEVEL ||= {};
J.LEVEL.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.LEVEL.EXT.SYNC = {};

/**
 * The metadata associated with this plugin.
 */
J.LEVEL.EXT.SYNC.Metadata = new JLevelSync_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.LEVEL.EXT.SYNC.Aliased = {};
J.LEVEL.EXT.SYNC.Aliased.Game_Actor = new Map();
J.LEVEL.EXT.SYNC.Aliased.Game_Map = new Map();
J.LEVEL.EXT.SYNC.Aliased.Game_System = new Map();
J.LEVEL.EXT.SYNC.Aliased.JABS_Engine = new Map();
J.LEVEL.EXT.SYNC.Aliased.Sprite_ActorValue = new Map();
J.LEVEL.EXT.SYNC.Aliased.Window_StatusBase = new Map();
J.LEVEL.EXT.SYNC.Aliased.Window_TargetFrame = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.LEVEL.EXT.SYNC.RegExp = {
  /**
   * Matches a map note declaring a content sync level.
   *
   * <pre>
   * Structure:
   *   <levelSync:N>
   *
   * Example:
   *   <levelSync:50>
   *
   * Translation:
   *   Content sync level: 50 (N must be a positive integer greater than 0)
   * </pre>
   * @type {RegExp}
   */
  ContentSyncLevel: /<levelSync:[ ]?(\d+)>/i,

  /**
   * Matches a map note opting into uplevel (exact sync) mode.
   *
   * <pre>
   * Structure:
   *   <levelSyncUp>
   *
   * Example:
   *   <levelSyncUp>
   *
   * Translation:
   *   Underleveled actors are boosted to the sync level as well.
   * </pre>
   * @type {RegExp}
   */
  ContentSyncUplevel: /<levelSyncUp>/i,
};
//endregion initialization
