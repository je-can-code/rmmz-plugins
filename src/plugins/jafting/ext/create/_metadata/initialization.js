//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.JAFTING.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.JAFTING.EXT.CREATE = {};

/**
 * The metadata associated with this plugin.
 */
J.JAFTING.EXT.CREATE.Metadata = new J_CraftingCreatePluginMetadata('J-JAFTING-Creation', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.JAFTING.EXT.CREATE.Aliased = {};
J.JAFTING.EXT.CREATE.Aliased.Game_Party = new Map();
J.JAFTING.EXT.CREATE.Aliased.Game_System = new Map();
J.JAFTING.EXT.CREATE.Aliased.Scene_Jafting = new Map();
J.JAFTING.EXT.CREATE.Aliased.Window_JaftingList = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.JAFTING.EXT.CREATE.RegExp = {};
J.JAFTING.EXT.CREATE.RegExp.Points = /<tag:[ ]?(\d+)>/i;
//endregion initialization