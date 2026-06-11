//region JABS_OnChanceEffect
/**
 * A class defining the structure of an on-death skill, either for ally or enemy.
 */
class JABS_OnChanceEffect
{
  /**
   * The skill id associated with this on-chance effect.
   * @type {number}
   */
  skillId = 0;

  /**
   * The percent chance of success as an integer between 0-99.
   * @type {number}
   */
  chance = 0;

  /**
   * The key that this on-chance effect was derived from.
   * @type {string}
   */
  key = String.empty;

  /**
   * The hit type filter for this on-chance effect.
   * When null the effect fires regardless of hit type.
   * When set to a value from {@link Game_Action.HIT_TYPE}, only matching hit types trigger it.
   * @type {number|null}
   */
  hitType = null;

  /**
   * Constructor.
   * @param {number} skillId The id of the skill associated with this on-chance effect.
   * @param {number} chance A number between 1-100 representing the percent chance of success.
   * @param {string} key The key associated with this on-chance effect.
   * @param {number|null} hitType Optional hit type filter; null means any hit type.
   */
  constructor(skillId, chance, key, hitType = null)
  {
    this.skillId = skillId;
    this.chance = chance;
    this.key = key;
    this.hitType = hitType;
  }

  /**
   * Checks whether this effect should fire given the hit type of the incoming action.
   * If no hit type filter is set, always returns true.
   * @param {number} incomingHitType The hit type of the action that struck the bearer.
   * @returns {boolean}
   */
  matchesHitType(incomingHitType)
  {
    // no filter — fires on any hit type.
    if (this.hitType === null) return true;

    // only fire when the hit type matches.
    return this.hitType === incomingHitType;
  }

  /**
   * Gets the underlying skill for this on-chance effect.
   * If a battler is provided, then the skill of the battler's perception will be used instead.
   * @param {Game_Battler|Game_Actor|Game_Enemy=} battler The target perceiving the skill; defaults to none.
   * @returns {RPG_Skill}
   */
  baseSkill(battler = null)
  {
    // check if a battler was provided.
    if (battler)
    {
      // return the battler's perception of this skill.
      return battler.skill(this.skillId);
    }

    // no battler, just use the database version of the skill.
    return $dataSkills.at(this.skillId);
  }

  /**
   * Gets whether or not the skill this chance is associated with should cast from the
   * target instead of the user.
   * @returns {boolean}
   */
  appearOnTarget()
  {
    // grab the underlying skill for this on-chance effect.
    const skill = this.baseSkill();

    // check the notes.
    return RPGManager.checkForBooleanFromNoteByRegex(skill, J.ABS.RegExp.OnDefeatedTarget);
  }

  /**
   * Dances with RNG to determine if this onChanceEffect was successful or not.
   * @param {number=} rollForPositive The number of times to try for success; defaults to 1.
   * @param {number=} rollForNegative The number of times to try and undo success; defaults to 0.
   * @returns {boolean} True if this effect should proc, false otherwise.
   */
  shouldTrigger(rollForPositive = 1, rollForNegative = 0)
  {
    return RPGManager.chanceIn100(this.chance, rollForPositive, rollForNegative);
  }
}

export default JABS_OnChanceEffect;
//endregion JABS_OnChanceEffect