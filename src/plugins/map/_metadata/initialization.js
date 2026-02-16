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
J.MAP.Aliased.DataManager = new Map();
J.MAP.Aliased.Game_Event = new Map();
J.MAP.Aliased.Game_Map = new Map();
J.MAP.Aliased.Game_System = new Map();
J.MAP.Aliased.JABS_Engine = new Map();
J.MAP.Aliased.JABS_StandardController = new Map();
J.MAP.Aliased.Scene_Map = new Map();
J.MAP.Aliased.Window_JabsRemapActions = new Map();

J.MAP.RegExp = {};
J.MAP.RegExp.MinimapEvent = /<(?:mm|minimap):(npc|loot|object|teleport|questOffer|questProgress|questTurnIn)>/gi;
J.MAP.RegExp.BlockMinimap = /<blockMinimap>/gi;
J.MAP.RegExp.AreaEvent = /<areaEvent: ?(\d+)x(\d+)>/i;
//endregion initialization