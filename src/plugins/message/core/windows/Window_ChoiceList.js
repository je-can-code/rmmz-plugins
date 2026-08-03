//region Window_ChoiceList
/**
 * Extends {@link makeCommandList}.<br/>
 * Post-modifies the commands to remove "hidden" choices.
 */
J.MESSAGE.Aliased.Window_ChoiceList.set('makeCommandList', Window_ChoiceList.prototype.makeCommandList);
Window_ChoiceList.prototype.makeCommandList = function()
{
  $gameMessage.restoreChoices();
  this.clearChoiceMap();

  // perform original logic.
  J.MESSAGE.Aliased.Window_ChoiceList.get('makeCommandList')
    .call(this);

  let needsUpdate = false;

  // iterate over all the choices in this list in reverse to avoid index issues.
  for (let i = this.commandList().length; i > -1; i--)
  {
    // check if the choice is hidden by its index.
    if ($gameMessage.isChoiceHidden(i))
    {
      // remove the hidden choice from this window.
      this.commandList().splice(i, 1);

      // remove the hidden choice from the message data.
      $gameMessage._choices.splice(i, 1);

      // flag for needing resizing at the end of the adjustments.
      needsUpdate = true;
    }
    else
    {
      // Add this to our choice map.
      this.choiceMap().unshift(i);
    }
  }

  // If any there were changes to the choices.
  if (needsUpdate === true)
  {
    // update this window's placement.
    this.updatePlacement();
  }
};

/* Stores the choice numbers at each index */
Window_ChoiceList.prototype.clearChoiceMap = function()
{
  this.setChoiceMap([]);
};

/**
 * Overwrites {@link callOkHandler}.<br/>
 * Uses the index of our custom list instead of the original list.
 */
Window_ChoiceList.prototype.callOkHandler = function()
{
  $gameMessage.onChoice(this.choiceMap()[this.index()]);
  this.messageWindow().terminateMessage();
  this.close();
};

//region properties
/**
 * Gets the choice map.
 * @returns {number[]} The choiceMap.
 */
Window_ChoiceList.prototype.choiceMap = function()
{
  // hand back the choice map.
  return this._choiceMap;
};

/**
 * Sets the choice map.
 * @param {number[]} newChoiceMap The new choiceMap.
 */
Window_ChoiceList.prototype.setChoiceMap = function(newChoiceMap)
{
  // assign the choice map.
  this._choiceMap = newChoiceMap;
};
//endregion properties
//endregion Window_ChoiceList