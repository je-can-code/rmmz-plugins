//region initialization
import J_JabsLoadout_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version checks

/**
 * The parent umbrella for all JABS extensions, which this plugin lives beneath.
 */
J.ABS.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.LOADOUT = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.LOADOUT.Metadata = new J_JabsLoadout_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.LOADOUT.Aliased = {};
J.ABS.EXT.LOADOUT.Aliased.Scene_Menu = new Map();
J.ABS.EXT.LOADOUT.Aliased.Window_MenuCommand = new Map();

//endregion initialization