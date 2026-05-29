//region Scene_Jafting
import Scene_JaftingCreate from './Scene_JaftingCreate.js';

/**
 * Extends {@link #onRootJaftingSelection}.<br/>
 * When Creation is chosen on the JAFTING hub, opens the Creation scene.
 */
J.JAFTING.EXT.CREATE.Aliased.Scene_Jafting
  .set('onRootJaftingSelection', Scene_Jafting.prototype.onRootJaftingSelection);
Scene_Jafting.prototype.onRootJaftingSelection = function()
{
  const currentSelection = this.getRootJaftingKey();

  if (currentSelection === Scene_JaftingCreate.KEY)
  {
    this.jaftingCreationSelected();
  }
  else
  {
    // possibly activate other choices.
    J.JAFTING.EXT.CREATE.Aliased.Scene_Jafting.get('onRootJaftingSelection')
      .call(this);
  }
};

/**
 * Switch to the JAFTING Creation scene from the hub list.
 */
Scene_Jafting.prototype.jaftingCreationSelected = function()
{
  this.closeRootJaftingWindows();

  Scene_JaftingCreate.callScene();
};
//endregion Scene_Jafting