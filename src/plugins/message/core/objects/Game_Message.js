//region Game_Message
/**
 * Extends {@link clear}.<br/>
 * Also clears the custom choice data.
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
 * @returns {*} The hiddenChoiceConditions.
 */
Game_Message.prototype.hiddenChoiceConditions = function()
{
  // hand back the hidden choice conditions.
  return this._hiddenChoiceConditions;
};

/**
 * Sets the hidden choice conditions.
 * @param {*} newHiddenChoiceConditions The new hiddenChoiceConditions.
 */
Game_Message.prototype.setHiddenChoiceConditions = function(newHiddenChoiceConditions)
{
  // assign the hidden choice conditions.
  this._hiddenChoiceConditions = newHiddenChoiceConditions;
};

/**
 * Gets the old choices.
 * @returns {*} The oldChoices.
 */
Game_Message.prototype.oldChoices = function()
{
  // hand back the old choices.
  return this._oldChoices;
};

/**
 * Sets the old choices.
 * @param {*} newOldChoices The new oldChoices.
 */
Game_Message.prototype.setOldChoices = function(newOldChoices)
{
  // assign the old choices.
  this._oldChoices = newOldChoices;
};
//endregion properties
//endregion Game_Message