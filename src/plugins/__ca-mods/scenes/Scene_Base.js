//region Scene_Base
/**
 * Overrides {@link #buttonAreaHeight}.<br>
 * Sets the button height to 0- they are not used in CA.
 * @returns {number}
 */
Scene_Base.prototype.buttonAreaHeight = function()
{
  return 0;
};

/**
 * Overrides {@link #createButtons}.<br>
 * Removes logic for button creation- they are not used in CA.
 */
Scene_Base.prototype.createButtons = function()
{
};
//endregion Scene_Base