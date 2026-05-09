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
  const requiredJabsVersion = '4.6.0';
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
J.ABS.EXT.POSES = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.ABS.EXT.POSES.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.POSES.Metadata = new J_PosesPluginMetadata('J-ABS-Poses', '1.0.4');

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.POSES.Aliased = {};
J.ABS.EXT.POSES.Aliased.JABS_Battler = new Map();
J.ABS.EXT.POSES.Aliased.JABS_Engine = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.POSES.RegExp = {};
J.ABS.EXT.POSES.RegExp.PoseSuffix = /<poseSuffix:[ ]?(\[[-_]?\w+,[ ]?\d+,[ ]?\d+])>/gi;
//endregion initialization