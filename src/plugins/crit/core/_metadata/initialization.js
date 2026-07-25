import J_CriticalFactorsPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.CRIT = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.CRIT.Metadata = new J_CriticalFactorsPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.CRIT.Aliased = {
  Game_Action: new Map(),
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  Game_BattlerBase: new Map(),
  Game_Enemy: new Map(),
  IconManager: new Map(),
  TextManager: new Map(),
  Window_SDP_Details: new Map(),

  Scene_Boot: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.CRIT.RegExp = {
  // this-skill only: critical chance and damage modifiers.
  ThisCritDamageChance: /<thisCritChance:\[([+\-*/ ().\w]+)]>/gi,
  ThisCritDamageMultiplier: /<thisCritMultiplier:\[([+\-*/ ().\w]+)]>/gi,
  ThisCritsAlways: /<thisCritsAlways>/gi,

  // this-skill only: conditional crit chance bonus when target has a specific state.
  ThisCritChanceIfState: /<thisCritChanceIfState:(\[\d+,[ ]?\d+])>/gi,

  // this-skill only: conditional crit chance bonus when target has a state with a specific type classifier.
  ThisCritChanceIfStateType: /<thisCritChanceIfStateType:(\[[a-zA-Z][a-zA-Z0-9_-]*,[ ]?\d+])>/gi,

  // this-skill only: guaranteed crit when target has any of the listed states.
  ThisCritsAlwaysIfState: /<thisCritsAlwaysIfState:(\[\d+(?:,[ ]?\d+)*])>/gi,

  // this-skill only: guaranteed crit when target has any state carrying a specific type classifier.
  ThisCritsAlwaysIfStateType: /<thisCritsAlwaysIfStateType:([a-zA-Z][a-zA-Z0-9_-]*)>/gi,

  // this-skill only: on-crit state application for target and self.
  ThisCritApply: /<thisCritApply:[ ]?(\[\d+,[ ]?\d+])>/gi,
  ThisCritSelf:  /<thisCritSelf:[ ]?(\[\d+,[ ]?\d+])>/gi,

  // global (any note source on the attacker): conditional crit chance bonus when target has a specific state.
  CritChanceIfState: /<critChanceIfState:(\[\d+,[ ]?\d+])>/gi,

  // global (any note source on the attacker): conditional crit chance bonus when target has a state with a specific type classifier.
  CritChanceIfStateType: /<critChanceIfStateType:(\[[a-zA-Z][a-zA-Z0-9_-]*,[ ]?\d+])>/gi,

  // global (any note source on the attacker): guaranteed crit when target has any of the listed states.
  CritAlwaysIfState: /<critAlwaysIfState:(\[\d+(?:,[ ]?\d+)*])>/gi,

  // global (any note source on the attacker): guaranteed crit when target has any state carrying a specific type classifier.
  CritAlwaysIfStateType: /<critAlwaysIfStateType:([a-zA-Z][a-zA-Z0-9_-]*)>/gi,

  // global (any note source on the attacker): on-crit state application for target and self.
  OnCritApply: /<onCritApply:[ ]?(\[\d+,[ ]?\d+])>/gi,
  OnCritSelf:  /<onCritSelf:[ ]?(\[\d+,[ ]?\d+])>/gi,

  // global (any note source on the attacker): on-crit state applications skip their own chance roll and always land.
  ForceCritProcs: /<forceCritProcs>/i,

  // base functionality.
  CritDamageReductionBase: /<critReductionBase: ?(\d+)>/gi,
  CritDamageReduction: /<critReduction: ?(\d+)>/gi,
  CritDamageMultiplierBase: /<critMultiplierBase: ?(\d+)>/gi,
  CritDamageMultiplier: /<critMultiplier: ?(\d+)>/gi,

  // for natural growths compatability.
  CritTakenRateBuffPlus: /<ctrBuffPlus:\[([+\-*/ ().\w]+)]>/gi,
  CritTakenRateBuffRate: /<ctrBuffRate:\[([+\-*/ ().\w]+)]>/gi,
  CritTakenRateGrowthPlus: /<ctrGrowthPlus:\[([+\-*/ ().\w]+)]>/gi,
  CritTakenRateGrowthRate: /<ctrGrowthRate:\[([+\-*/ ().\w]+)]>/gi,

  // for natural growths compatability.
  CritDamageMultiplierBuffPlus: /<cdmBuffPlus:\[([+\-*/ ().\w]+)]>/gi,
  CritDamageMultiplierBuffRate: /<cdmBuffRate:\[([+\-*/ ().\w]+)]>/gi,
  CritDamageMultiplierGrowthPlus: /<cdmGrowthPlus:\[([+\-*/ ().\w]+)]>/gi,
  CritDamageMultiplierGrowthRate: /<cdmGrowthRate:\[([+\-*/ ().\w]+)]>/gi,
};
//endregion Introduction