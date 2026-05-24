//region J_PopupsExtSDP_init
import J_PopupsSdp_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};
J.POPUPS ||= {};
J.POPUPS.EXT ||= {};

J.POPUPS.EXT.SDP = J.POPUPS.EXT.SDP || {};

/**
 * The metadata associated with this extension plugin.
 */
J.POPUPS.EXT.SDP.Metadata = new J_PopupsSdp_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

J.POPUPS.EXT.SDP.Aliased = J.POPUPS.EXT.SDP.Aliased || {};
J.POPUPS.EXT.SDP.Aliased.JABS_Engine = new Map();
//endregion J_PopupsExtSDP_init