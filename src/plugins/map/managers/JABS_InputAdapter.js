//region JABS_InputAdapter
// only setup this shortcut key if we're using JABS.
if (J.ABS)
{
  /**
   * Toggles visibility of the minimap on the screen.
   * If J.TIME is used, the visibility will sync with the time window.
   */
  JABS_InputAdapter.performMinimapWindowAction = function()
  {
    // if we cannot toggle the time window, then do not.
    if (!this._canPerformMinimapWindowAction()) return;

    // check if we're using the TIME system.
    if (J.TIME)
    {
      // grab the current TIME window visibility.
      const currentTimeWindowVisibility = $gameTime.isMapWindowVisible();

      // if the visibility is the same, then do nothing.
      if ($gameSystem.isMinimapVisible() === currentTimeWindowVisibility) return;

      // otherwise, set the visibility to whatever the TIME window is now.
      $gameSystem.setMinimapVisibility(currentTimeWindowVisibility);
    }
    else
    {
      // just toggle the visibility.
      $gameSystem.toggleMinimapVisibility();
    }
  };

  /**
   * Determines whether or not the player can toggle the time window.
   * @returns {boolean}
   */
  JABS_InputAdapter._canPerformMinimapWindowAction = function()
  {
    // if the current map blocks the minimap, do not allow toggling at all.
    if ($gameMap.isMinimapBlocked())
    {
      return false;
    }

    return true;
  };

  /**
   * Starts the temporary minimap focus mode (centered, expanded scope).
   */
  JABS_InputAdapter.performMinimapFocusStart = function()
  {
    // if the current map blocks the minimap, do nothing.
    if ($gameMap.isMinimapBlocked()) return;

    // only active on the Map scene.
    if (!(SceneManager._scene instanceof Scene_Map)) return;

    const mini = SceneManager._scene.getMiniMap();
    if (!mini) return;

    // enter focus; sprite method guards repeated calls.
    mini.enterFocusMode();
  };

  /**
   * Ends the temporary minimap focus mode and restores prior size/position.
   */
  JABS_InputAdapter.performMinimapFocusEnd = function()
  {
    // only active on the Map scene.
    if (!(SceneManager._scene instanceof Scene_Map)) return;

    const mini = SceneManager._scene.getMiniMap();
    if (!mini) return;

    // exit focus; sprite method guards if not focused.
    mini.exitFocusMode();
  };
}
//endregion JABS_InputAdapter