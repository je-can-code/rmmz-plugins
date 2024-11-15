//region Game_Interpreter
/**
 * Extends {@link setupChoices}.<br/>
 * Backs up the original choices identified by the completed setup.
 */
J.MESSAGE.Aliased.Game_Interpreter.set('setupChoices', Game_Interpreter.prototype.setupChoices);
Game_Interpreter.prototype.setupChoices = function(params)
{
  // perform original choice setup logic.
  J.MESSAGE.Aliased.Game_Interpreter.get('setupChoices')
    .call(this, params);

  // also backup the original options.
  $gameMessage.backupChoices();

  // add a hook for evaluating visibility of choices.
  this.evaluateChoicesForVisibility(params);
};

/**
 * A hook for evaluating visibility of choices programmatically.
 * @param {rm.types.EventCommand[]} params The choices parameters being setup.
 */
Game_Interpreter.prototype.evaluateChoicesForVisibility = function(params)
{
  // also hide the unmet quest conditional choices.
  this.hideSpecificChoiceBranches(params);
};

/**
 * Hide all the choices that don't meet the criteria.
 * @param {rm.types.EventCommand} params The event command parameters.
 */
Game_Interpreter.prototype.hideSpecificChoiceBranches = function(params)
{
  // identify some event metadata.
  const currentCommand = this.currentCommand();
  const eventMetadata = $gameMap.event(this.eventId());
  const currentPageCommands = !!eventMetadata
    ? eventMetadata.page().list
    : $dataCommonEvents.at(this._commonEventId).list;

  // 102 = start show choice
  // 402 = one of the show choice options
  // 404 = end show choice

  // identify the start and end of the choice branches.
  const startShowChoiceIndex = currentPageCommands.findIndex(item => item === currentCommand);
  const endShowChoiceIndex = currentPageCommands.findIndex((item,
    index) => (index > startShowChoiceIndex && item.indent === currentCommand.indent && item.code === 404));

  // build an array of indexes that align with the options.
  const showChoiceIndices = currentPageCommands
    .map((command, index) =>
    {
      if (index < startShowChoiceIndex || index > endShowChoiceIndex) return null;

      if (currentCommand.indent !== command.indent) return null;

      if (command.code === 402 || command.code === 404) return index;

      return null;
    })
    .filter(choiceIndex => choiceIndex !== null);

  // convert the indices into an array of arrays that represent the actual choice code embedded within the choices.
  const choiceGroups = showChoiceIndices.reduce((runningCollection, choiceIndex, index) =>
  {
    if (showChoiceIndices.length < index) return;
    const startIndex = choiceIndex;
    const endIndex = showChoiceIndices.at(index + 1);

    let counterIndex = startIndex;
    const choiceGroup = [];
    while (counterIndex < endIndex)
    {
      choiceGroup.push(counterIndex);
      counterIndex++;
    }

    runningCollection.push(choiceGroup);

    return runningCollection;
  }, []);

  // an array of booleans where the index aligns with a choice, true being hidden, false being visible.
  const choiceGroupsHidden = choiceGroups.map(choiceGroup => choiceGroup.some(this.shouldHideChoiceBranch, this), this);

  // hide the groups accordingly.
  choiceGroupsHidden
    .forEach((isGroupHidden, choiceIndex) => this.setChoiceHidden(choiceIndex, isGroupHidden), this);
};

/**
 * Determines whether a choice group- as in, a branch in a "Show Choices" event command, should be hidden from view.
 * If this value returns false, it will be displayed. If it returns true, the choice branch will be hidden.
 * @param {number} subChoiceCommandIndex The index in the list of commands of an event that represents this branch.
 * @returns {boolean}
 */
Game_Interpreter.prototype.shouldHideChoiceBranch = function(subChoiceCommandIndex)
{
  // grab some metadata about the event.
  const eventMetadata = $gameMap.event(this.eventId());
  const currentPageCommands = !!eventMetadata
    ? eventMetadata.page().list
    : $dataCommonEvents.at(this._commonEventId).list;

  // grab the event subcommand.
  const subEventCommand = currentPageCommands.at(subChoiceCommandIndex);

  // ignore non-comment event commands.
  if (!Game_Event.filterInvalidEventCommand(subEventCommand)) return false;

  // ignore non-relevant comment commands.
  if (!Game_Event.filterCommentCommandsForBasicConditionals(subEventCommand)) return false;

  // build the conditional.
  const conditional = Game_Event.toBasicConditional(subEventCommand);

  // if the condition is met, then we don't need to hide.
  const met = conditional.isMet();
  if (met) return false;

  // the conditional isn't met, hide the group.
  return true;
};

/**
 * Sets a choice to be hidden- or not. The choiceIndex parameter is 0-based. Set the shouldHide parameter to true for a
 * given choice to hide it.
 * @param {number} choiceIndex The 1-based number of the choice.
 * @param {boolean=} shouldHide Whether or not the choice should be hidden; defaults to true.
 */
Game_Interpreter.prototype.setChoiceHidden = function(choiceIndex, shouldHide = true)
{
  // hide it- or don't.
  $gameMessage.hideChoice(choiceIndex, shouldHide);
};
//endregion Game_Interpreter