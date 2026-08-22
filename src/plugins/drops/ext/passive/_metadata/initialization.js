//region initialization
import JDropsPassive_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.DROPS.EXT.PASSIVE = {};

/**
 * The metadata associated with this plugin.
 */
J.DROPS.EXT.PASSIVE.Metadata = new JDropsPassive_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.DROPS.EXT.PASSIVE.Aliased = {};
J.DROPS.EXT.PASSIVE.Aliased.Game_Enemy = new Map();
//endregion initialization