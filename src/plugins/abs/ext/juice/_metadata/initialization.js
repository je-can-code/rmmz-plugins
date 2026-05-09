//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.7.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.Version, requiredJabsVersion);
  if (hasJabsRequirement === false)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
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
J.ABS.EXT.JUICE.Metadata = new JAbsJuice_PluginMetadata('J-ABS-Juice', '1.0.0');

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
   * Skill: `<juiceMotion:NAME>` — selects a preset weapon motion (kebab-case).
   */
  JuiceMotion: /<juiceMotion:[ ]?([a-zA-Z0-9_-]+)>/i,

  /**
   * Skill: `<juiceSpan:N>` — arc span in degrees for arc / arc-reverse (default 120).
   */
  JuiceSpan: /<juiceSpan:[ ]?(\d+)>/i,

  /**
   * Skill: `<juiceSpinCount:N>` — full rotations for spin / spin-reverse (default 1; range 1–8).
   */
  JuiceSpinCount: /<juiceSpinCount:[ ]?(\d+)>/i,

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