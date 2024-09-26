//region JABS_InputAdapter
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
    // TODO: check if questopedia is accessible.
    return true;
  };
}
//endregion JABS_InputAdapter