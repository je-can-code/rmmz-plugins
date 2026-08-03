//region Window_SkillList
/**
 * Gets the actor whose skills are listed.
 * @returns {Game_Actor} The actor.
 */
Window_SkillList.prototype.actor = function()
{
  // hand back the actor whose skills are listed.
  return this._actor;
};

/**
 * Gets the skill type currently being filtered to.
 * @returns {number} The stypeId.
 */
Window_SkillList.prototype.stypeId = function()
{
  // hand back the skill type currently being filtered to.
  return this._stypeId;
};
//endregion Window_SkillList
