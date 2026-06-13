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
J.POPUPS.EXT.ABS.Aliased.Sprite_Damage = new Map();
J.POPUPS.EXT.ABS.Aliased.PopupLayoutHelper = new Map();

/**
 * A collection of all regexp patterns for notetags parsed by this plugin.
 */
J.POPUPS.EXT.ABS.RegExp = {};
J.POPUPS.EXT.ABS.RegExp.NoHpSlipPopup  = /<noHpPopup>/i;
J.POPUPS.EXT.ABS.RegExp.NoMpSlipPopup  = /<noMpPopup>/i;
J.POPUPS.EXT.ABS.RegExp.NoTpSlipPopup  = /<noTpPopup>/i;
J.POPUPS.EXT.ABS.RegExp.NoAnySlipPopup = /<noSlipPopup>/i;
//endregion initialization