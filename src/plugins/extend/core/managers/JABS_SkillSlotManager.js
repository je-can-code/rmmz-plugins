//region JABS_SkillSlotManager
J.EXTEND.Aliased.JABS_SkillSlotManager.set('filterActionSkills', JABS_SkillSlotManager.prototype.filterActionSkills);
/**
 * Extends {@link #filterActionSkills}.<br/>
 * Also filters out skill extensions.
 * @param {Game_Enemy} enemy The enemy to check.
 * @param {RPG_EnemyAction} action The action to check.
 */
JABS_SkillSlotManager.prototype.filterActionSkills = function(enemy, action)
{
  // perform original logic.
  const originalLogic = J.EXTEND.Aliased.JABS_SkillSlotManager.get('filterActionSkills')
    .call(this, enemy, action);

  // if the original logic returns false, then don't continue.
  if (originalLogic === false) return false;

  // grab the skill from the database.
  const skill = enemy.skill(action.skillId);

  // filter out the extend skills.
  return skill.isExtension === false;
};
//endregion JABS_SkillSlotManager