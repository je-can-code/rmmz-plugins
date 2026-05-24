//region Introduction
import J_DangerPluginMetadata from './_pluginMetadata.js';

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
  const requiredJabsVersion = '4.6.0';
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
J.ABS.EXT.DANGER = {};

/**
 * A collection of helper functions for use within this plugin.
 */
J.ABS.EXT.DANGER.Helpers = {};

/**
 * A collection of helper functions for the use with the plugin manager.
 */
J.ABS.EXT.DANGER.Helpers.PluginManager = {};

/**
 * Translates the plugin parameters' JSON into the danger icon metadata.
 * @param {string} obj The JSON to be parsed into danger icons.
 * @returns {{}} A custom object containing KVPs of [name]: [iconIndex].
 */
J.ABS.EXT.DANGER.Helpers.PluginManager.TranslateDangerIndicatorIcons = obj =>
{
  // no danger indicator icons identified.
  if (!obj) return {};

  // parse the JSON and update the values to be actual numbers.
  const raw = JSON.parse(obj);
  Object.keys(raw)
    .forEach(key =>
    {
      raw[key] = parseInt(raw[key]);
    });

  return raw;
};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.DANGER.Metadata = new J_DangerPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of icons that represent the danger level of a given enemy relative to the player.
 */
J.ABS.EXT.DANGER.DangerIndicatorIcons = {
  /**
   * Worthless enemies are 7+ levels below the player.
   * @type {number}
   */
  Worthless: J.ABS.EXT.DANGER.Metadata.DangerIndicatorIcons.Worthless,

  /**
   * Simple enemies are 5-6 levels below the player.
   * @type {number}
   */
  Simple: J.ABS.EXT.DANGER.Metadata.DangerIndicatorIcons.Simple,

  /**
   * Easy enemies are 3-4 levels below the player.
   * @type {number}
   */
  Easy: J.ABS.EXT.DANGER.Metadata.DangerIndicatorIcons.Easy,

  /**
   * Average enemies are +/- 2 levels of the player.
   * @type {number}
   */
  Average: J.ABS.EXT.DANGER.Metadata.DangerIndicatorIcons.Average,

  /**
   * Hard enemies are 3-4 levels above the player.
   * @type {number}
   */
  Hard: J.ABS.EXT.DANGER.Metadata.DangerIndicatorIcons.Hard,

  /**
   * Grueling enemies are 5-6 levels above the player.
   * @type {number}
   */
  Grueling: J.ABS.EXT.DANGER.Metadata.DangerIndicatorIcons.Grueling,

  /**
   * Deadly enemies are 7+ levels above the player.
   * @type {number}
   */
  Deadly: J.ABS.EXT.DANGER.Metadata.DangerIndicatorIcons.Deadly,
};

/**
 * A collection of all extended classes in this plugin.
 */
J.ABS.EXT.DANGER.Aliased = {
  Game_Character: new Map(),
  Game_Event: new Map(),
  JABS_Battler: new Map(),
  JABS_BattlerCoreData: new Map(),
  Sprite_Character: new Map(),
  Spriteset_Map: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.DANGER.RegExp = {};
J.ABS.EXT.DANGER.RegExp.NoIndicator = /<noDangerIndicator>/i;
J.ABS.EXT.DANGER.RegExp.ShowIndicator = /<showDangerIndicator>/i;
//endregion Introduction