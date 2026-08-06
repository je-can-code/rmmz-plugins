//region Introduction
import J_CraftingPluginMetadata from './_pluginMetadata.js';

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
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.JAFTING = {};

/**
 * A collection of all extensions for JAFTING.
 */
J.JAFTING.EXT = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.JAFTING.Metadata = new J_CraftingPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A helpful mapping of all the various RMMZ classes being extended.
 */
J.JAFTING.Aliased = {};
J.JAFTING.Aliased.Game_Party = new Map();
J.JAFTING.Aliased.DataManager = new Map();
J.JAFTING.Aliased.Scene_Jafting = new Map();
J.JAFTING.Aliased.Scene_Map = new Map();
//endregion Introduction