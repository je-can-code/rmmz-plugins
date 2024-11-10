//region Window_SkillList
/**
 * Extends {@link #initialize}.<br/>
 * Includes our skill detail window.
 */
J.CMS_K.Aliased.Window_SkillList.initialize = Window_SkillList.prototype.initialize;
Window_SkillList.prototype.initialize = function(rect)
{
  J.CMS_K.Aliased.Window_SkillList.initialize.call(this, rect);

  /**
   * The detail window for the skill.
   *  @type {Window_SkillDetail}
   */
  this._skillDetailWindow = null;
};

/**
 * Sets the skill detail window to the provided window.
 * @param {Window_SkillDetail} newWindow The new window.
 */
Window_SkillList.prototype.setSkillDetailWindow = function(newWindow)
{
  this._skillDetailWindow = newWindow;
  this.refreshSkillDetailWindow();
};

/**
 * Refreshes the skill details window.
 */
Window_SkillList.prototype.refreshSkillDetailWindow = function()
{
  if (!this._skillDetailWindow) return;

  let id = 0;
  const item = this.item();
  if (item)
  {
    id = item.id;
  }
  this._skillDetailWindow.setActor(this._actor);
  this._skillDetailWindow.setSkillId(id);
};

/**
 * Extends `.select()` to also update our skill detail window if need-be.
 */
J.CMS_K.Aliased.Window_SkillList.select = Window_SkillList.prototype.select;
Window_SkillList.prototype.select = function(index)
{
  J.CMS_K.Aliased.Window_SkillList.select.call(this, index);
  this.refreshSkillDetailWindow();
};

/**
 * Overwrites {@link #maxCols}.<br/>
 * Forces a single column for skills in this window.
 * @returns {number}
 */
Window_SkillList.prototype.maxCols = function()
{
  return 1;
};

/**
 * Overwrites {@link #drawSkillCost}.<br/>
 * Does not draw costs of any kind.
 * @param {RPG_Skill} skill The skill to draw costs for.
 * @param {number} x The `x` coordinate.
 * @param {number} y The `y` coordinate.
 * @param {number} width The text width.
 */
Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width)
{
};

/**
 * Overwrites {@link #includes}.<br/>
 * Limits the skills displayed to those relevant to the actor's equipped weapon- if one exists.
 * @param {RPG_Skill} skill The skill to see if filtering is necessary.
 * @returns {boolean}
 */
Window_SkillList.prototype.includes = function(skill)
{
  // if there is no skill, then it shouldn't be included.
  if (!skill) return false;
  
  // check if the skill matches the selected type.
  const matchesSkillTypeId = skill.stypeId === this._stypeId;
  
  // if there is no actor, then we only factor in the skill itself.
  if (!this._actor) return matchesSkillTypeId;
  
  // check if the actor's equipped weapon matches the skill type.
  const matchesWeaponTypeId = this._actor.isSkillWtypeOk(skill);
  
  // return whether or not both skill and weapon types match.
  return (matchesSkillTypeId && matchesWeaponTypeId);
};
//endregion Window_SkillList