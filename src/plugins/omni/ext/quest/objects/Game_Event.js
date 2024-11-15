//region Game_Event
/**
 * Extends {@link meetsConditions}.<br/>
 * Also includes the custom conditions that relate to a quest.
 * @param {any} page
 * @returns {boolean}
 */
J.OMNI.EXT.QUEST.Aliased.Game_Event.set('meetsConditions', Game_Event.prototype.meetsConditions);
Game_Event.prototype.meetsConditions = function(page)
{
  // check original conditions.
  const metOtherPageConditions = J.OMNI.EXT.QUEST.Aliased.Game_Event.get('meetsConditions')
    .call(this, page);

  // if other conditions aren't met, then quest conditions don't override that.
  if (!metOtherPageConditions) return false;

  // grab the list of valid comments.
  //const commentCommandList = this.getValidCommentCommands();
  const commentCommandList = Game_Event.getValidCommentCommandsFromPage(page);

  // there aren't any comments on this event at all.
  if (commentCommandList.length === 0) return true;

  // gather all quest comments from the comment commands of this event.
  const questConditionals = Game_Event.toQuestConditionals(commentCommandList);

  // if there are none, then this event is fine to proceed!
  if (questConditionals.length === 0) return true;

  // determine if all the quest conditionals are satisfied.
  return questConditionals.every(Game_Event.questConditionalMet, this);
};

/**
 * Filters the comment commands to only quest conditionals- should any exist in the collection.
 * @param {rm.types.EventCommand[]} commentCommandList The comment commands to potentially convert to conditionals.
 * @returns {OmniConditional[]}
 */
Game_Event.toQuestConditionals = function(commentCommandList)
{
  // gather all quest comments from the comment commands of this event.
  const questCommentCommands = commentCommandList
    .filter(Game_Event.filterCommentCommandsByEventQuestConditional, this);

  // if there are no quest conditionals available for parsing, don't bother.
  if (questCommentCommands.length === 0) return [];

  // map all the quest conditionals from the parsed regex.
  return questCommentCommands.map(Game_Event.toQuestConditional, this);
};

/**
 * Converts a known comment event command into a conditional for quest control.
 * @param {rm.types.EventCommand} commentCommand The comment command to parse into a conditional.
 * @returns {OmniConditional}
 */
Game_Event.toQuestConditional = function(commentCommand)
{
  // shorthand the comment into a variable.
  const [ comment, ] = commentCommand.parameters;

  let result = null;

  switch (true)
  {
    // FOR WHOLE EVENTS:
    // check if its a basic "while this quest is active" condition.
    case J.OMNI.EXT.QUEST.RegExp.EventQuest.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.EventQuest.exec(comment);
      break;
    // check if its a specific "while this quest is active AND this objective is active.
    case J.OMNI.EXT.QUEST.RegExp.EventQuestObjective.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.EventQuestObjective.exec(comment);
      break;
    // check if its a specific "while this quest is active AND this objective is active.
    case J.OMNI.EXT.QUEST.RegExp.EventQuestObjectiveForState.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.EventQuestObjectiveForState.exec(comment);
      break;

    // JUST FOR CHOICES:
    // check if its a basic "while this quest is active" condition.
    case J.OMNI.EXT.QUEST.RegExp.ChoiceQuest.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.ChoiceQuest.exec(comment);
      break;
    // check if its a specific "while this quest is active AND this objective is active.
    case J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjective.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjective.exec(comment);
      break;
    // check if its a specific "while this quest is active AND this objective is active.
    case J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjectiveForState.test(comment):
      result = J.OMNI.EXT.QUEST.RegExp.ChoiceQuestObjectiveForState.exec(comment);
      break;
  }

  // parse the value out of the regex capture group.
  const [ , val ] = result;
  const parsedVal = JsonMapper.parseObject(val);

  // different sizes result in building conditionals differently.
  switch (parsedVal.length)
  {
    // the quest tag will result in the event page being valid while the quest remains active.
    case 1:
      return new OmniConditional(parsedVal.at(0), null, OmniQuest.States.Active);

    // the quest tag will result in the event page being valid while the objective remains active.
    case 2:
      return new OmniConditional(parsedVal.at(0), parsedVal.at(1), OmniQuest.States.Active);

    // the quest tag will result in the event page being valid while the objective remains in the target state.
    case 3:
      const targetQuestState = OmniQuest.FromStringToStateId(parsedVal.at(2));
      return new OmniConditional(parsedVal.at(0), parsedVal.at(1), targetQuestState);

    default:
      throw new Error(`unknown parsedVal length in quest event tag: ${comment}`);
  }
};

/**
 * A filter function for only including comment event commands relevant to quests.
 * @param {rm.types.EventCommand} command The command being evaluated.
 * @returns {boolean}
 */
Game_Event.filterCommentCommandsByEventQuestConditional = function(command)
{
  // identify the actual comment being evaluated.
  const [ comment, ] = command.parameters;

  // in case the command isn't even valid for comment-validation.
  if (!comment) return false;

  // extract the types of regex we will be considering.
  const { EventQuest, EventQuestObjective, EventQuestObjectiveForState } = J.OMNI.EXT.QUEST.RegExp;
  return [ EventQuest, EventQuestObjective, EventQuestObjectiveForState, ].some(regex => regex.test(comment));
};

/**
 * A filter function for only including comment event commands relevant to quests.
 * @param {rm.types.EventCommand} command The command being evaluated.
 * @returns {boolean}
 */
Game_Event.filterCommentCommandsByChoiceQuestConditional = function(command)
{
  // identify the actual comment being evaluated.
  const [ comment, ] = command.parameters;

  // in case the command isn't even valid for comment-validation.
  if (!comment) return false;

  // extract the types of regex we will be considering.
  const { ChoiceQuest, ChoiceQuestObjective, ChoiceQuestObjectiveForState } = J.OMNI.EXT.QUEST.RegExp;
  return [ ChoiceQuest, ChoiceQuestObjective, ChoiceQuestObjectiveForState, ].some(regex => regex.test(comment));
};

/**
 * Evaluates a {@link OmniConditional} to see if its requirements are currently met.
 * @param {OmniConditional} questConditional The quest conditional to evaluate satisfaction of.
 * @returns {boolean}
 */
Game_Event.questConditionalMet = function(questConditional)
{
  // grab reference to this quest.
  const quest = QuestManager.quest(questConditional.questKey);

  // check if there was an objectiveId from the conditional.
  if (questConditional.objectiveId !== null && questConditional.objectiveId >= 0)
  {
    // validate the quest objective is in the target state- which defaults to active.
    return quest.isObjectiveInState(questConditional.state, questConditional.objectiveId);
  }
  // the conditional didn't have an objective, or it was negative (which translates to quest state evaluation).
  else
  {
    // make sure the quest itself is in the target state.
    return quest.state === questConditional.state;
  }
};
//endregion Game_Event