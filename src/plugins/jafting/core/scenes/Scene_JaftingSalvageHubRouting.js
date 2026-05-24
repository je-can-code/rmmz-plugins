//region Scene_JaftingSalvageHubRouting
import Scene_Jafting from './Scene_Jafting.js';
import Scene_JaftingSalvage from './Scene_JaftingSalvage.js';

/**
 * Routes the Salvage hub row before Creation / Refinement extensions chain their own keys.<br>
 * The alias map is created in core `_metadata/initialization.js` so this `.set` runs after that file loads.
 */
J.JAFTING.Aliased.Scene_Jafting.set('onRootJaftingSelection', Scene_Jafting.prototype.onRootJaftingSelection);
Scene_Jafting.prototype.onRootJaftingSelection = function()
{
  const currentSelection = this.getRootJaftingKey();

  if (currentSelection === Scene_JaftingSalvage.KEY)
  {
    this.jaftingSalvageSelected();
  }
  else
  {
    J.JAFTING.Aliased.Scene_Jafting.get('onRootJaftingSelection').call(this);
  }
};

/**
 * Leaves the hub chrome on the stack and pushes dismantle UI—mirrors {@link Scene_JaftingCreate.callScene} flow.
 */
Scene_Jafting.prototype.jaftingSalvageSelected = function()
{
  this.closeRootJaftingWindows();

  Scene_JaftingSalvage.callScene();
};
//endregion Scene_JaftingSalvageHubRouting