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
  if (!this._skillId) return null;

  // if we have actor context, resolve the overlayed skill instead of the base.
  if (this._actor)
  {
    // return the full overlayed skill for this actor and skill id.
    return OverlayManager.getExtendedSkill(this._actor, this._skillId);
  }

  // perform original logic.
  return J.EXTEND.EXT.SKS.Aliased.Window_SkillEquipDetail.get('skill').call(this);
};
//endregion Window_SkillEquipDetail
