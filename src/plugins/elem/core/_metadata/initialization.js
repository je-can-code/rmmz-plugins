//region Metadata
import J_ElementalisticsPluginMetadata from './_pluginMetadata.js';

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
J.ELEM = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ELEM.Metadata = new J_ElementalisticsPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ELEM.Aliased = {
  Game_Action: new Map(),
  Game_Actor: new Map(),
  Game_Enemy: new Map(),
};

J.ELEM.RegExp = {};
J.ELEM.RegExp.AttackElementIds = /<attackElements:[ ]?(\[[\d, ]+])>/i;
J.ELEM.RegExp.AbsorbElementIds = /<absorbElements:[ ]?(\[[\d, ]+])>/i;
J.ELEM.RegExp.StrictElementIds = /<strictElements:[ ]?(\[[\d, ]+])>/i;
J.ELEM.RegExp.BoostElement      = /<boostElement:[ ]?(\[\d+,[ ]?-?\+?\d+])>/gi;
J.ELEM.RegExp.PierceElement     = /<pierceElement:[ ]?(\[\d+,[ ]?\d+])>/gi;
J.ELEM.RegExp.ThisPierceElement = /<thisPierceElement:[ ]?(\[\d+,[ ]?\d+])>/gi;
//endregion Introduction