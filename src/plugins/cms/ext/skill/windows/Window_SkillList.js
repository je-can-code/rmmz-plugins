//region Window_SkillList
/**
 * Extends {@link #initialize}.<br/>
 * Includes our skill detail window.
 */
J.CMS_K.Aliased.Window_SkillList.set('initialize', Window_SkillList.prototype.initialize);
Window_SkillList.prototype.initialize = function(rect)
{
  // perform original logic.
  J.CMS_K.Aliased.Window_SkillList.get('initialize').call(this, rect);

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
  if (!this.skillDetailWindow()) return;

  let id = 0;
  const item = this.item();
  if (item)
  {
    ({ id } = item);
  }
  this.skillDetailWindow().setActor(this.actor());
  this.skillDetailWindow().setSkillId(id);
};

/**
 * Extends `.select()` to also update our skill detail window if need-be.
 */
J.CMS_K.Aliased.Window_SkillList.set('select', Window_SkillList.prototype.select);
Window_SkillList.prototype.select = function(index)
{
  // perform original logic.
  J.CMS_K.Aliased.Window_SkillList.get('select').call(this, index);
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
// eslint-disable-next-line no-unused-vars
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
  const matchesSkillTypeId = skill.stypeId === this.stypeId();

  // if there is no actor, then we only factor in the skill itself.
  if (!this.actor()) return matchesSkillTypeId;

  // check if the actor's equipped weapon matches the skill type.
  const matchesWeaponTypeId = this.actor().isSkillWtypeOk(skill);

  // return whether or not both skill and weapon types match.
  return (matchesSkillTypeId && matchesWeaponTypeId);
};

//region properties
/**
 * Gets the skill detail window.
 * @returns {*} The skillDetailWindow.
 */
Window_SkillList.prototype.skillDetailWindow = function()
{
  // hand back the skill detail window.
  return this._skillDetailWindow;
};
//endregion properties
//endregion Window_SkillList