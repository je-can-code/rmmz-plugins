//region initialization
import JSkillSlotsAbs_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};
J.SKS ||= {};
J.SKS.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this extension plugin.
 */
J.SKS.EXT.ABS = {};

/**
 * The metadata associated with this plugin.
 */
J.SKS.EXT.ABS.Metadata = new JSkillSlotsAbs_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.SKS.EXT.ABS.Aliased = {};
J.SKS.EXT.ABS.Aliased.Game_Actor = new Map();
//endregion initialization
