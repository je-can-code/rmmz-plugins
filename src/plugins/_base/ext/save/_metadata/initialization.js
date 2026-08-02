//region initialization
import J_BaseSavePluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.BASE.EXT.SAVE = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.BASE.EXT.SAVE.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.BASE.EXT.SAVE.Metadata = new J_BaseSavePluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.BASE.EXT.SAVE.Aliased = {};
J.BASE.EXT.SAVE.Aliased.ConfigManager = new Map();
J.BASE.EXT.SAVE.Aliased.DataManager = new Map();
J.BASE.EXT.SAVE.Aliased.Game_System = new Map();
J.BASE.EXT.SAVE.Aliased.Scene_Boot = new Map();
//endregion initialization
