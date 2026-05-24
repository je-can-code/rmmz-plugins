//region AptitudeTeachable
/**
 * The runtime shape of a learnable skill and its requirements.
 * @param {number} skillId The skill id to learn.
 * @param {number} requiredAp The required AP to learn the skill.
 * @constructor
 */
function AptitudeTeachable(skillId, requiredAp)
{
  this.initialize(skillId, requiredAp);
}

AptitudeTeachable.prototype = {};
AptitudeTeachable.prototype.constructor = AptitudeTeachable;

/**
 * Initializes the learning.
 * @param {number} skillId The skill id to learn.
 * @param {number} requiredAp The required AP to learn the skill.
 */
AptitudeTeachable.prototype.initialize = function(skillId, requiredAp)
{
  /**
   * The id of the skill to learn.
   * @type {number}
   */
  this.skillId = skillId;

  /**
   * The required AP to learn the skill.
   * @type {number}
   */
  this.requiredAp = requiredAp;
};
export default AptitudeTeachable;
//endregion AptitudeTeachable