//region Scene_Jafting
/**
 * Extends {@link #onRootJaftingSelection}.<br>
 * When JAFTING is selected, open the root JAFTING menu.
 */
J.JAFTING.EXT.CREATE.Aliased.Scene_Jafting
  .set('onRootJaftingSelection', Scene_Jafting.prototype.onRootJaftingSelection);
Scene_Jafting.prototype.onRootJaftingSelection = function()
{
  // grab which JAFTING mode was selected.
  const currentSelection = this.getRootJaftingKey();

  // check if the current selection is create.
  if (currentSelection === Scene_JaftingCreate.KEY)
  {
    // execute the monsterpedia.
    this.jaftingCreationSelected();
  }
  // the current selection is not create.
  else
  {
    // possibly activate other choices.
    J.JAFTING.EXT.CREATE.Aliased.Scene_Jafting.get('onRootJaftingSelection').call(this);
  }
};

/**
 * Switch to the jafting creation scene when selected from the root jafting list.
 */
Scene_Jafting.prototype.jaftingCreationSelected = function()
{
  // close the root jafting windows.
  this.closeRootJaftingWindows();

  // call the creation scene.
  Scene_JaftingCreate.callScene();
};
//endregion Scene_Jafting