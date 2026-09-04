//region initialization
import J_MOTION_ABS_PluginMetadata from './_pluginMetadata.js';

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
  const requiredMotionVersion = '1.1.0';
  const hasMotionRequirement = J.BASE.Helpers.satisfies(J.MOTION.Metadata.version.version(), requiredMotionVersion);
  if (hasMotionRequirement === false)
  {
    throw new Error(`Either missing J-Motion or has a lower version than the required: ${requiredMotionVersion}`);
  }

  // check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.16.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);
  if (hasJabsRequirement === false)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version checks

/**
 * The plugin umbrella that governs all things related to this extension.
 */
J.MOTION.EXT.ABS = {};

/**
 * The metadata associated with this plugin.
 */
J.MOTION.EXT.ABS.Metadata = new J_MOTION_ABS_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.MOTION.EXT.ABS.Aliased = {};
J.MOTION.EXT.ABS.Aliased.Game_Battler = new Map();
J.MOTION.EXT.ABS.Aliased.JABS_Engine = new Map();
J.MOTION.EXT.ABS.Aliased.Sprite_Character = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.MOTION.EXT.ABS.RegExp = {};

/**
 * The death animation a battler collapses with when it is defeated.
 *
 * Written on a state or an enemy. A state's declaration outranks the enemy's own, so an affix can
 * give an otherwise ordinary creature a more laboured end than it would have had.
 *
 * <pre>
 * Structure:
 *  <deathMotion:STYLE>
 *
 * Example:
 *  <deathMotion:slow>
 *
 * Translation:
 *  This battler dies slowly, dissolving as it goes.
 * </pre>
 * @type {RegExp}
 */
J.MOTION.EXT.ABS.RegExp.DeathMotion = /<deathMotion:[ ]?(\w+)>/i;

/**
 * Suppresses the death animation entirely for whatever carries it.
 *
 * For anything that runs its own show on death - a boss with a scripted collapse, an enemy whose
 * event actions do something more interesting than melting - the automatic animation is in the way,
 * and the delay it holds the corpse open for is worse than in the way.
 *
 * <pre>
 * Structure:
 *  <noDeathMotion>
 * </pre>
 * @type {RegExp}
 */
J.MOTION.EXT.ABS.RegExp.NoDeathMotion = /<noDeathMotion>/i;
//endregion initialization