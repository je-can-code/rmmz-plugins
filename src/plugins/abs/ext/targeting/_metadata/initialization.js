//region initialization
import JTargeting_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

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
  const requiredJabsVersion = '4.12.4';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();

//endregion version check
/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.TARGETING = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.TARGETING.Metadata = new JTargeting_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.TARGETING.Aliased = {};
J.ABS.EXT.TARGETING.Aliased.JABS_InputAdapter = new Map();
J.ABS.EXT.TARGETING.Aliased.Scene_Map = new Map();
J.ABS.EXT.TARGETING.Aliased.JABS_AiManager = new Map();
J.ABS.EXT.TARGETING.Aliased.JABS_Engine = new Map();
J.ABS.EXT.TARGETING.Aliased.Game_Player = new Map();
J.ABS.EXT.TARGETING.Aliased.JABS_Battler = new Map();
J.ABS.EXT.TARGETING.Aliased.Spriteset_Map = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.TARGETING.RegExp = {
  /**
   * Skill: `<targeted>`
   */
  Targeted: /<targeted>/i,
};
//endregion initialization
