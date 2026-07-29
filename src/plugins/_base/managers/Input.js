//region Input
/**
 * Gets the merged input state for the current frame.
 * @returns {Object<string, boolean>} The current state, keyed by input symbol.
 */
Input.currentState = function()
{
  // hand back the merged state for this frame.
  return this._currentState;
};

/**
 * Gets the per-gamepad button state snapshots, indexed by gamepad index.
 * @returns {Object<number, boolean[]>} The gamepad states.
 */
Input.gamepadStates = function()
{
  // hand back the per-pad state snapshots.
  return this._gamepadStates;
};
//endregion Input
