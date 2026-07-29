//region Scene_Menu
/**
 * Gets the window listing the top-level menu commands.
 * @returns {Window_MenuCommand} The commandWindow.
 */
Scene_Menu.prototype.commandWindow = function()
{
  // hand back the window listing the top-level menu commands.
  return this._commandWindow;
};

/**
 * Sets the window listing the top-level menu commands.
 * @param {Window_MenuCommand} newCommandWindow The new commandWindow.
 */
Scene_Menu.prototype.setCommandWindow = function(newCommandWindow)
{
  // assign the window listing the top-level menu commands.
  this._commandWindow = newCommandWindow;
};
//endregion Scene_Menu
