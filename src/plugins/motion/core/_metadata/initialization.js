//region initialization
import J_MOTION_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.5.0';
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
J.MOTION = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.MOTION.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.MOTION.Metadata = new J_MOTION_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.MOTION.Aliased = {};
J.MOTION.Aliased.Game_Event = new Map();
J.MOTION.Aliased.Sprite_Character = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.MOTION.RegExp = {};

/**
 * A sprite motion declared on the thing that should have it.
 *
 * The capture is the whole bracketed list; the first entry is the motion type and everything after
 * it is that type's positional parameters. Arity cannot live in the pattern because each type
 * takes a different number of them, so the parser validates the count once it knows the type.
 *
 * <pre>
 * Structure:
 *  <motion:[TYPE]>
 *  <motion:[TYPE, PARAM, ...]>
 *
 * Example:
 *  <motion:[breathe]>
 *  <motion:[swing, 15, 200]>
 *  <motion:[tint, #ffa0a0]>
 *
 * Translation:
 *  This character breathes at the default depth and rate.
 *  This character swings 15 degrees each way over a 200 frame cycle.
 *  This character is tinted a pale red.
 * </pre>
 * @type {RegExp}
 */
J.MOTION.RegExp.Motion = /<motion:[ ]?(\[\w+(?:,[ ]?[#\w.-]+)*])>/i;
//endregion initialization