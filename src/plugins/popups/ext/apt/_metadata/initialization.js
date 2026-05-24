//region J_PopupsExtAPT_init
import J_PopupsApt_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};
J.POPUPS ||= {};
J.POPUPS.EXT ||= {};

J.POPUPS.EXT.APT = J.POPUPS.EXT.APT || {};

/**
 * The metadata associated with this extension plugin.
 */
J.POPUPS.EXT.APT.Metadata = new J_PopupsApt_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

J.POPUPS.EXT.APT.Aliased = J.POPUPS.EXT.APT.Aliased || {};
J.POPUPS.EXT.APT.Aliased.JABS_Engine = new Map();
//endregion J_PopupsExtAPT_init