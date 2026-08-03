//region Input
import InputDeviceTracker from './InputDeviceTracker.js';

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

/**
 * The deflection an analog axis must exceed before it counts as deliberate input.
 *
 * Matches the threshold the engine itself uses when it synthesizes D-pad presses from stick axes, so
 * that a stick claiming the device and a stick moving the cursor agree on what "pushed" means.
 * @returns {number}
 */
Input.gamepadAxisThreshold = function()
{
  return 0.5;
};

/**
 * Determines whether the player is currently holding anything on the given gamepad.
 *
 * Asked every frame while a pad is connected, so it answers "is something pressed right now" rather
 * than "did something just change". That distinction matters: the engine's own state loop fires on
 * releases too, and a release is not a reason to decide the player switched devices.
 * @param {Gamepad} gamepad The gamepad to inspect.
 * @returns {boolean}
 */
Input.isGamepadActive = function(gamepad)
{
  // any held button is the clearest possible signal.
  const buttonHeld = gamepad.buttons.some(button => button.pressed === true);
  if (buttonHeld === true) return true;

  // a stick pushed far enough that the engine would read it as a direction counts equally; a pad whose
  // sticks drift past this while untouched is reporting a hardware fault, not a preference.
  const threshold = this.gamepadAxisThreshold();

  return gamepad.axes.some(axis => Math.abs(axis) > threshold);
};

/**
 * Determines whether a key is one the game actually binds to something.
 *
 * The browser reports every key the player touches, the overwhelming majority of which the game has no
 * use for. Treating those as evidence about the player's chosen device would mean an errant screenshot
 * hotkey or a cat on the keyboard silently rewrites a controller player's legend, so only keys the game
 * would genuinely act on get a say.
 * @param {number} keyCode The key code reported by the browser.
 * @returns {boolean}
 */
Input.isMappedKeyCode = function(keyCode)
{
  // the engine's own mapper is the authority on which keys mean anything.
  const buttonName = this.keyMapper[keyCode];

  return buttonName !== undefined;
};

/**
 * Extends {@link Input._onKeyDown}.<br/>
 * Also records that the player is currently using a keyboard.
 *
 * This is one of only two places in the engine where a device writes into the merged input state, which
 * is why aliasing it is exhaustive rather than a heuristic.
 */
J.BASE.Aliased.Input.set('_onKeyDown', Input._onKeyDown);
Input._onKeyDown = function(event)
{
  // a bound key can only have come from a keyboard; an unbound one says nothing about the player.
  if (this.isMappedKeyCode(event.keyCode) === true)
  {
    InputDeviceTracker.markKeyboard();
  }

  // perform original logic.
  J.BASE.Aliased.Input.get('_onKeyDown')
    .call(this, event);
};

/**
 * Extends {@link Input._updateGamepadState}.<br/>
 * Also records that the player is currently using a gamepad.
 *
 * The other of the two device-specific writers into the merged input state. Unlike the keyboard's, this
 * one runs every frame for every connected pad whether or not the player touched it, so presence and
 * use have to be reported separately.
 * @param {Gamepad} gamepad The gamepad whose state is being read.
 */
J.BASE.Aliased.Input.set('_updateGamepadState', Input._updateGamepadState);
Input._updateGamepadState = function(gamepad)
{
  // perform original logic.
  J.BASE.Aliased.Input.get('_updateGamepadState')
    .call(this, gamepad);

  // being merely plugged in is enough to answer for a player who has not pressed anything yet.
  InputDeviceTracker.noteGamepadPresent();

  // holding something is what actually claims the device.
  if (this.isGamepadActive(gamepad) === false) return;

  InputDeviceTracker.markGamepad();
};
//endregion Input
