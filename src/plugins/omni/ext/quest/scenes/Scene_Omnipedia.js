//region Scene_Omnipedia
//region root actions
/**
 * Extends {@link #onRootPediaSelection}.<br>
 * When the monsterpedia is selected, open the monsterpedia.
 */
J.OMNI.EXT.QUEST.Aliased.Scene_Omnipedia.set('onRootPediaSelection', Scene_Omnipedia.prototype.onRootPediaSelection);
Scene_Omnipedia.prototype.onRootPediaSelection = function()
{
  // grab which pedia was selected.
  const currentSelection = this.getRootOmnipediaKey();

  // check if the current selection is the questopedia.
  if (currentSelection === J.OMNI.EXT.QUEST.Metadata.Command.Symbol)
  {
    // execute the questopedia.
    this.questopediaSelected();
  }
  // the current selection is not the questopedia.
  else
  {
    // possibly activate other choices.
    J.OMNI.EXT.QUEST.Aliased.Scene_Omnipedia.get('onRootPediaSelection')
      .call(this);
  }
}

/**
 * Switch to the questopedia when selected from the root omnipedia list.
 */
Scene_Omnipedia.prototype.questopediaSelected = function()
{
  // close the root omnipedia windows.
  this.closeRootPediaWindows();

  // call the questopedia scene.
  Scene_Questopedia.callScene();
}
//endregion root actions
//endregion Scene_Omnipedia