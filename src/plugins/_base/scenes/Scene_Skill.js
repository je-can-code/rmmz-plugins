//region Scene_Skill
/**
 * Gets the window describing the actor whose skills are shown.
 * @returns {Window_SkillStatus} The statusWindow.
 */
Scene_Skill.prototype.statusWindow = function()
{
  // hand back the window describing the actor whose skills are shown.
  return this._statusWindow;
};

/**
 * Gets the window listing the selectable skills.
 * @returns {Window_SkillList} The itemWindow.
 */
Scene_Skill.prototype.itemWindow = function()
{
  // hand back the window listing the selectable skills.
  return this._itemWindow;
};

/**
 * Gets the window listing the actor's skill types, which filters the skill list.
 * @returns {Window_SkillType} The skillTypeWindow.
 */
Scene_Skill.prototype.skillTypeWindow = function()
{
  // hand back the window listing the actor's skill types.
  return this._skillTypeWindow;
};
//endregion Scene_Skill
