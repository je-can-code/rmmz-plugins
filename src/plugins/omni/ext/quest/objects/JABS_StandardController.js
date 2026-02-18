//region JABS_InputController
/**
 * Extends {@link #update}.<br/>
 * Also handles input detection for the questopedia shortcut key.
 */
J.OMNI.EXT.QUEST.Aliased.JABS_StandardController.set('update', JABS_StandardController.prototype.update);
JABS_StandardController.prototype.update = function()
{
  // perform original logic.
  J.OMNI.EXT.QUEST.Aliased.JABS_StandardController.get('update')
    .call(this);

  // update input for the questopedia shortcut key.
  this.updateQuestopediaAction();
};

/**
 * Monitors and takes action based on player input regarding the questopedia shortcut key.
 */
JABS_StandardController.prototype.updateQuestopediaAction = function()
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
JABS_StandardController.prototype.isQuestopediaActionTriggered = function()
{
  // this action requires the registered quest open to be triggered (edge press).
  if (Input.isActionTriggered("J.OMNI.QUEST", "open-quest-log"))
  {
    return true;
  }

  // input was not triggered.
  return false;
}

/**
 * Executes the questopedia action.
 */
JABS_StandardController.prototype.performQuestopediaAction = function()
{
  JABS_InputAdapter.performQuestopediaAction();
}
//endregion JABS_InputController