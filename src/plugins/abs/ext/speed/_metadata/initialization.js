//region Introduction
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
J.ABS.EXT.SPEED = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ABS.EXT.SPEED.Metadata = {
  /**
   * The name of this plugin.
   */
  Name: `J-ABS-SpeedBoosts`,

  /**
   * The version of this plugin.
   */
  Version: '1.0.1',
};

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.ABS.EXT.SPEED.PluginParameters = PluginManager.parameters(J.ABS.EXT.SPEED.Metadata.Name);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.SPEED.Aliased = {
  Game_Actor: new Map(),
  Game_Character: new Map(),
  Game_Battler: new Map(),
  Game_Enemy: new Map(),

  TextManager: new Map(),
  IconManager: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.SPEED.RegExp = {
  WalkSpeedBoost: /<speedBoost:[ ]?([-]?\d+)>/gi,
};
//endregion Introduction