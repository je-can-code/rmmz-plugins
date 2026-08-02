//region InputDeviceTracker
import InputDevice from './../models/InputDevice.js';

/**
 * Tracks which kind of device the player most recently gave input with.
 *
 * The engine offers no way to ask this. {@link Input._currentState} is keyed by button name and both
 * the keyboard handler and the gamepad poller write into that same map, so by the time any state is
 * observable the device that produced it is gone. {@link Input._latestButton} records *what* was
 * pressed, never *by what*.
 *
 * The answer therefore has to be captured at the moment of the write, which is what the aliases in
 * `managers/Input.js` do. This tracker is only the place the answer is kept, deliberately separated
 * from the capturing so that consumers depend on a question rather than on a mechanism- if this is
 * ever replaced by an explicit player-facing setting, {@link #currentDevice} is the single method that
 * changes and nothing that draws a glyph has to know.
 */
class InputDeviceTracker
{
  /**
   * The device the player most recently used.
   * @type {string} One of {@link InputDevice}.
   */
  static #currentDevice = InputDevice.Keyboard;

  /**
   * Whether the player has actually given input with anything yet.
   *
   * Kept apart from the device itself to solve the opening moments of a session: a player who booted
   * the game with a controller already plugged in has not pressed anything, so nothing has claimed the
   * device, and defaulting blindly to keyboard would greet exactly the wrong audience with keyboard
   * glyphs. Until a real press arrives, the mere presence of a pad is allowed to decide. After one, the
   * player's own input outranks presence forever.
   * @type {boolean}
   */
  static #claimed = false;

  /**
   * Gets the device the player is currently using.
   * @returns {string} One of {@link InputDevice}.
   */
  static currentDevice()
  {
    return this.#currentDevice;
  }

  /**
   * Gets whether the player is currently using a gamepad.
   * @returns {boolean}
   */
  static isGamepad()
  {
    return this.#currentDevice === InputDevice.Gamepad;
  }

  /**
   * Gets whether the player is currently using a keyboard.
   * @returns {boolean}
   */
  static isKeyboard()
  {
    return this.#currentDevice === InputDevice.Keyboard;
  }

  /**
   * Records that the player just gave input with the keyboard.
   */
  static markKeyboard()
  {
    // the player has now spoken for themselves; presence no longer gets a vote.
    this.#claimed = true;

    this.#currentDevice = InputDevice.Keyboard;
  }

  /**
   * Records that the player just gave input with a gamepad.
   */
  static markGamepad()
  {
    // the player has now spoken for themselves; presence no longer gets a vote.
    this.#claimed = true;

    this.#currentDevice = InputDevice.Gamepad;
  }

  /**
   * Records that a gamepad is connected, without claiming that the player used it.
   *
   * A pad sitting connected and idle is weak evidence, so it only counts while there is no stronger
   * evidence available. This is what makes the first glyphs a controller player ever sees correct,
   * rather than correct only after they have pressed something.
   */
  static noteGamepadPresent()
  {
    // a real press from either device has already settled the question.
    if (this.#claimed === true) return;

    this.#currentDevice = InputDevice.Gamepad;
  }

  /**
   * Restores this tracker to its initial state.
   *
   * Deliberately not wired to {@link Input.clear}, which the engine calls on window blur- alt-tabbing
   * out of the game is not the player changing controllers, and treating it as such would make the
   * legend rewrite itself every time focus moved.
   */
  static reset()
  {
    this.#currentDevice = InputDevice.Keyboard;
    this.#claimed = false;
  }
}

export default InputDeviceTracker;
//endregion InputDeviceTracker
