//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.LEVEL.EXT.FLAT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.LEVEL.EXT.FLAT.Metadata = new JLevelMasterFlat_PluginMetadata('J-LEVEL-Flat', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.LEVEL.EXT.FLAT.Aliased = {};
J.LEVEL.EXT.FLAT.Aliased.Game_Troop = new Map();
//endregion initialization