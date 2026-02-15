//region JABS_InputController
if (J.ABS)
{
  /**
   * Extends {@link #update}.<br/>
   * Also handles input detection for the the minimap window toggle shortcut key.
   */
  J.MAP.Aliased.JABS_StandardController.set('update', JABS_StandardController.prototype.update);
  JABS_StandardController.prototype.update = function()
  {
    // perform original logic.
    J.MAP.Aliased.JABS_StandardController.get('update')
      .call(this);

    // update input for the time window toggle shortcut key.
    this.updateMiniMapWindowAction();

    // update input for the hold-to-peek focus (MobilitySkill).
    this.updateMinimapFocusPeekAction();
  };

  /**
   * Monitors and takes action based on player input regarding the minimap window toggle shortcut key.
   */
  JABS_StandardController.prototype.updateMiniMapWindowAction = function()
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
  JABS_StandardController.prototype.isMiniMapWindowActionTriggered = function()
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
  JABS_StandardController.prototype.performMiniMapWindowAction = function()
  {
    JABS_InputAdapter.performMinimapWindowAction();
  }

  /**
   * Handles press-and-hold on the MobilitySkill input to show a centered, expanded minimap.
   * On press: enter focus mode; on release: exit focus mode.
   */
  JABS_StandardController.prototype.updateMinimapFocusPeekAction = function()
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

  JABS_StandardController.prototype.isMinimapFocusPeekActionHeld = function()
  {
    if (Input.isPressed(J.ABS.Input.MobilitySkill) && !this._mmFocusPressedPrev)
    {
      return true;
    }

    return false;
  };

  JABS_StandardController.prototype.isMinimapFocusPeekActionLifted = function()
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
  JABS_StandardController.prototype.performMinimapFocusStart = function()
  {
    JABS_InputAdapter.performMinimapFocusStart();
  };

  /**
   * Ends the minimap focus mode.
   */
  JABS_StandardController.prototype.performMinimapFocusEnd = function()
  {
    JABS_InputAdapter.performMinimapFocusEnd();
  };
}
//endregion JABS_InputController