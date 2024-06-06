//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

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
J.ABS.EXT.POSES.Metadata = new J_PosesPluginMetadata('J-ABS-Poses', '1.0.0');

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