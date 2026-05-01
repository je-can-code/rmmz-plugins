//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.PASSIVE.EXT.OTIB = {};

/**
 * The metadata associated with this plugin.
 */
J.PASSIVE.EXT.OTIB.Metadata = new JPassiveOTIB_PluginMetadata('J-Passive-OTIB', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.PASSIVE.EXT.OTIB.Aliased = {};
J.PASSIVE.EXT.OTIB.Aliased.Game_Actor = new Map();
J.PASSIVE.EXT.OTIB.Aliased.Game_Battler = new Map();
J.PASSIVE.EXT.OTIB.Aliased.Scene_Boot = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.PASSIVE.EXT.OTIB.RegExp = {};

/**
 * The tag for one-time item boost state ids on an item.
 * Expected format: <otib:[STATE_ID, ...]>
 */
J.PASSIVE.EXT.OTIB.RegExp.OtibStateIds = /<otib:[ ]?(\[[\d, ]+])>/i;
//endregion initialization