//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
J.POPUPS.EXT.ABS = {};

J.POPUPS.EXT.ABS.PluginParameters = PluginManager.parameters('J-Popups-ABS');

/**
 * When true, {@link JABS_PopupManager.showSkillUsedPop} returns early (damage and other ABS popups unchanged).
 * @type {boolean}
 */
J.POPUPS.EXT.ABS.DisableSkillUsedPopups = J.POPUPS.EXT.ABS.PluginParameters['disableSkillUsedPopups'] === 'true';

/**
 * A collection of all aliased methods for this plugin.
 */
J.POPUPS.EXT.ABS.Aliased = {};
J.POPUPS.EXT.ABS.Aliased.JABS_Engine = new Map();
J.POPUPS.EXT.ABS.Aliased.JABS_Battler = new Map();
J.POPUPS.EXT.ABS.Aliased.Game_Action = new Map();
//endregion initialization