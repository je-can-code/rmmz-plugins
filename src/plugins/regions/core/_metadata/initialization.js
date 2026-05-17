//region initialization
import J_RegionEffectsPluginMetadata from './_pluginMetadata.js';
import { PLUGIN_NAME, PLUGIN_VERSION } from "./meta.js";

/**
 * The core where all of my extensions live = in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.REGIONS = {};

/**
 * The parent namespace for all REGIONS extensions.
 */
J.REGIONS.EXT = {};

//region helpers
/**
 * A collection of helpful functions for use within this plugin.
 */
J.REGIONS.Helpers = {};

/**
 * Translates the JSON blob from the plugin parameters into the expected region ids.
 * @param {string} regionsBlob The json blob from the plugin parameters to translate.
 * @returns {number[]} The translated region ids.
 */
J.REGIONS.Helpers.translateRegionIds = regionsBlob =>
{
  // convert the string to an array of strings.
  const parsedRegions = JSON.parse(regionsBlob);

  // return the parsed region ids.
  return parsedRegions.map(id => parseInt(id));
};
//endregion helpers

/**
 * The `metadata` associated with this plugin; such as version.
 */
J.REGIONS.Metadata = new J_RegionEffectsPluginMetadata(PLUGIN_NAME, PLUGIN_VERSION);

/**
 * A collection of all aliased methods for this plugin.
 */
J.REGIONS.Aliased = {};
J.REGIONS.Aliased.Game_Map = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.REGIONS.RegExp = {};
J.REGIONS.RegExp.AllowRegions = /<allowRegions:[ ]?(\[[\d, ]+])>/gi;
J.REGIONS.RegExp.DenyRegions = /<denyRegions:[ ]?(\[[\d, ]+])>/gi;
//endregion initialization