//region JABS_InputController
if (J.ABS)
{
  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes the minimap controller-local state without lazy init.
   */
  J.MAP.Aliased.JABS_StandardController.set('initMembers', JABS_StandardController.prototype.initMembers);
  JABS_StandardController.prototype.initMembers = function()
  {
    // perform original logic.
    const original = J.MAP.Aliased.JABS_StandardController.get('initMembers')
      .call(this);

    // initialize the previously-lazy field for minimap focus tracking.
    this._minimapFocusPressedPrev = false;

    // return whatever the original returned, if anything.
    return original;
  };

  /**
   * Gets whether or not the expand-minimap action was pressed in the prior frame.
   * @returns {boolean}
   */
  JABS_StandardController.prototype.getMinimapFocusPressedPrev = function()
  {
    // return the prior pressed state.
    return this.minimapFocusPressedPrev() === true;
  };

  /**
   * Sets whether or not the expand-minimap action was pressed in the prior frame.
   * @param {boolean} v The new pressed state.
   */
  JABS_StandardController.prototype.setMinimapFocusPressedPrev = function(v)
  {
    // set the prior pressed state.
    this._minimapFocusPressedPrev = v === true;
  };

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
    // this action requires the registered minimap toggle to be triggered (edge).
    if (Input.isActionTriggered('J.MAP', 'minimap-toggle'))
    {
      return true;
    }

    // input was not triggered.
    return false;
  };

  /**
   * Executes the time window toggle action.
   */
  JABS_StandardController.prototype.performMiniMapWindowAction = function()
  {
    JABS_InputAdapter.performMinimapWindowAction();
  };

  /**
   * Handles press-and-hold on the MobilitySkill input to show a centered, expanded minimap.
   * On press: enter focus mode; on release: exit focus mode.
   */
  JABS_StandardController.prototype.updateMinimapFocusPeekAction = function()
  {
    // do not allow if the current map blocks the minimap entirely.
    if ($gameMap.isMinimapBlocked()) return;

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

    // persist press state for the registered expand-minimap action.
    this.setMinimapFocusPressedPrev(Input.isActionPressed('J.MAP', 'expand-minimap'));
  };

  JABS_StandardController.prototype.isMinimapFocusPeekActionHeld = function()
  {
    // edge: newly pressed this frame.
    if (Input.isActionPressed('J.MAP', 'expand-minimap') && this.getMinimapFocusPressedPrev() === false)
    {
      return true;
    }

    // not newly pressed.
    return false;
  };

  JABS_StandardController.prototype.isMinimapFocusPeekActionLifted = function()
  {
    // edge: just released this frame.
    if (Input.isActionPressed('J.MAP', 'expand-minimap') === false && this.getMinimapFocusPressedPrev() === true)
    {
      return true;
    }

    // not released this frame.
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

//region properties
/**
 * Gets the minimap focus pressed prev.
 * @returns {*} The minimapFocusPressedPrev.
 */
JABS_StandardController.prototype.minimapFocusPressedPrev = function()
{
  // hand back the minimap focus pressed prev.
  return this._minimapFocusPressedPrev;
};
//endregion properties
//endregion JABS_InputController