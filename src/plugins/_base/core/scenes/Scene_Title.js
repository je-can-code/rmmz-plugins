//region Scene_Title
/**
 * Gets the window listing the title screen's commands.
 * @returns {Window_TitleCommand} The commandWindow.
 */
Scene_Title.prototype.commandWindow = function()
{
  // hand back the window listing the title screen's commands.
  return this._commandWindow;
};

/**
 * Sets the window listing the title screen's commands.
 * @param {Window_TitleCommand} newCommandWindow The new commandWindow.
 */
Scene_Title.prototype.setCommandWindow = function(newCommandWindow)
{
  // assign the window listing the title screen's commands.
  this._commandWindow = newCommandWindow;
};
//endregion Scene_Title