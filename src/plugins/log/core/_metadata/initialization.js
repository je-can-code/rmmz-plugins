//region Metadata
import MapLogManager from './../managers/MapLogManager.js';
import J_LogPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '2.1.2';
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
 * One of the log managers that are for {@link Scene_Map}.<br/>
 * This manager handles the window that contains the combat and loot interactions.
 * @type {MapLogManager}
 */
globalThis.$actionLogManager = null;

/**
 * One of the log managers that are for {@link Scene_Map}.<br/>
 * This manager handles the window that contains the various chat messages.
 * @type {MapLogManager}
 */
globalThis.$diaLogManager = null;

/**
 * One of the log managers that are for {@link Scene_Map}.<br/>
 * This manager handles the window that contains the various loot messages.
 * @type {MapLogManager}
 */
globalThis.$lootLogManager = null;
//endregion introduction