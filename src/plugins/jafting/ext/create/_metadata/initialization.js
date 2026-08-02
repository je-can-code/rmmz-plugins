//region initialization
import J_CraftingCreatePluginMetadata from './_pluginMetadata.js';

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

  const requiredJaftingVersion = '2.1.0';
  const hasJaftingRequirement = J.BASE.Helpers.satisfies(J.JAFTING.Metadata.version.version(), requiredJaftingVersion);
  if (hasJaftingRequirement === false)
  {
    throw new Error(`Either missing J-JAFTING or has a lower version than the required: ${requiredJaftingVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.JAFTING.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.JAFTING.EXT.CREATE = {};

/**
 * The metadata associated with this plugin.
 */
J.JAFTING.EXT.CREATE.Metadata = new J_CraftingCreatePluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.JAFTING.EXT.CREATE.Aliased = {};
J.JAFTING.EXT.CREATE.Aliased.Game_Party = new Map();
J.JAFTING.EXT.CREATE.Aliased.Game_System = new Map();
J.JAFTING.EXT.CREATE.Aliased.Scene_Jafting = new Map();
J.JAFTING.EXT.CREATE.Aliased.Window_JaftingList = new Map();
//endregion initialization