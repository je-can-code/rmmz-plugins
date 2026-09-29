//region initialization
import J_ClassPluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.20.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // check to ensure we have the minimum required version of the J-CMS plugin.
  const requiredCmsVersion = '1.2.1';
  const hasCmsRequirement = J.BASE.Helpers.satisfies(J.CMS.Metadata.version.version(), requiredCmsVersion);
  if (hasCmsRequirement === false)
  {
    throw new Error(`Either missing J-CMS or has a lower version than the required: ${requiredCmsVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.CLASS = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.CLASS.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.CLASS.Metadata = new J_ClassPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.CLASS.Aliased = {};
J.CLASS.Aliased.Game_Actor = new Map();
J.CLASS.Aliased.Scene_Menu = new Map();
J.CLASS.Aliased.Window_MenuCommand = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.CLASS.RegExp = {};

/**
 * The actors a class may be unlocked for. A class without it is open to anyone; a class with it unlocks
 * only for the actors it names, and shows in their class lists as "???" until they do.
 *
 * <pre>
 * Structure:
 *  <unlockableForActors:[ACTOR_IDS]>
 *
 * Example:
 *  <unlockableForActors:[1]>
 *
 * Translation:
 *  Only actor 1 can unlock this class.
 * </pre>
 * @type {RegExp}
 */
J.CLASS.RegExp.UnlockableForActors = /<unlockableForActors: ?(\[[\d, ]+])>/i;
//endregion initialization