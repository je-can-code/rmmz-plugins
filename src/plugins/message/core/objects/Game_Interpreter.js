//region Game_Interpreter
import MessageChain from '../services/MessageChain.js';

/**
 * Extends {@link command101}.<br/>
 * Also welds the messages written after this one onto it, for as long as they ask to be welded.
 *
 * Done from the interpreter because the interpreter is the only thing that can see what comes next.
 * By the time a window is involved the message has been handed over as finished text, and the event
 * commands it was assembled from are no longer part of the conversation.
 * @param {Array} params The parameters of the Show Text command.
 * @returns {boolean} True if the message was started.
 */
J.MESSAGE.Aliased.Game_Interpreter.set('command101', Game_Interpreter.prototype.command101);
Game_Interpreter.prototype.command101 = function(params)
{
  // perform original logic.
  const started = J.MESSAGE.Aliased.Game_Interpreter.get('command101')
    .call(this, params);

  // the original declines to begin while a message is still on screen, and deliberately leaves the
  // command index where it found it so the interpreter can try again next frame. Welding onto a
  // message that was never assembled would march that index over lines nobody ever added.
  if (started === false) return false;

  const welded = this.weldLinkedMessages();

  // nothing moved, so the command the original dispatched against is still the one after this.
  if (welded === false) return true;

  this.setupMessageFollowUp();

  return true;
};

/**
 * Swallows the messages written after this one, for as long as each in turn asks to be swallowed.
 * @returns {boolean} True if at least one message was welded on.
 */
Game_Interpreter.prototype.weldLinkedMessages = function()
{
  let welded = false;

  while (this.canWeldNextMessage())
  {
    this.weldNextMessage();

    welded = true;
  }

  return welded;
};

/**
 * Whether the message written after this one should join it.
 * @returns {boolean}
 */
Game_Interpreter.prototype.canWeldNextMessage = function()
{
  // the message just assembled has to have asked for company.
  if ($gameMessage.hasMoreLink() === false) return false;

  // and there has to be another Show Text waiting immediately after it. Anything else - the page
  // running out, a branch closing, a choice opening - ends the chain whatever the author asked for.
  // That is also what keeps a chain inside its own branch: the engine always closes a branch with a
  // command of its own, so the next Show Text at a different indent is never the very next command.
  if (this.nextEventCode() !== 101) return false;

  return this.willLinkedMessageFit();
};

/**
 * Whether the message written after this one still has room on screen to be shown in.
 * @returns {boolean}
 */
Game_Interpreter.prototype.willLinkedMessageFit = function()
{
  const currentRows = $gameMessage.texts().length;
  const incomingRows = this.countLinkedMessageRows();
  const maxRows = this.maxWeldedMessageRows();

  return MessageChain.fits(currentRows, incomingRows, maxRows);
};

/**
 * How many lines the message written after this one holds.
 * @returns {number}
 */
Game_Interpreter.prototype.countLinkedMessageRows = function()
{
  const commands = this.list();

  // two past the command being executed: one step onto the Show Text, and one onto its first line.
  let index = this.index() + 2;
  let rows = 0;

  // 401 is a line of text belonging to the Show Text above it. Every command list ends in a
  // terminator command, so this walk always has something to stop against.
  while (commands.at(index).code === 401)
  {
    rows += 1;
    index += 1;
  }

  return rows;
};

/**
 * How many rows of text the screen has room to show at once.
 *
 * Every number here is read off a prototype, because an interpreter has neither a window nor a scene
 * to ask - and because that is how the engine itself does it, `calcWindowHeight` reaching for
 * `fittingHeight` on exactly these terms while building the very window being measured.
 *
 * The scene's own rectangle is asked for rather than assumed, because the cap has to be derived from
 * the same box the window grows out of. A ceiling counted straight off the screen and a height grown
 * from the message box agree only where the arithmetic leaves slack, which at most resolutions it
 * does not.
 * @returns {number}
 */
Game_Interpreter.prototype.maxWeldedMessageRows = function()
{
  const lineHeight = Window_Base.prototype.lineHeight();
  const padding = $gameSystem.windowPadding();

  const defaultRect = Scene_Message.prototype.messageWindowRect();
  const defaultHeight = defaultRect.height;
  const defaultRows = MessageChain.rowsFor(defaultHeight, lineHeight, padding);

  return MessageChain.maxRows(Graphics.boxHeight, defaultHeight, defaultRows, lineHeight);
};

