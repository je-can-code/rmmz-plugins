//region JABS_InputController
/**
 * Extends {@link #update}.<br/>
 * Also handles input detection for the the time window toggle shortcut key.
 */
J.TIME.Aliased.JABS_StandardController.set('update', JABS_StandardController.prototype.update);
JABS_StandardController.prototype.update = function()
{
  // perform original logic.
  J.TIME.Aliased.JABS_StandardController.get('update')
    .call(this);

  // update input for the time window toggle shortcut key.
  this.updateTimeWindowAction();
};

/**
 * Monitors and takes action based on player input regarding the time window toggle shortcut key.
 */
JABS_StandardController.prototype.updateTimeWindowAction = function()
{
  // check if the action's input requirements have been met.
  if (this.isTimeWindowActionTriggered())
  {
    // execute the action.
    this.performTimeWindowAction();
  }
};

/**
 * Checks the inputs of the time window action.
 * @returns {boolean}
 */
JABS_StandardController.prototype.isTimeWindowActionTriggered = function()
{
  // this action requires the left stick button to be triggered.
  if (Input.isTriggered(J.ABS.Input.L3))
  {
    return true;
  }

  // input was not triggered.
  return false;
}

/**
 * Executes the time window toggle action.
 */
JABS_StandardController.prototype.performTimeWindowAction = function()
{
  JABS_InputAdapter.performTimeWindowAction();
}
//endregion JABS_InputController