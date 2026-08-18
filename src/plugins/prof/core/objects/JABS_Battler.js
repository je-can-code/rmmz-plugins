//region JABS_Battler
/**
 * Extends {@link JABS_Battler.onDodge}.<br/>
 * Also gains proficiency for the dodge skill that was executed.
 *
 * Dodging cannot earn proficiency through the ordinary path the way an attack does. That path hangs off
 * {@link Game_Action.apply} and requires the target to have been hit, but a dodge skill targets the user
 * with no damage and no effects- so RMMZ's own `testApply` answers false, the result is never marked
 * used, and there is nothing for the proficiency check to see. Crediting it here is the only way a
 * dodge counts for anything.
 */
if (J.ABS)
{
  J.PROF.Aliased.JABS_Battler.set('onDodge', JABS_Battler.prototype.onDodge);
  JABS_Battler.prototype.onDodge = function(skill)
  {
    // perform original logic.
    J.PROF.Aliased.JABS_Battler.get('onDodge')
      .call(this, skill);

    // gain some proficiency from dodging.
    this.gainProficiencyFromDodging(skill);
  };

  /**
   * Gains proficiency when dodging.
   * @param {RPG_Skill} skill The dodge skill that was executed.
   */
  JABS_Battler.prototype.gainProficiencyFromDodging = function(skill)
  {
    // don't gain proficiency if we cannot.
    if (!this.canGainProficiencyFromDodging(skill)) return;

    const battler = this.getBattler();

    // the same amount an attack would earn, so a bonus to proficiency gain reaches defense too.
    const amount = battler.skillProficiencyAmount();

    battler.increaseSkillProficiency(skill.id, amount);
  };

  /**
   * Determines whether this battler can gain proficiency for the dodge skill.
   * @param {RPG_Skill} skill The dodge skill that was executed.
   * @returns {boolean} True if we can gain proficiency, false otherwise.
   */
  JABS_Battler.prototype.canGainProficiencyFromDodging = function(skill)
  {
    // a dodge that resolved to no skill has nothing to practise.
    if (!skill) return false;

    // if the battler is blocked from gaining proficiency don't gain proficiency.
    const canGainProficiency = this.getBattler()
      .canGainProficiency();
    if (!canGainProficiency) return false;

    // gain proficiency!
    return true;
  };
}
//endregion JABS_Battler