//region initialization
import JLevelMasterFlat_PluginMetadata from './_pluginMetadata.js';

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
J.LEVEL.EXT.FLAT = {};

/**
 * The metadata associated with this plugin.
 */
J.LEVEL.EXT.FLAT.Metadata = new JLevelMasterFlat_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.LEVEL.EXT.FLAT.Aliased = {};
J.LEVEL.EXT.FLAT.Aliased.Game_Troop = new Map();
//endregion initialization
