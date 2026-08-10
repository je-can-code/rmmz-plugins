//region Input
/**
 * Extends the existing mapper to track additional inputs.
 */
Input.keyMapper = {
  // ... the rest of the input keys.
  ...Input.keyMapper,

  // F6, the volume toggle key.
  117: 'volumeToggle',
};

/**
 * Extends {@link #_updateGamepadState}.<br/>
 * Also logs only freshly pressed gamepad buttons/directions.
 */
J.UTILS.Aliased.Input.set("_updateGamepadState", Input._updateGamepadState);
Input._updateGamepadState = function(gamepad)
{
  // capture the last known button state array for this pad.
  const prev = this.gamepadStates()[gamepad.index] || [];

  // perform original logic.
  J.UTILS.Aliased.Input.get("_updateGamepadState").call(this, gamepad);

  // extract the updated button state array populated by the original logic. Unlike `prev` above,
  // this one always exists: the original unconditionally assigns the slot before returning.
  const next = this.gamepadStates()[gamepad.index];

  // log only fresh presses resolved through the centralized mapper.
  J.UTILS.GamepadLog.logFreshPresses(gamepad, prev, next);
};
//endregion Input