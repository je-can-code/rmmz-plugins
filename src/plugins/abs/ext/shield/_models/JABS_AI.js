//region JABS_AI
/**
 * Extends {@link JABS_AI.filterForExecutorSkills}.<br/>
 * An executor facing a shield reaches for what breaks it first. While its target carries an unbroken shield and at
 * least one of its skills bypasses shields or deals bonus damage to them, it chooses among those alone, the most
 * effective of them first; otherwise it chooses as it always has.
 * @param {number[]} skillsToUse The available skills to use.
 * @param {JABS_Battler} user The battler deciding the action.
 * @param {JABS_Battler} target The battler being targeted.
 * @returns {number[]}
 */
J.ABS.EXT.SHIELD.Aliased.JABS_AI.set('filterForExecutorSkills', JABS_AI.prototype.filterForExecutorSkills);
JABS_AI.prototype.filterForExecutorSkills = function(skillsToUse, user, target)
{
  // the shield-breakers among the skills, when the target has a shield up to break.
  const breakers = this.findShieldBreakers(skillsToUse, user, target);

  // narrow to the breakers when there are any, and judge effectiveness among what remains.
  const candidates = breakers.length > 0
    ? breakers
    : skillsToUse;

  // perform original logic.
  return J.ABS.EXT.SHIELD.Aliased.JABS_AI.get('filterForExecutorSkills')
    .call(this, candidates, user, target);
};

/**
 * The skills that would break the target's shield: those bypassing shields or dealing bonus damage to them. None
 * while the target has no unbroken shield up.
 * @param {number[]} skillsToUse The available skills to use.
 * @param {JABS_Battler} user The battler deciding the action.
 * @param {JABS_Battler} target The battler being targeted.
 * @returns {number[]}
 */
JABS_AI.prototype.findShieldBreakers = function(skillsToUse, user, target)
{
  // a target with no shield up gives a breaker no edge.
  const shieldStates = target.getBattler()
    .getShieldStates();
  if (shieldStates.length === 0) return [];

  return skillsToUse.filter(skillId =>
  {
    const skill = user.getSkill(skillId);

    // a bypass of any kind reaches past the shield.
    if (skill.hasShieldBypass) return true;

    // bonus shield damage bites into it.
    return skill.shieldBonusFormulas.length > 0;
  });
};
//endregion JABS_AI