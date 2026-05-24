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

/**
 * The collection of all aliased classes for extending.
 */
J.DROPS.Aliased = {
  Game_Enemy: new Map(),
  RPG_Enemy: new Map(),

  Scene_Boot: new Map(),
};
//endregion Introduction