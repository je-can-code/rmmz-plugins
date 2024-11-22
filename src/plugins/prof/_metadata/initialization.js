/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.PROF = {};

/**
 * The metadata associated with this plugin.
 * @type {J_ProficiencyPluginMetadata}
 */
J.PROF.Metadata = new J_ProficiencyPluginMetadata('J-Proficiency', '2.0.0');

/**
 * The various aliases associated with this plugin.
 */
J.PROF.Aliased = {
  Game_Actor: new Map(),
  Game_Action: new Map(),
  Game_Battler: new Map(),
  Game_Enemy: new Map(),
  Game_System: new Map(),

  IconManager: new Map(),
  TextManager: new Map(),
};

J.PROF.RegExp = {};
J.PROF.RegExp.ProficiencyBonus = /<proficiencyBonus:[ ]?(\d+)>/i;
J.PROF.RegExp.ProficiencyGivingBlock = /<proficiencyGivingBlock>/i;
J.PROF.RegExp.ProficiencyGainingBlock = /<proficiencyGainingBlock>/i;
//endregion Introduction