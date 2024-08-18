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
  J.MESSAGE.Aliased.Window_ChoiceList.get('makeCommandList').call(this);

  let needsUpdate = false;

  // iterate over all the choices in this list in reverse to avoid index issues.
  for (var i = this._list.length; i > -1; i--)
  {
    // check if the choice is hidden by its index.
    if ($gameMessage.isChoiceHidden(i))
    {
      // remove the hidden choice from this window.
      this._list.splice(i, 1);

      // remove the hidden choice from the message data.
      $gameMessage._choices.splice(i, 1);

      // flag for needing resizing at the end of the adjustments.
      needsUpdate = true;
    }
    else
    {
      // Add this to our choice map.
      this._choiceMap.unshift(i);
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
  this._choiceMap = [];
};

/**
 * Overwrites {@link callOkHandler}.<br/>
 * Uses the index of our custom list instead of the original list.
 */
Window_ChoiceList.prototype.callOkHandler = function()
{
  $gameMessage.onChoice(this._choiceMap[this.index()]);
  this._messageWindow.terminateMessage();
  this.close();
};
//endregion Window_ChoiceList