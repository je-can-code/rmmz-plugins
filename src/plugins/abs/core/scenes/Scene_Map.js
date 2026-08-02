//region Scene_Map
import JABS_AiManager from './../managers/JABS_AiManager.js';

/**
 * Extends {@link #onMapLoaded}.<br/>
 * Safety net for ensuring the player's battler is initialized with the map load.
 */
J.ABS.Aliased.Scene_Map.set('onMapLoaded', Scene_Map.prototype.onMapLoaded);
Scene_Map.prototype.onMapLoaded = function()
{
  // check if JABS is enabled.
  if ($jabsEngine.absEnabled)
  {
    // initialize player 1.
    $jabsEngine.initializePlayer1();
  }

  // perform original logic.
  J.ABS.Aliased.Scene_Map.get('onMapLoaded')
    .call(this);
};

//region update
/**
 * Extends {@link #update}.<br/>
 * Also updates JABS.
 */
J.ABS.Aliased.Scene_Map.set('update', Scene_Map.prototype.update);
Scene_Map.prototype.update = function()
{
  // perform original logic.
  J.ABS.Aliased.Scene_Map.get('update')
    .call(this);

  // update JABS.
  this.updateJabs();
};

/**
 * Performs update logic for the JABS engine.
 */
Scene_Map.prototype.updateJabs = function()
{
  // if the ABS is disabled, then don't update it.
  if (!$jabsEngine.absEnabled) return;

  // update the JABS engine!
  JABS_AiManager.update();

  // handle rotation.
  if ($jabsEngine.requestPartyRotation)
  {
    this.handlePartyRotation();
  }
};

/**
 * Handles the logic in the scene for a party rotation.
 */
Scene_Map.prototype.handlePartyRotation = function()
{
  // acknowledge the party rotation request.
  $jabsEngine.requestPartyRotation = false;

  // add a hook for logic on-rotation.
  this.onPartyRotate();
};

/**
 * A hook for performing action when there was a party rotation request.
 */
Scene_Map.prototype.onPartyRotate = function()
{
};
//endregion update

/**
 * Extends {@link #callMenu}.<br/>
 * Disables the ability to directly call the menu by pressing the given key.
 *
 * The key vanilla listens for here is the one JABS gives to the offhand attack, and swinging a weapon
 * should not open a menu. The menu has its own dedicated button, handled by
 * {@link JABS_InputAdapter.performMenuAction}.
 */
J.ABS.Aliased.Scene_Map.set('callMenu', Scene_Map.prototype.callMenu);
Scene_Map.prototype.callMenu = function()
{
  // while JABS is enabled, the call to the menu will always fail.
  if ($jabsEngine.absEnabled) return;

  // perform original logic.
  J.ABS.Aliased.Scene_Map.get('callMenu')
    .call(this);
};
//endregion Scene_Map
