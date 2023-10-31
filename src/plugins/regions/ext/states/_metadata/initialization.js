/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.REGIONS.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.REGIONS.EXT.STATES = {};

/**
 * The metadata associated with this plugin, such as name and version.
 */
J.REGIONS.EXT.STATES.Metadata = new J_RegionStatesPluginMetadata('J-Region-States', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.REGIONS.EXT.STATES.Aliased = {};
J.REGIONS.EXT.STATES.Aliased.Game_Character = new Map();
J.REGIONS.EXT.STATES.Aliased.Game_Map = new Map();
J.REGIONS.EXT.STATES.Aliased.Game_System = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.REGIONS.EXT.STATES.RegExp = {};
J.REGIONS.EXT.STATES.RegExp.RegionState = /<regionAddState:[ ]?(\[\d+, ?\d+, ?\d+, ?\d+])>/gi;
