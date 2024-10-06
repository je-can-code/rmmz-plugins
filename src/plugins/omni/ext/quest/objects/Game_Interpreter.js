//region Game_Interpreter
/**
 * Extends {@link shouldHideChoiceBranch}.<br/>
 * Includes possibility of hiding quest-related options.
 * @param {number} subChoiceCommandIndex The index in the list of commands of an event that represents this branch.
 * @returns {boolean}
 */
J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.set('shouldHideChoiceBranch',
  Game_Interpreter.prototype.shouldHideChoiceBranch);
Game_Interpreter.prototype.shouldHideChoiceBranch = function(subChoiceCommandIndex)
{
  // perform original logic to see if this branch was already hidden.
  const defaultShow = J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('shouldHideChoiceBranch')
    .call(this, subChoiceCommandIndex);

  // if there is another reason to hide this branch, then do not process quest reasons.
  if (defaultShow) return true;

  // grab some metadata about the event.
  const eventMetadata = $gameMap.event(this.eventId());
  const currentPage = eventMetadata.page();

  // grab the event subcommand.
  const subEventCommand = currentPage.list.at(subChoiceCommandIndex);

  // ignore non-comment event commands.
  if (!eventMetadata.filterInvalidEventCommand(subEventCommand)) return false;

  // ignore non-quest comment commands.
  if (!eventMetadata.filterCommentCommandsByChoiceQuestConditional(subEventCommand)) return false;

  // convert the known-quest-command to a conditional.
  const conditional = eventMetadata.toQuestConditional(subEventCommand);

  // if the condition is met, then we don't need to hide.
  const met = eventMetadata.questConditionalMet(conditional);
  if (met) return false;

  // the conditional isn't met, hide the group.
  return true;
};
//endregion Game_Interpreter