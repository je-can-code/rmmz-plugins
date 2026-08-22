//region Metadata
import J_DropsControlPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.DROPS = {};

/**
 * The plugin umbrella that governs all extensions related to this plugin.
 */
J.DROPS.EXT = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.DROPS.Metadata = new J_DropsControlPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * All regular expressions used by this plugin.
 */
J.DROPS.RegExp = {};
J.DROPS.RegExp.ExtraDrop = /<drops:[ ]?(\[(i|item|w|weapon|a|armor),[ ]?(\d+),[ ]?(\d+)])>/i;
J.DROPS.RegExp.DropMultiplier = /<dropMultiplier:[ ]?(-?\d+)>/i;
J.DROPS.RegExp.GoldMultiplier = /<goldMultiplier:[ ]?(-?\d+)>/i;

// natural growth tags for dor (temporary buffs).
J.DROPS.RegExp.DropRateBuffPlus = /<dorBuffPlus:\[([+\-*/ ().\w]+)]>/gi;
J.DROPS.RegExp.DropRateBuffRate = /<dorBuffRate:\[([+\-*/ ().\w]+)]>/gi;

// natural growth tags for dor (permanent growths).
J.DROPS.RegExp.DropRateGrowthPlus = /<dorGrowthPlus:\[([+\-*/ ().\w]+)]>/gi;
J.DROPS.RegExp.DropRateGrowthRate = /<dorGrowthRate:\[([+\-*/ ().\w]+)]>/gi;

/**
 * The collection of all aliased classes for extending.
 */
J.DROPS.Aliased = {
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  Game_Enemy: new Map(),
  RPG_Enemy: new Map(),

  Scene_Boot: new Map(),
};
//endregion Introduction