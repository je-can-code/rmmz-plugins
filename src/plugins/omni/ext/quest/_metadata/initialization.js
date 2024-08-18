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
J.OMNI.EXT.QUEST.Aliased.Game_Event = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_Interpreter = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_Party = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_System = new Map();
J.OMNI.EXT.QUEST.Aliased.Scene_Omnipedia = new Map();
J.OMNI.EXT.QUEST.Aliased.Window_OmnipediaList = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.OMNI.EXT.QUEST.RegExp = {};
J.OMNI.EXT.QUEST.RegExp.EventQuest = /<pageQuestCondition:[ ]?(\[[\w.-]+])>/i;
J.OMNI.EXT.QUEST.RegExp.EventQuestObjective = /<pageQuestCondition:[ ]?(\[([\w.-]+),[ ]?\d+])>/i;
J.OMNI.EXT.QUEST.RegExp.EventQuestObjectiveForState = /<pageQuestCondition:[ ]?(\[([\w.-]+),[ ]?(-?\d+),[ ]?(inactive|active|completed|failed|missed)])>/i;
J.OMNI.EXT.QUEST.RegExp.ChoiceQuest = /<choiceQuestCondition:[ ]?(\[[\w.-]+])>/i;
J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjective = /<choiceQuestCondition:[ ]?(\[([\w.-]+),[ ]?\d+])>/i;
J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjectiveForState = /<choiceQuestCondition:[ ]?(\[([\w.-]+),[ ]?(-?\d+),[ ]?(inactive|active|completed|failed|missed)])>/i;
//endregion initialization