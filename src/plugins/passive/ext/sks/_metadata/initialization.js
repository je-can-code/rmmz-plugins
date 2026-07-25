//region initialization
import JPassiveSks_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.PASSIVE.EXT.SKS = {};

/**
 * The metadata associated with this plugin.
 */
J.PASSIVE.EXT.SKS.Metadata = new JPassiveSks_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.PASSIVE.EXT.SKS.Aliased = {};
J.PASSIVE.EXT.SKS.Aliased.Game_Actor = new Map();
//endregion initialization
