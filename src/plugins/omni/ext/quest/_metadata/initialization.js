//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.OMNI.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.OMNI.EXT.QUEST = {};

/**
 * The metadata associated with this plugin.
 */
J.OMNI.EXT.QUEST.Metadata = new J_QUEST_PluginMetadata('J-Omni-Questopedia', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.OMNI.EXT.QUEST.Aliased = {};
J.OMNI.EXT.QUEST.Aliased.Scene_Omnipedia = new Map();
J.OMNI.EXT.QUEST.Aliased.Window_OmnipediaList = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.OMNI.EXT.QUEST.RegExp = {};
J.OMNI.EXT.QUEST.RegExp.Points = /<tag:[ ]?(\d+)>/i;
//endregion initialization