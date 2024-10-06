//region JABS_InputController
/**
 * Extends {@link #update}.<br/>
 * Also handles input detection for the questopedia shortcut key.
 */
J.OMNI.EXT.QUEST.Aliased.JABS_InputController.set('update', JABS_InputController.prototype.update);
JABS_InputController.prototype.update = function()
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.JABS_InputController.get('update')
    .call(this);

  // update input for the questopedia shortcut key.
  this.updateQuestopediaAction();
};

/**
 * Monitors and takes action based on player input regarding the questopedia shortcut key.
 */
JABS_InputController.prototype.updateQuestopediaAction = function()
{
  // check if the action's input requirements have been met.
  if (this.isQuestopediaActionTriggered())
  {
    // execute the action.
    this.performQuestopediaAction();
  }

};

/**
 * Checks the inputs of the questopedia action.
 * @returns {boolean}
 */
JABS_InputController.prototype.isQuestopediaActionTriggered = function()
{
  // this action requires the right stick button to be triggered.
  if (Input.isTriggered(J.ABS.Input.R3))
  {
    return true;
  }

  // input was not triggered.
  return false;
}

/**
 * Executes the questopedia action.
 */
JABS_InputController.prototype.performQuestopediaAction = function()
{
  JABS_InputAdapter.performQuestopediaAction();
}
//endregion JABS_InputController