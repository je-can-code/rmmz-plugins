//region initialization
import J__TEMPLATE___PluginMetadata from './_pluginMetadata.js';

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
 * The plugin umbrella that governs all things related to this plugin.
 */
J.__TEMPLATE__ = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.__TEMPLATE__.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.__TEMPLATE__.Metadata = new J__TEMPLATE___PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.__TEMPLATE__.Aliased = {};
J.__TEMPLATE__.Aliased.Game_Action = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.__TEMPLATE__.RegExp = {};
J.__TEMPLATE__.RegExp.Points = /<tag:[ ]?(\d+)>/i;
//endregion initialization