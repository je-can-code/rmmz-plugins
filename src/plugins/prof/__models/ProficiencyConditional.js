//region ProficiencyConditional
/**
 * A collection of requirements associated with a collection of actors that will grant one or more rewards upon
 * satisfying all requirements.
 */
class ProficiencyConditional
{
  /**
   * The key of this conditional.
   * @type {string}
   */
  key = String.empty;

  /**
   * The actor's id of which this conditional applies to.
   * @type {number[]}
   */
  actorIds = Array.empty;

  /**
   * The requirements for this conditional.
   * @type {ProficiencyRequirement[]}
   */
  requirements = Array.empty;

  /**
   * The skills rewarded when all requirements are fulfilled.
   * @type {number[]}
   */
  skillRewards = Array.empty;

  /**
   * The javascript to execute when all requirements are fulfilled.
   * @type {string}
   */
  jsRewards = String.empty;

  /**
   * Constructor.
   * @param {string} key The unique identifier of this skill proficiency conditional.
   * @param {number[]} actorIds The ids of all actors this conditional applies to.
   * @param {ProficiencyRequirement[]} requirements All requirements that must be satisfied to grant the rewards.
   * @param {number[]} skillRewards The skills rewarded upon satisfying all requirements.
   * @param {string} jsRewards The raw javascript to execute upon satisfying all requirements.
   */
  constructor(key, actorIds, requirements, skillRewards, jsRewards)
  {
    this.key = key;
    this.actorIds = actorIds;
    this.requirements = requirements;
    this.skillRewards = skillRewards;
    this.jsRewards = jsRewards;
  }
}

//endregion ProficiencyConditional