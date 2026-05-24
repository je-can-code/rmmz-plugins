//region initialization
import J_PopupsResources_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};
J.POPUPS ||= {};
J.POPUPS.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.POPUPS.EXT.RESOURCES = {};

/**
 * The metadata associated with this plugin.
 */
J.POPUPS.EXT.RESOURCES.Metadata = new J_PopupsResources_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.POPUPS.EXT.RESOURCES.Aliased = {};
J.POPUPS.EXT.RESOURCES.Aliased.Game_Battler = new Map();
//endregion initialization