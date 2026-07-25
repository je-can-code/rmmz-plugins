/* eslint-disable max-len */
//region initialization
import J_QUEST_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  const requiredOmniVersion = '1.0.0';
  const hasOmniRequirement = J.BASE.Helpers.satisfies(J.OMNI.Metadata.version.version(), requiredOmniVersion);
  if (hasOmniRequirement === false)
  {
    throw new Error(`Either missing J-Omnipedia or has a lower version than the required: ${requiredOmniVersion}`);
  }
})();
//endregion version check

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
J.OMNI.EXT.QUEST.Metadata = new J_QUEST_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.OMNI.EXT.QUEST.Aliased = {};
J.OMNI.EXT.QUEST.Aliased.DataManager = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_Enemy = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_Event = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_Interpreter = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_Map = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_Party = new Map();
J.OMNI.EXT.QUEST.Aliased.Game_System = new Map();
J.OMNI.EXT.QUEST.Aliased.JABS_StandardController = new Map();
J.OMNI.EXT.QUEST.Aliased.Scene_Omnipedia = new Map();
J.OMNI.EXT.QUEST.Aliased.Window_OmnipediaList = new Map();
J.OMNI.EXT.QUEST.Aliased.Window_JabsRemapActions = new Map();

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