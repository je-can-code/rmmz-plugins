//region initialization
import JExtendSks_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.EXTEND.EXT.SKS = {};

/**
 * The metadata associated with this plugin.
 */
J.EXTEND.EXT.SKS.Metadata = new JExtendSks_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.EXTEND.EXT.SKS.Aliased = {};
J.EXTEND.EXT.SKS.Aliased.Window_SkillEquipDetail = new Map();
//endregion initialization
