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
  this._hiddenChoiceConditions = new Map();

  /**
   * A container for backing up the choice collection.
   * @type {string[]}
   */
  this._oldChoices = [];
};

/**
 * Clones the original choice data into a backup for later use.
 */
Game_Message.prototype.backupChoices = function()
{
  this._oldChoices = this._choices.clone();
};

/**
 * Restores the cloned original choice data from backup.
 */
Game_Message.prototype.restoreChoices = function()
{
  this._choices = this._oldChoices.clone();
};

/* Returns whether the specified choice is hidden */
/**
 * Determines whether or not this choice is actually hidden.
 * @param {number} choiceIndex The index of the option to check.
 * @returns {boolean}
 */
Game_Message.prototype.isChoiceHidden = function(choiceIndex)
{
  if (this._hiddenChoiceConditions.has(choiceIndex))
  {
    return this._hiddenChoiceConditions.get(choiceIndex);
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
  this._hiddenChoiceConditions.set(choiceIndex, isHidden);
};
//endregion Game_Message