/**
 * Swallows the Show Text written after this one, adding its lines to the message being assembled.
 */
Game_Interpreter.prototype.weldNextMessage = function()
{
  // lowered before the incoming lines are read, so that whatever it says afterwards is what *those*
  // lines asked for rather than what the message before them did.
  $gameMessage.flagMoreLink(false);

  // step onto the Show Text itself. Its face, position and speaker are deliberately never applied,
  // which is what makes the first message of a chain the one whose presentation the whole chain
  // wears - a welded run is one utterance, so it gets one speaker.
  this.setIndex(this.index() + 1);

  // the same walk the original performs, over the lines belonging to the command just landed on.
  while (this.nextEventCode() === 401)
  {
    this.setIndex(this.index() + 1);

    const command = this.currentCommand();
    const line = command.parameters.at(0);

    $gameMessage.add(line);
  }
};

/**
 * Offers the command sitting after the welded message to the handlers that can claim it.
 *
 * A mirror of the dispatch the original performs, and it exists because the original performed it
 * against the wrong command: it looked at the Show Text this message has since swallowed. Without
 * this, a chain ending in a "Show Choices" would reach the player as a message with no choices
 * beneath it, and the branch the author wrote would never run.
 */
Game_Interpreter.prototype.setupMessageFollowUp = function()
{
  const code = this.nextEventCode();

  // anything else belongs to the interpreter's ordinary march and is left exactly where it was.
  if (this.isMessageFollowUpCode(code) === false) return;

  // all three handlers expect to be standing on the command they are about to set up.
  this.setIndex(this.index() + 1);

  const command = this.currentCommand();
  const { parameters } = command;

  switch (code)
  {
    case 102:
      this.setupChoices(parameters);
      break;
    case 103:
      this.setupNumInput(parameters);
      break;
    case 104:
      this.setupItemChoice(parameters);
      break;
  }
};

/**
 * Whether an event command code is one that a message hands off to as it finishes.
 * @param {number} code The event command code in question.
 * @returns {boolean}
 */
Game_Interpreter.prototype.isMessageFollowUpCode = function(code)
{
  // 102 is "Show Choices", 103 is "Input Number", and 104 is "Select Item".
  return code === 102 || code === 103 || code === 104;
};

/**
 * Extends {@link setupChoices}.<br/>
 * Backs up the original choices identified by the completed setup.
 */
J.MESSAGE.Aliased.Game_Interpreter.set('setupChoices', Game_Interpreter.prototype.setupChoices);
Game_Interpreter.prototype.setupChoices = function(params)
{
  // perform original choice setup logic.
  // perform original logic.
  J.MESSAGE.Aliased.Game_Interpreter.get('setupChoices')
    .call(this, params);

  // also backup the original options.
  $gameMessage.backupChoices();

  // add a hook for evaluating visibility of choices.
  this.evaluateChoicesForVisibility(params);
};

/**
 * A hook for evaluating visibility of choices programmatically.
 * @param {RPG_EventListCommand[]} params The choices parameters being setup.
 */
Game_Interpreter.prototype.evaluateChoicesForVisibility = function(params)
{
  // also hide the unmet quest conditional choices.
  this.hideSpecificChoiceBranches(params);
};

/**
 * Hide all the choices that don't meet the criteria.
 * @param {RPG_EventListCommand} params The event command parameters.
 */
// eslint-disable-next-line no-unused-vars
Game_Interpreter.prototype.hideSpecificChoiceBranches = function(params)
{
  // identify some event metadata.
  const currentCommand = this.currentCommand();
  const currentPageCommands = this.list();

  // 102 = start show choice
  // 402 = one of the show choice options
  // 404 = end show choice

  // identify the start and end of the choice branches.
  const startShowChoiceIndex = currentPageCommands.findIndex(item => item === currentCommand);
  const endShowChoiceIndex = currentPageCommands.findIndex((
    item,
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
    const startIndex = choiceIndex;
    const endIndex = showChoiceIndices.at(index + 1);

    let counterIndex = startIndex;
    const choiceGroup = [];
    while (counterIndex < endIndex)
    {
      choiceGroup.push(counterIndex);
      counterIndex++;
    }

    // Append the row to the working collection.
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
  // grab the commands surrounding the choice being evaluated.
  const currentPageCommands = this.list();

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