//region initialization
import JAbsMetrics_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.METRICS = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.METRICS.Metadata = new JAbsMetrics_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.METRICS.Aliased = {};
J.ABS.EXT.METRICS.Aliased.JABS_Engine = new Map();
//endregion initialization