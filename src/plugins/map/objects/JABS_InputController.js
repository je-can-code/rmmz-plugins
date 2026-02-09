//region JABS_InputController
if (J.ABS)
{
  /**
   * Extends {@link #update}.<br/>
   * Also handles input detection for the the minimap window toggle shortcut key.
   */
  J.MAP.Aliased.JABS_InputController.set('update', JABS_InputController.prototype.update);
  JABS_InputController.prototype.update = function()
  {
    // perform original logic.
    J.MAP.Aliased.JABS_InputController.get('update')
      .call(this);

    // update input for the time window toggle shortcut key.
    this.updateMiniMapWindowAction();

    // update input for the hold-to-peek focus (MobilitySkill).
    this.updateMinimapFocusPeekAction();
  };

  /**
   * Monitors and takes action based on player input regarding the minimap window toggle shortcut key.
   */
  JABS_InputController.prototype.updateMiniMapWindowAction = function()
  {
    // check if the action's input requirements have been met.
    if (this.isMiniMapWindowActionTriggered())
    {
      // execute the action.
      this.performMiniMapWindowAction();
    }
  };

  /**
   * Checks the inputs of the minimap window action.
   * @returns {boolean}
   */
  JABS_InputController.prototype.isMiniMapWindowActionTriggered = function()
  {
    // this action requires the left stick button to be triggered.
    if (Input.isTriggered(J.ABS.Input.L3))
    {
      return true;
    }

    // input was not triggered.
    return false;
  }

  /**
   * Executes the time window toggle action.
   */
  JABS_InputController.prototype.performMiniMapWindowAction = function()
  {
    JABS_InputAdapter.performMinimapWindowAction();
  }

  /**
   * Handles press-and-hold on the MobilitySkill input to show a centered, expanded minimap.
   * On press: enter focus mode; on release: exit focus mode.
   */
  JABS_InputController.prototype.updateMinimapFocusPeekAction = function()
  {
    // do not allow if the current map blocks the minimap entirely.
    if ($gameMap.isMinimapBlocked()) return;

    // track prior pressed state (init lazily on first use).
    this._mmFocusPressedPrev ??= false;

    // edge: pressed this frame → start focus.
    if (this.isMinimapFocusPeekActionHeld())
    {
      this.performMinimapFocusStart();
    }

    // edge: released this frame → end focus.
    if (this.isMinimapFocusPeekActionLifted())
    {
      this.performMinimapFocusEnd();
    }

    // persist press state for R2 / MobilitySkill.
    this._mmFocusPressedPrev = Input.isPressed(J.ABS.Input.MobilitySkill);
  };

  JABS_InputController.prototype.isMinimapFocusPeekActionHeld = function()
  {
    if (Input.isPressed(J.ABS.Input.MobilitySkill) && !this._mmFocusPressedPrev)
    {
      return true;
    }

    return false;
  };

  JABS_InputController.prototype.isMinimapFocusPeekActionLifted = function()
  {
    if (!Input.isPressed(J.ABS.Input.MobilitySkill) && this._mmFocusPressedPrev)
    {
      return true;
    }

    return false;
  };

  /**
   * Begins the minimap focus mode.
   */
  JABS_InputController.prototype.performMinimapFocusStart = function()
  {
    JABS_InputAdapter.performMinimapFocusStart();
  };

  /**
   * Ends the minimap focus mode.
   */
  JABS_InputController.prototype.performMinimapFocusEnd = function()
  {
    JABS_InputAdapter.performMinimapFocusEnd();
  };
}
//endregion JABS_InputController