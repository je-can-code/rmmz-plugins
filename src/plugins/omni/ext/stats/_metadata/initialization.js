//region Metadata
import J_OmniStats_PluginMetadata from './_pluginMetadata.js';

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

  const requiredOmniVersion = '1.0.0';
  const hasOmniRequirement = J.BASE.Helpers.satisfies(J.OMNI.Metadata.version.version(), requiredOmniVersion);
  if (hasOmniRequirement === false)
  {
    throw new Error(`Either missing J-Omnipedia or has a lower version than the required: ${requiredOmniVersion}`);
  }
})();
//endregion version check

/**
 * The over-arching extensions collection for this plugin.
 */
J.OMNI.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.OMNI.EXT.STATS = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.OMNI.EXT.STATS.Metadata = new J_OmniStats_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.OMNI.EXT.STATS.Aliased = {};
J.OMNI.EXT.STATS.Aliased.Game_Map = new Map();
J.OMNI.EXT.STATS.Aliased.Game_Party = new Map();
J.OMNI.EXT.STATS.Aliased.JABS_Engine = new Map();
J.OMNI.EXT.STATS.Aliased.Scene_Omnipedia = new Map();
J.OMNI.EXT.STATS.Aliased.Window_OmnipediaList = new Map();
//endregion Metadata