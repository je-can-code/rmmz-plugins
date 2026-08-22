//region initialization
import J_CaModsPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.CAMods = {};

/**
 * The metadata associated with this plugin, such as name and version.
 */
J.CAMods.Metadata = new J_CaModsPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.CAMods.PluginParameters = J.CAMods.Metadata.parsedPluginParameters;

/**
 * A collection of all aliased methods for this plugin.
 */
J.CAMods.Aliased = {};
J.CAMods.Aliased.JABS_Battler = new Map();
J.CAMods.Aliased.JABS_Engine = new Map();
J.CAMods.Aliased.Game_Actor = new Map();
J.CAMods.Aliased.Game_BattlerBase = new Map();
J.CAMods.Aliased.Game_Map = new Map();
J.CAMods.Aliased.Game_Party = new Map();
J.CAMods.Aliased.Scene_Boot = new Map();
//endregion initialization