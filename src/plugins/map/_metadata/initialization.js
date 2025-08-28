//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.MAP = {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.MAP.EXT ||= {};

/**
 * The metadata associated with this plugin.
 */
J.MAP.Metadata = new J_MAP__PluginMetadata('J-MAP', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.MAP.Aliased = {};
J.MAP.Aliased.Scene_Map = new Map();
//endregion initialization