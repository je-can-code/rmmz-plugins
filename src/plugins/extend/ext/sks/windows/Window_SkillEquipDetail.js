//region Window_SkillEquipDetail
J.EXTEND.EXT.SKS.Aliased.Window_SkillEquipDetail.set('skill', Window_SkillEquipDetail.prototype.skill);
/**
 * Extends {@link Window_SkillEquipDetail#skill} to return the overlayed skill
 * when an actor context is available, surfacing the full inherited skill chain.
 * @returns {RPG_Skill|null}
 */
Window_SkillEquipDetail.prototype.skill = function()
{
  // if we do not have a skill id, there is nothing to overlay.
  if (!this.skillId()) return null;

  // if we have actor context, resolve the overlayed skill instead of the base.
  if (this.actor()) return this.actor().skill(this.skillId());

  // perform original logic.
  return J.EXTEND.EXT.SKS.Aliased.Window_SkillEquipDetail.get('skill').call(this);
};

//region properties
/**
 * Gets the skill id.
 * @returns {*} The skillId.
 */
Window_SkillEquipDetail.prototype.skillId = function()
{
  // hand back the skill id.
  return this._skillId;
};

/**
 * Gets the actor whose equipped skill is being detailed.
 * @returns {Game_Actor} The detailed actor.
 */
Window_SkillEquipDetail.prototype.actor = function()
{
  // hand back the actor.
  return this._actor;
};
//endregion properties
//endregion Window_SkillEquipDetail
