/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '2.1.3';
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
J.JAFTING = {};

/**
 * A collection of all extensions for JAFTING.
 */
J.JAFTING.EXT = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.JAFTING.Metadata = new J_CraftingPluginMetadata('J-JAFTING', '2.0.0');

/**
 * A helpful mapping of all the various RMMZ classes being extended.
 */
J.JAFTING.Aliased = {};
J.JAFTING.Aliased.Game_Party = new Map();
//endregion Introduction