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
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.5.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.Version, requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();

//endregion version check
/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.HITSTOP = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.HITSTOP.Metadata = new JHitstop_PluginMetadata('J-ABS-Hitstop', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.HITSTOP.Aliased = {};
J.ABS.EXT.HITSTOP.Aliased.Game_Character = new Map();
J.ABS.EXT.HITSTOP.Aliased.JABS_Engine = new Map();
J.ABS.EXT.HITSTOP.Aliased.JABS_Action = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.HITSTOP.RegExp = {
  /** Skill: `<hitstop:N>` */
  Hitstop: /<hitstop:[ ]?(\d+)>/i,
  /** Skill: `<noHitstop>` */
  NoHitstop: /<noHitstop>/i,
  /** Actor/Enemy: `<hitstopScale:P%>` */
  HitstopScale: /<hitstopScale:[ ]?(\d+)%>/i,
};
//endregion initialization