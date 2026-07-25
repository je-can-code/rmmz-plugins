//region initialization
import JExtendAbs_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.EXTEND.EXT.ABS = {};

/**
 * The metadata associated with this plugin.
 */
J.EXTEND.EXT.ABS.Metadata = new JExtendAbs_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.EXTEND.EXT.ABS.Aliased = {};
J.EXTEND.EXT.ABS.Aliased.JABS_Battler = new Map();
//endregion initialization
