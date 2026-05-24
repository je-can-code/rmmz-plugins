//region Scene_Jafting
import Scene_JaftingRefine from './Scene_JaftingRefine.js';

/**
 * Extends {@link #onRootJaftingSelection}.<br>
 * When Refinement is chosen on the JAFTING hub, opens the Refinement scene.
 */
J.JAFTING.EXT.REFINE.Aliased.Scene_Jafting
  .set('onRootJaftingSelection', Scene_Jafting.prototype.onRootJaftingSelection);
Scene_Jafting.prototype.onRootJaftingSelection = function()
{
  const currentSelection = this.getRootJaftingKey();

  if (currentSelection === Scene_JaftingRefine.KEY)
  {
    this.jaftingRefinementSelected();
  }
  else
  {
    // possibly activate other choices.
    J.JAFTING.EXT.REFINE.Aliased.Scene_Jafting.get('onRootJaftingSelection')
      .call(this);
  }
};

/**
 * Switch to the JAFTING Refinement scene from the hub list.
 */
Scene_Jafting.prototype.jaftingRefinementSelected = function()
{
  this.closeRootJaftingWindows();

  Scene_JaftingRefine.callScene();
};
//endregion Scene_Jafting