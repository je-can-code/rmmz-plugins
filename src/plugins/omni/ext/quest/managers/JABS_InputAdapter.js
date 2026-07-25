//region JABS_InputAdapter
import Scene_Questopedia from '../scenes/Scene_Questopedia.js';

// only setup this shortcut key if we're using JABS.
if (J.ABS)
{
  /**
   * Calls the questopedia directly on the map.
   */
  JABS_InputAdapter.performQuestopediaAction = function()
  {
    // if we cannot call the questopedia, then do not.
    if (!this._canPerformQuestopediaAction()) return;

    // call up the menu.
    Scene_Questopedia.callScene();
  };

  /**
   * Determines whether or not the player can pull up the questopedia menu.
   * @returns {boolean}
   * @private
   */
  JABS_InputAdapter._canPerformQuestopediaAction = function()
  {
    // only allow while on the map scene.
    if (!SceneManager._scene.isMapScene())
    {
      return false;
    }

    // block while messages are active to avoid input conflicts.
    if ($gameMessage.isBusy())
    {
      return false;
    }

    // block during transfers to avoid scene-change collisions.
    if ($gamePlayer.isTransferring())
    {
      return false;
    }

    // allow otherwise.
    return true;
  };
}
//endregion JABS_InputAdapter