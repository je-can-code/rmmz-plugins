//region Introduction
import J_SpeedPluginMetadata from './_pluginMetadata.js';

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

  // Check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.13.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);
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
 * The metadata associated with this plugin.
 */
J.ABS.EXT.SPEED.Metadata = new J_SpeedPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.SPEED.Aliased = {
  Scene_Boot: new Map(),
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