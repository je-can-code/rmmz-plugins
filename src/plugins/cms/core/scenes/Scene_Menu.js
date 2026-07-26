/**
 * The rectangle for the command window.<br/>
 * Flips horizontal anchor when right-side input mode is active.
 * @returns {Rectangle}
 */
Scene_Menu.prototype.commandWindowRect = function()
{
  const ww = this.mainCommandWidth();
  const wh = this.mainAreaHeight() - this.goldWindowRect().height;
  const wx = this.isRightInputMode()
    ? Graphics.boxWidth - ww
    : 0;
  const wy = this.mainAreaTop();
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * The rectangle for the status window.<br/>
 * Fills the remaining width beside the command column.
 * @returns {Rectangle}
 */
Scene_Menu.prototype.statusWindowRect = function()
{
  const ww = Graphics.boxWidth - this.mainCommandWidth();
  const wh = this.mainAreaHeight();
  const wx = this.isRightInputMode()
    ? 0
    : Graphics.boxWidth - ww;
  const wy = this.mainAreaTop();
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * CMS menu keeps commands on the left — never mirror for right-side input.
 * @returns {boolean}
 */
Scene_Menu.prototype.isRightInputMode = function()
{
  return false;
};

/**
 * CMS menu keeps help at the top — not the bottom strip layout.
 * @returns {boolean}
 */
Scene_Menu.prototype.isBottomHelpMode = function()
{
  return false;
};

/**
 * CMS menu uses bottom button hints instead of top-of-screen buttons.
 * @returns {boolean}
 */
Scene_Menu.prototype.isBottomButtonMode = function()
{
  return true;
};