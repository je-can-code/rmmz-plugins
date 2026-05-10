//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
J.POPUPS.EXT.ABS = {};

J.POPUPS.EXT.ABS.PluginParameters = PluginManager.parameters('J-Popups-ABS');

/**
 * Parsed merge toggles and idle flush tuning for {@link JABS_PopupMergeController}.
 *
 * @type {{
 *   enableCombat: boolean,
 *   enableSlip: boolean,
 *   enableRewards: boolean,
 *   enableMitigation: boolean,
 *   idleFlushFrames: number,
 * }}
 */
J.POPUPS.EXT.ABS.MergeParams = {
  enableCombat: J.POPUPS.EXT.ABS.PluginParameters['enableMergeCombat'] !== 'false',
  enableSlip: J.POPUPS.EXT.ABS.PluginParameters['enableMergeSlip'] !== 'false',
  enableRewards: J.POPUPS.EXT.ABS.PluginParameters['enableMergeRewards'] !== 'false',
  enableMitigation: J.POPUPS.EXT.ABS.PluginParameters['enableMergeMitigation'] !== 'false',
  idleFlushFrames: Number(J.POPUPS.EXT.ABS.PluginParameters['mergeIdleFlushFrames'] ?? 90),
};

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
J.POPUPS.EXT.ABS.Aliased.JABS_SkillSlot = new Map();
//endregion initialization