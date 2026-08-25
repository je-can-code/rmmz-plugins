//region Metadata
import J_LogPluginMetadata from './_pluginMetadata.js';

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
J.LOG = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.LOG.Metadata = new J_LogPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.LOG.Aliased = {};
J.LOG.Aliased.DataManager = new Map();
J.LOG.Aliased.Scene_Map = new Map();

/**
 * The owner of every log channel belonging to {@link Scene_Map}.<br/>
 * Holds the combat, dialog, and loot feeds as {@link MapLogManager} instances, each with its own
 * capacity and its own window: `$mapLogs.action`, `$mapLogs.dialog`, `$mapLogs.loot`.
 * @type {MapLogRegistry}
 */
globalThis.$mapLogs = null;
//endregion introduction