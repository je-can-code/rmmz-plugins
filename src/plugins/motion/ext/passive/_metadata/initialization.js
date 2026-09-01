//region initialization
import J_MOTION_PASSIVE_PluginMetadata from './_pluginMetadata.js';

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

  // check to ensure we have the minimum required version of the J-Motion plugin.
  const requiredMotionVersion = '1.2.0';
  const hasMotionRequirement = J.BASE.Helpers.satisfies(J.MOTION.Metadata.version.version(), requiredMotionVersion);
  if (hasMotionRequirement === false)
  {
    throw new Error(`Either missing J-Motion or has a lower version than the required: ${requiredMotionVersion}`);
  }

  // check to ensure we have the minimum required version of the J-Motion-ABS plugin.
  const requiredMotionAbsVersion = '1.0.0';
  const motionAbsVersion = J.MOTION.EXT.ABS.Metadata.version.version();
  const hasMotionAbsRequirement = J.BASE.Helpers.satisfies(motionAbsVersion, requiredMotionAbsVersion);
  if (hasMotionAbsRequirement === false)
  {
    throw new Error(`Either missing J-Motion-ABS or has a lower version than the required: ${requiredMotionAbsVersion}`);
  }

  // check to ensure we have the minimum required version of the J-Passive plugin.
  const requiredPassiveVersion = '2.3.0';
  const passiveVersion = J.PASSIVE.Metadata.version.version();
  const hasPassiveRequirement = J.BASE.Helpers.satisfies(passiveVersion, requiredPassiveVersion);
  if (hasPassiveRequirement === false)
  {
    throw new Error(`Either missing J-Passive or has a lower version than the required: ${requiredPassiveVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this extension.
 */
J.MOTION.EXT.PASSIVE = {};

/**
 * The metadata associated with this plugin.
 */
J.MOTION.EXT.PASSIVE.Metadata = new J_MOTION_PASSIVE_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.MOTION.EXT.PASSIVE.Aliased = {};
J.MOTION.EXT.PASSIVE.Aliased.Game_Battler = new Map();
J.MOTION.EXT.PASSIVE.Aliased.JABS_AiManager = new Map();

/**
 * All regular expressions used by this plugin.
 *
 * There are none, and that is the point of the plugin: the tag it honours is J-Motion's own, read by
 * J-Motion's own parser, so a passive declares a motion with exactly the syntax everything else uses.
 */
J.MOTION.EXT.PASSIVE.RegExp = {};
//endregion initialization