//region Game_Interpreter
/**
 * Extends {@link evaluateChoicesForVisibility}.<br/>
 * Includes hiding quest-specific choices that don't meet the specified conditionals.
 */
J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.set('evaluateChoicesForVisibility',
  Game_Interpreter.prototype.evaluateChoicesForVisibility);
Game_Interpreter.prototype.evaluateChoicesForVisibility = function(params)
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.Game_Interpreter.get('evaluateChoicesForVisibility')
    .call(this, params);

  // also hide the unmet quest conditional choices.
  this.hideQuestSpecificChoices();
};

/**
 * Hide all the choices that don't meet the quest conditionals.
 */
Game_Interpreter.prototype.hideQuestSpecificChoices = function()
{
  const currentCommand = this.currentCommand();
  const eventMetadata = $gameMap.event(this.eventId());
  const currentPage = eventMetadata.page();

  // 102 = start show choice
  // 402 = one of the show choice options
  // 404 = end show choice

  const startShowChoiceIndex = currentPage.list.findIndex(item => item === currentCommand);
  const endShowChoiceIndex = currentPage.list
    .findIndex((item, index) => (index > startShowChoiceIndex && item.indent === currentCommand.indent && item.code === 404));

  // build an array of indexes that align with the options.
  const showChoiceIndices = currentPage.list
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
  const choiceGroupsHidden = choiceGroups.map(choiceGroup =>
  {
    const shouldHideGroup = choiceGroup.some(subChoiceCommandIndex =>
    {
      // grab the event subcommand.
      const subEventCommand = currentPage.list.at(subChoiceCommandIndex);

      // ignore non-comment event commands.
      if (!eventMetadata.filterInvalidEventCommand(subEventCommand)) return false;

      // ignore non-quest comment commands.
      if (!eventMetadata.filterCommentCommandsByChoiceConditional(subEventCommand)) return false;

      // convert the known-quest-command to a conditional.
      const conditional = eventMetadata.toQuestConditional(subEventCommand);

      // if the condition is met, then we don't need to hide.
      const met = eventMetadata.questConditionalMet(conditional);
      if (met) return false;

      // the conditional isn't met, hide the group.
      return true;
    });

    return shouldHideGroup;
  });

  // hide the groups accordingly.
  choiceGroupsHidden
    .forEach((isGroupHidden, choiceIndex) => this.setChoiceHidden(choiceIndex, isGroupHidden), this);
};
//endregion Game_Interpreter