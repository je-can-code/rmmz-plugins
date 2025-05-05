//region Scene_Jafting
/**
 * Extends {@link #onRootJaftingSelection}.<br>
 * When JAFTING is selected, open the root JAFTING menu.
 */
J.JAFTING.EXT.REFINE.Aliased.Scene_Jafting
  .set('onRootJaftingSelection', Scene_Jafting.prototype.onRootJaftingSelection);
Scene_Jafting.prototype.onRootJaftingSelection = function()
{
  // grab which JAFTING mode was selected.
  const currentSelection = this.getRootJaftingKey();

  // check if the current selection is create.
  if (currentSelection === Scene_JaftingRefine.KEY)
  {
    // execute the monsterpedia.
    this.jaftingRefinementSelected();
  }
  // the current selection is not create.
  else
  {
    // possibly activate other choices.
    J.JAFTING.EXT.REFINE.Aliased.Scene_Jafting.get('onRootJaftingSelection')
      .call(this);
  }
};

/**
 * Switch to the jafting creation scene when selected from the root jafting list.
 */
Scene_Jafting.prototype.jaftingRefinementSelected = function()
{
  // close the root jafting windows.
  this.closeRootJaftingWindows();

  // call the creation scene.
  Scene_JaftingRefine.callScene();
};
//endregion Scene_Jafting