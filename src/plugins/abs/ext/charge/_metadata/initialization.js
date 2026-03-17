/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.5.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.Version, requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this extension plugin.
 */
J.ABS.EXT.CHARGE = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ABS.EXT.CHARGE.Metadata = {
  /**
   * The name of this plugin.
   */
  Name: `J-ABS-Charge`,

  /**
   * The version of this plugin.
   */
  Version: '1.0.2',
};

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.ABS.EXT.CHARGE.PluginParameters = PluginManager.parameters(J.ABS.EXT.CHARGE.Metadata.Name);

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ABS.EXT.CHARGE.Metadata = {
  // the original properties.
  ...J.ABS.EXT.CHARGE.Metadata,

  /**
   * The default charging animation id.
   * 0 will yield no default animation.
   * @type {number}
   */
  DefaultChargingAnimationId: parseInt(J.ABS.EXT.CHARGE.PluginParameters['defaultChargingAnimId']),

  /**
   * The default tier complete animation id.
   * 0 will yield no default animation.
   * @type {number}
   */
  DefaultTierCompleteAnimationId: parseInt(J.ABS.EXT.CHARGE.PluginParameters['defaultTierCompleteAnimId']),

  /**
   * The default fully charged animation id.
   * 0 will yield no default animation.
   * @type {number}
   */
  DefaultFullyChargedAnimationId: parseInt(J.ABS.EXT.CHARGE.PluginParameters['defaultFullyChargedAnimId']),

  /**
   * The sound effect to play when the a charging tier has completed.
   * @type {RPG_SoundEffect}
   */
  TierCompleteSE: J.ABS.EXT.CHARGE.PluginParameters['tierCompleteSE'],

  /**
   * The sound effect to play when the final charge tier has completed charging.
   * @type {RPG_SoundEffect}
   */
  ChargeReadySE: J.ABS.EXT.CHARGE.PluginParameters['chargeReadySE'],

  /**
   * Whether or not to use the charging tier complete sound effect.
   * @type {boolean}
   */
  UseTierCompleteSE: J.ABS.EXT.CHARGE.PluginParameters['useDefaultChargingSE'] === "true",

  /**
   * Whether or not to use the charging tier complete sound effect when there is an animation present.
   * @type {boolean}
   */
  AllowTierCompleteSEandAnimation: J.ABS.EXT.CHARGE.PluginParameters['allowTierCompleteSEandAnim'] === "true",
};

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.CHARGE.Aliased = {
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  Game_BattlerBase: new Map(),
  Game_Enemy: new Map(),
  JABS_Action: new Map(),
  JABS_Battler: new Map(),
  JABS_StandardController: new Map(),
  SoundManager: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.CHARGE.RegExp = {
  ChargeData: /<chargeTier:[ ]?(\[\d+,[ ]?\d+,[ ]?\d+(,[ ]?\d+(,[ ]?\d+)?)?])>/gi,
};
//endregion Introduction