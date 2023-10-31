//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

J.ABS.EXT.FORMULA = {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.FORMULA.Metadata = new JFORMULA_PluginMetadata('J-ABS-Formula', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.FORMULA.Aliased = {};
J.ABS.EXT.FORMULA.Aliased.Game_Action = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.FORMULA.RegExp = {};
J.ABS.EXT.FORMULA.RegExp.Points = /<tag:[ ]?(\d+)>/i;
//endregion initialization