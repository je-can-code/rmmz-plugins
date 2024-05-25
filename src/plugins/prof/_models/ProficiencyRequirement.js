//region proficiencyRequirement
/**
 * A single requirement of a skill prof conditional.
 * @constructor
 */
function ProficiencyRequirement()
{
  this.initialize(...arguments);
}

ProficiencyRequirement.prototype = {};
ProficiencyRequirement.prototype.constructor = ProficiencyRequirement;

/**
 * Initializes this class with the given parameters.
 */
ProficiencyRequirement.prototype.initialize = function(skillId, proficiency)
{
  /**
   * The skill id for this requirement.
   * @type {number}
   */
  this.skillId = skillId;

  /**
   * The level of prof required to consider this requirement fulfilled.
   * @type {number}
   */
  this.proficiency = proficiency;
};
//endregion proficiencyRequirement