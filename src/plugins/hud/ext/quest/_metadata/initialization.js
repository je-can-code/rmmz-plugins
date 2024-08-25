//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.HUD.EXT.QUEST ||= {};

/**
 * The metadata associated with this plugin.
 */
J.HUD.EXT.QUEST.Metadata = new J_HUD_Quest_PluginMetadata('J-HUD-QuestFrame', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.HUD.EXT.QUEST.Aliased = {};
J.HUD.EXT.QUEST.Aliased.Scene_Map = new Map();
J.HUD.EXT.QUEST.Aliased.Scene_Questopedia = new Map();
J.HUD.EXT.QUEST.Aliased.TrackedOmniQuest = new Map();
J.HUD.EXT.QUEST.Aliased.TrackedOmniObjective = new Map();
J.HUD.EXT.QUEST.Aliased.HudManager = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.HUD.EXT.QUEST.RegExp = {};
J.HUD.EXT.QUEST.RegExp.Points = /<tag:[ ]?(\d+)>/i;
//endregion initialization