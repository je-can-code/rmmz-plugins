/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '2.1.2';
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
J.LOG = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.LOG.Metadata = {};
J.LOG.Metadata.Name = `J-Log`;
J.LOG.Metadata.Version = `2.1.0`;

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.LOG.PluginParameters = PluginManager.parameters(J.LOG.Metadata.Name);
J.LOG.Metadata.InactivityTimerDuration = Number(J.LOG.PluginParameters['defaultInactivityTime']);

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
var $mapLogManager = null;

/**
 * One of the log managers that are for {@link Scene_Map}.<br/>
 * This manager handles the window that contains the various chat messages.
 * @type {MapLogManager}
 */
var $diaLogManager = null;
//endregion introduction