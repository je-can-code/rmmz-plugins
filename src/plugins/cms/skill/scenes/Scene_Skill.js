//region Scene_Skill
import Window_SkillDetail from '../windows/Window_SkillDetail.js';

/**
 * Extends {@link Scene_Skill.initialize}.<br/>
 * Tracks whether the skill detail pane is visible.
 */
J.CMS_K.Aliased.Scene_Skill.set('initialize', Scene_Skill.prototype.initialize);
Scene_Skill.prototype.initialize = function()
{
  // perform original logic.
  J.CMS_K.Aliased.Scene_Skill.get('initialize').call(this);
  this._j = this._j || {};
  this._j.moreVisible = false;
};

/**
 * Extends {@link Scene_Skill.create}.<br/>
 * Builds the skill detail window after vanilla skill scene windows.
 */
J.CMS_K.Aliased.Scene_Skill.set('create', Scene_Skill.prototype.create);
Scene_Skill.prototype.create = function()
{
  // perform original logic.
  J.CMS_K.Aliased.Scene_Skill.get('create').call(this);
  this.createSkillDetailWindow();
};

/**
 * The rectangle for the skill-type picker column.<br/>
 * Flips horizontal anchor when right-side input mode is active.
 * @returns {Rectangle}
 */
Scene_Skill.prototype.skillTypeWindowRect = function()
{
  const ww = this.mainCommandWidth();
  const wh = this.calcWindowHeight(4, true);
  const wx = this.isRightInputMode()
    // policy step inside skill type window rect.
    ? Graphics.boxWidth - ww
    : 0;
  const wy = this.mainAreaTop();
  // hand back new Rectangle(wx, wy, ww, wh) to the caller.
  return new Rectangle(wx, wy, ww, wh);
};

/**
 * Creates and wires the skill detail pane beside the item list.
 */
Scene_Skill.prototype.createSkillDetailWindow = function()
{
  const rect = this.skillDetailRect();
  this._skillDetailWindow = new Window_SkillDetail(rect);
  this._itemWindow.setSkillDetailWindow(this._skillDetailWindow);
  // policy step inside create skill detail window.
  this.addWindow(this._skillDetailWindow);
};

/**
 * The rectangle for the skill detail pane below the status strip.
 * @returns {Rectangle}
 */
Scene_Skill.prototype.skillDetailRect = function()
{
  const ww = Graphics.boxWidth - this.mainCommandWidth();
  const wh = this.mainAreaHeight() - this._statusWindow.height
  const wx = this.isRightInputMode()
    // policy step inside skill detail rect.
    ? 0
    : Graphics.boxWidth - ww;
  const wy = this.mainAreaTop() + this._statusWindow.height;
  // hand back new Rectangle(wx, wy, ww, wh) to the caller.
  return new Rectangle(wx, wy, ww, wh);
};

Scene_Skill.prototype.mainCommandWidth = () => 400;

/**
 * Overwrites {@link #createButtons}.<br/>
 * Removes the buttons because fuck the buttons.
 */
Scene_Skill.prototype.createButtons = function()
{
};

/**
 * Overwrites {@link #buttonAreaHeight}.<br/>
 * Replaces the button area height with 0 because fuck buttons.
 * @returns {number}
 */
Scene_Skill.prototype.buttonAreaHeight = () => 0;

Scene_Skill.prototype.itemWindowRect = function()
{
  const ww = this.mainCommandWidth();
  const wh = this.mainAreaHeight() - this._statusWindow.height;
  const wx = this.isRightInputMode()
    // policy step inside item window rect.
    ? Graphics.boxWidth - ww
    : 0;
  const wy = this._statusWindow.y + this._statusWindow.height;
  // hand back new Rectangle(wx, wy, ww, wh) to the caller.
  return new Rectangle(wx, wy, ww, wh);
};
//endregion Scene_Skill