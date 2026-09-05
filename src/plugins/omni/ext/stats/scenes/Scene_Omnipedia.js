//region Scene_Omnipedia
import Scene_Statistopedia from './Scene_Statistopedia.js';

//region root actions
/**
 * Extends {@link #onRootPediaSelection}.<br/>
 * When the statistopedia is selected, open the statistopedia.
 */
J.OMNI.EXT.STATS.Aliased.Scene_Omnipedia.set('onRootPediaSelection', Scene_Omnipedia.prototype.onRootPediaSelection);
Scene_Omnipedia.prototype.onRootPediaSelection = function()
{
  // grab which pedia was selected.
  const currentSelection = this.getRootOmnipediaKey();

  // check if the current selection is the statistopedia.
  if (currentSelection === J.OMNI.EXT.STATS.Metadata.Command.Symbol)
  {
    // execute the statistopedia.
    this.statistopediaSelected();
  }
  // the current selection is not the statistopedia.
  else
  {
    // possibly activate other choices.
    // perform original logic.
    J.OMNI.EXT.STATS.Aliased.Scene_Omnipedia.get('onRootPediaSelection')
      .call(this);
  }
};

/**
 * Switch to the statistopedia when selected from the root omnipedia list.
 */
Scene_Omnipedia.prototype.statistopediaSelected = function()
{
  // close the root omnipedia windows.
  this.closeRootPediaWindows();

  // call the statistopedia scene.
  Scene_Statistopedia.callScene();
};
//endregion root actions
//endregion Scene_Omnipedia