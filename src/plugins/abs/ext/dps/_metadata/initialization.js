//region initialization
import JAbsDps_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.DPS = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.DPS.Metadata = new JAbsDps_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.DPS.Aliased = {};
J.ABS.EXT.DPS.Aliased.JABS_Engine = new Map();
//endregion initialization