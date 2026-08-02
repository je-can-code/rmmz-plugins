//region InputDevice
/**
 * The kinds of input device the player can be holding.
 *
 * This exists so that anything drawing a button glyph can ask one question- "what is the player
 * actually using right now?"- and get an answer that is a fixed vocabulary rather than a guess. A
 * legend telling a controller player to press `Z` is worse than no legend at all, because it is
 * confidently wrong.
 *
 * There are deliberately only two members. The glyph sheet this vocabulary serves carries one gamepad
 * style and one keyboard style, so a third member would name something that cannot be drawn. Should
 * further styles ever be illustrated, this is the enum that grows.
 */
class InputDevice
{
  /**
   * The player is on a keyboard.
   *
   * This is the default, because a keyboard is the one input device a computer running the game is
   * guaranteed to have.
   * @type {string}
   */
  static Keyboard = 'keyboard';

  /**
   * The player is on a gamepad.
   * @type {string}
   */
  static Gamepad = 'gamepad';

  /**
   * Gets every valid device.
   * @returns {string[]}
   */
  static devices()
  {
    return [ this.Keyboard, this.Gamepad ];
  }

  /**
   * Determines whether the given value names a real device.
   * @param {string} device The value to validate.
   * @returns {boolean}
   */
  static isValid(device)
  {
    return this.devices()
      .includes(device);
  }
}

export default InputDevice;
//endregion InputDevice
