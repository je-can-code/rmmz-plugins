//region JABS_InputAdapter
// only setup this shortcut key if we're using JABS.
if (J.ABS)
{
  /**
   * Calls the questopedia directly on the map.
   */
  JABS_InputAdapter.performTimeWindowAction = function()
  {
    // if we cannot toggle the time window, then do not.
    if (!this._canPerformTimeWindowAction()) return;

    // call up the menu.
    $gameTime.toggleMapWindow();
  };

  /**
   * Determines whether or not the player can toggle the time window.
   * @returns {boolean}
   * @private
   */
  JABS_InputAdapter._canPerformTimeWindowAction = function()
  {
    // TODO: check if the time window can be toggled.
    return true;
  };
}
//endregion JABS_InputAdapter