//region Game_Message
/**
 * Extends {@link clear}.<br/>
 * Also clears the custom choice data and forgets that the last message welded to another.
 */
J.MESSAGE.Aliased.Game_Message.set('clear', Game_Message.prototype.clear);
Game_Message.prototype.clear = function()
{
  // perform original logic.
  J.MESSAGE.Aliased.Game_Message.get('clear')
    .call(this);

  /**
   * An object tracking key:value (index:boolean) pairs for whether or not an index of a choice is hidden.
   * @type {Map<number, boolean>}
   */
  this.setHiddenChoiceConditions(new Map());

  /**
   * A container for backing up the choice collection.
   * @type {string[]}
   */
  this.setOldChoices([]);

  /**
   * Whether the message being assembled continues into the one written after it.
   * @type {boolean}
   */
  this.flagMoreLink(false);
};

/**
 * Extends {@link add}.<br/>
 * Also lifts the weld code out of the line before the line becomes something a player reads.
 *
 * Taken out here rather than while the message is being drawn, because by then the text has been
 * measured, broken into lines and handed to a window - and a code still sitting in it has occupied
 * width and, if nothing happened to consume it, been rendered to the screen. The line that reaches
 * the message should already be the line the player sees.
 * @param {string} text One line of the message.
 */
J.MESSAGE.Aliased.Game_Message.set('add', Game_Message.prototype.add);
Game_Message.prototype.add = function(text)
{
  const spoken = this.extractMoreLink(text);

  // perform original logic.
  J.MESSAGE.Aliased.Game_Message.get('add')
    .call(this, spoken);
};

/**
 * Reads the weld code out of a line, remembering that it was there.
 *
 * The flag is raised here and never lowered here. A message is several lines and the code may sit on
 * any one of them, so a later line finding nothing says nothing about what an earlier line found.
 * Lowering it belongs to the interpreter, which is the only thing that knows where one message ends
 * and the next begins.
 * @param {string} text One line of the message.
 * @returns {string} The line without its weld code, or the line unchanged when it had none.
 */
Game_Message.prototype.extractMoreLink = function(text)
{
  const match = J.MESSAGE.RegExp.MoreLink.exec(text);

  // the overwhelming majority of lines in any project do not continue into another message.
  if (match === null) return text;

  this.flagMoreLink(true);

  return text.replace(match.at(0), String.empty);
};

/**
 * Clones the original choice data into a backup for later use.
 */
Game_Message.prototype.backupChoices = function()
{
  const backup = this.choices()
    .clone();

  this.setOldChoices(backup);
};

/**
 * Restores the cloned original choice data from backup.
 */
Game_Message.prototype.restoreChoices = function()
{
  this._choices = this.oldChoices().clone();
};

/* Returns whether the specified choice is hidden */
/**
 * Determines whether or not this choice is actually hidden.
 * @param {number} choiceIndex The index of the option to check.
 * @returns {boolean}
 */
Game_Message.prototype.isChoiceHidden = function(choiceIndex)
{
  if (this.hiddenChoiceConditions().has(choiceIndex))
  {
    return this.hiddenChoiceConditions().get(choiceIndex);
  }

  return false;
};

/**
 * Sets a choice to be hidden or not.
 * @param {number} choiceIndex The index of the option to set.
 * @param {boolean} isHidden Whether or not this choice is hidden.
 */
Game_Message.prototype.hideChoice = function(choiceIndex, isHidden)
{
  this.hiddenChoiceConditions().set(choiceIndex, isHidden);
};

//region properties
/**
 * Gets the hidden choice conditions.
 * @returns {Map<number, boolean>} The hiddenChoiceConditions.
 */
Game_Message.prototype.hiddenChoiceConditions = function()
{
  // hand back the hidden choice conditions.
  return this._hiddenChoiceConditions;
};

/**
 * Sets the hidden choice conditions.
 * @param {Map<number, boolean>} newHiddenChoiceConditions The new hiddenChoiceConditions.
 */
Game_Message.prototype.setHiddenChoiceConditions = function(newHiddenChoiceConditions)
{
  // assign the hidden choice conditions.
  this._hiddenChoiceConditions = newHiddenChoiceConditions;
};

/**
 * Gets the old choices.
 * @returns {string[]} The oldChoices.
 */
Game_Message.prototype.oldChoices = function()
{
  // hand back the old choices.
  return this._oldChoices;
};

/**
 * Sets the old choices.
 * @param {string[]} newOldChoices The new oldChoices.
 */
Game_Message.prototype.setOldChoices = function(newOldChoices)
{
  // assign the old choices.
  this._oldChoices = newOldChoices;
};

/**
 * The lines of the message being assembled.
 *
 * The engine keeps these in a private field and offers only `allText` and `hasText` against it, so
 * anything wanting to know how many lines a message holds has had nowhere to ask until now.
 * @returns {string[]} The texts.
 */
Game_Message.prototype.texts = function()
{
  // hand back the lines of the message.
  return this._texts;
};

/**
 * Whether the message being assembled continues into the one written after it.
 * @returns {boolean} True when an author welded it to the next message.
 */
Game_Message.prototype.hasMoreLink = function()
{
  // hand back whether this message continues into another.
  return this._moreLinked;
};

/**
 * Sets whether the message being assembled continues into the one written after it.
 * @param {boolean} moreLinked The new moreLinked.
 */
Game_Message.prototype.flagMoreLink = function(moreLinked)
{
  // assign whether this message continues into another.
  this._moreLinked = moreLinked;
};
//endregion properties
//endregion Game_Message