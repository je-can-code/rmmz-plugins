//region Game_Interpreter
/**
 * Extends {@link shouldHideChoiceBranch}.<br/>
 * Includes possibility of hiding time-related options.
 * @param {number} subChoiceCommandIndex The index in the list of commands of an event that represents this branch.
 * @returns {boolean}
 */
J.TIME.Aliased.Game_Interpreter.set('shouldHideChoiceBranch', Game_Interpreter.prototype.shouldHideChoiceBranch);
Game_Interpreter.prototype.shouldHideChoiceBranch = function(subChoiceCommandIndex)
{
  // perform original logic to see if this branch was already hidden.
  const defaultShow = J.TIME.Aliased.Game_Interpreter.get('shouldHideChoiceBranch')
    .call(this, subChoiceCommandIndex);

  // if there is another reason to hide this branch, then do not process quest reasons.
  if (defaultShow) return true;

  // grab some metadata about the event.
  const eventMetadata = $gameMap.event(this.eventId());
  const currentPageCommands = !!eventMetadata
    ? eventMetadata.page().list
    : $dataCommonEvents.at(this._commonEventId).list;

  // grab the event subcommand.
  const subEventCommand = currentPageCommands.at(subChoiceCommandIndex);

  // ignore the comment if its not a tag.
  if (!Game_Event.filterInvalidEventCommand(subEventCommand)) return false;

  // if its not a choice time conditional tag, don't hide it.
  if (!Game_Event.filterCommentCommandsByChoiceTimeConditional(subEventCommand)) return false;

  // convert the known-conditional-command to a conditional.
  const conditional = Game_Event.toTimeConditional(subEventCommand);

  // if the condition is met, then we don't need to hide.
  const met = Game_Event.timeConditionalMet(conditional);
  if (met) return false;

  // the conditional isn't met, hide the group.
  return true;
};
//endregion Game_Interpreter