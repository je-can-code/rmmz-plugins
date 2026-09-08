//region initialization
import JAbsJuice_PluginMetadata from './_pluginMetadata.js';

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

  // Check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.13.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);
  if (hasJabsRequirement === false)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-Motion plugin, which owns every
  // motion this plugin declares. Without this check a too-old J-Motion produces no error at all -
  // just silently wrong motion - because nothing else in this ship ever inspects it.
  const requiredMotionVersion = '1.1.0';
  const hasMotionRequirement = J.BASE.Helpers.satisfies(J.MOTION.Metadata.version.version(), requiredMotionVersion);
  if (hasMotionRequirement === false)
  {
    throw new Error(`Either missing J-Motion or has a lower version than the required: ${requiredMotionVersion}`);
  }
})();

//endregion version checks

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.JUICE = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.JUICE.Metadata = new JAbsJuice_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.JUICE.Aliased = {};
J.ABS.EXT.JUICE.Aliased.JABS_Engine = new Map();
J.ABS.EXT.JUICE.Aliased.JABS_Battler = new Map();
J.ABS.EXT.JUICE.Aliased.Scene_Map = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.JUICE.RegExp = {
  /**
   * Skill: `<jabsJuiceIcon:N>` — forces weapon swing overlay icon index (IconSet).
   */
  JuiceIcon: /<jabsJuiceIcon:[ ]?(\d+)>/i,

  /**
   * Skill: `<jabsJuiceWeaponStyle:NAME>` — names a row inside weapon-style multipliers JSON.
   */
  JuiceWeaponStyle: /<jabsJuiceWeaponStyle:[ ]?([a-zA-Z0-9_-]+)>/i,

  /**
   * Skill: `<noJuice>` — suppresses all juice motion on the caster when this skill executes.
   */
  NoJuice: /<noJuice>/i,

  /**
   * Skill: `<juiceMotion:NAME>` — selects a preset weapon motion (kebab-case).
   * Weapon overlay: arc | arc-reverse | arc-oscillate | bash | present | recoil | spin | spin-reverse | stab-forward
   * Caster-body: squish | pulse | flip | flip-reverse
   * Suppress: none (equivalent to <noJuice>)
   */
  JuiceMotion: /<juiceMotion:[ ]?([a-zA-Z0-9_-]+)>/i,

  /**
   * Skill: `<juiceSpan:N>` — arc span in degrees for arc / arc-reverse (default 120).
   */
  JuiceSpan: /<juiceSpan:[ ]?(\d+)>/i,

  /**
   * Skill: `<juiceRepeatCount:N>` — number of times to repeat the motion within the juice duration (default 1).
   * For spin / spin-reverse: full rotations. For arc-oscillate: number of arc sweeps (alternating direction).
   * For all other motions: number of full replays within the duration window.
   */
  JuiceRepeatCount: /<juiceRepeatCount:[ ]?(\d+)>/i,

  /**
   * Skill: `<juiceDuration:N>` — overrides the swing animation duration in frames.
   * When omitted, the global `weaponSwingFrames * 2` metadata default is used.
   */
  JuiceDuration: /<juiceDuration:[ ]?(\d+)>/i,

  /**
   * Skill: `<castMotion:NAME>` — selects the body motion shown for the whole of this skill's cast,
   * as opposed to `<juiceMotion:>`, which plays once at execution. Currently: squish.
   * When omitted, the cast shows the default accelerating charge pulse.
   *
   * <pre>
   * Structure:
   *  <castMotion:NAME>
   *
   * Example:
   *  <castMotion:squish>
   *
   * Translation:
   *  while this skill is being cast, the caster squats on a fixed rapid period
   * </pre>
   */
  CastMotion: /<castMotion:[ ]?([a-zA-Z0-9_-]+)>/i,

  /**
   * Skill: `<castMotionPeriod:N>` — how many frames one repetition of the cast motion takes.
   * Smaller is faster. When omitted, the motion type's registered default period is used.
   *
   * <pre>
   * Structure:
   *  <castMotionPeriod:FRAMES>
   *
   * Example:
   *  <castMotionPeriod:6>
   *
   * Translation:
   *  one squat every six frames, ten a second
   * </pre>
   */
  CastMotionPeriod: /<castMotionPeriod:[ ]?(\d+)>/i,

  /**
   * Skill: `<castMotionIntensity:PERCENT>` — how far the body deforms at the peak of each repetition
   * of the cast motion, as a percent of its true size. When omitted, the unarmed strike squish
   * intensity from the juice config is used, which is tuned for a poke rather than a workout.
   *
   * <pre>
   * Structure:
   *  <castMotionIntensity:PERCENT>
   *
   * Example:
   *  <castMotionIntensity:45>
   *
   * Translation:
   *  at the bottom of each squat the sprite is 45% wider and correspondingly shorter
   * </pre>
   */
  CastMotionIntensity: /<castMotionIntensity:[ ]?(\d+)>/i,

  /**
   * Skill: `<juiceStabTipDegrees:N>` — tip/bore bearing from Pixi +x at rotation 0 (stab / bash / recoil; see help).
   */
  JuiceStabTipDegrees: /<juiceStabTipDegrees:[ ]?(-?\d+)>/i,

  /**
   * Skill: `<juiceProfileGun>` — side-profile IconSet gun: flip horizontally instead of ~180° rotation on east/west.
   */
  JuiceProfileGun: /<juiceProfileGun>/i,
};
//endregion initialization