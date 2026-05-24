//region initialization
import J_PopupsAbs_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};
J.POPUPS ||= {};
J.POPUPS.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this extension plugin.
 */
J.POPUPS.EXT.ABS = {};

/**
 * The metadata associated with this plugin.
 */
J.POPUPS.EXT.ABS.Metadata = new J_PopupsAbs_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.POPUPS.EXT.ABS.Aliased = {};
J.POPUPS.EXT.ABS.Aliased.JABS_Engine = new Map();
J.POPUPS.EXT.ABS.Aliased.JABS_Battler = new Map();
J.POPUPS.EXT.ABS.Aliased.Game_Action = new Map();
J.POPUPS.EXT.ABS.Aliased.JABS_SkillSlot = new Map();
//endregion initialization