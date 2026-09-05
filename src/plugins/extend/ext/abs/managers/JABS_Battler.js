//region JABS_Battler
/**
 * Extends {@link #aiSkillFilter}.<br/>
 * Excludes skill-extension skills from the AI skill pool.
 */
J.EXTEND.EXT.ABS.Aliased.JABS_Battler.set('aiSkillFilter', JABS_Battler.prototype.aiSkillFilter);
JABS_Battler.prototype.aiSkillFilter = function(skill)
{
  // perform original logic.
  const isValid = J.EXTEND.EXT.ABS.Aliased.JABS_Battler.get('aiSkillFilter').call(this, skill);

  // if the original already rejected it, pass through the rejection.
  if (isValid === false) return false;

  // extension skills are not valid actions for the AI to choose- both the id-listing form and the
  // type-classifier form, since either one makes the skill a modifier rather than something castable.
  if (skill.isExtension === true) return false;

  // valid skill!
  return true;
};
//endregion JABS_Battler
