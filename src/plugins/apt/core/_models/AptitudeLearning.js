//region AptitudeLearning
/**
 * The current state of a skill being learned.
 * @param {number} skillId The skill id to learn.
 * @param {number} requiredAp The required AP to achieve this learning.
 * @param {number} currentAp The current AP towards achieving this learning.
 * @constructor
 */
function AptitudeLearning(skillId, requiredAp, currentAp)
{
  this.initialize(skillId, requiredAp, currentAp);
}

AptitudeLearning.prototype = {};
AptitudeLearning.prototype.constructor = AptitudeLearning;

/**
 * Initializes the learning.
 * @param {number} skillId The skill id to learn.
 * @param {number} requiredAp The required AP to achieve this learning.
 * @param {number} currentAp The current AP towards achieving this learning.
 */
AptitudeLearning.prototype.initialize = function(skillId, requiredAp, currentAp)
{
  /**
   * The id of the skill learned when achieving this learning.
   * @type {number}
   */
  this.skillId = skillId;

  /**
   * The current AP towards achieving this learning.
   * @type {number}
   */
  this.currentAp = currentAp;

  /**
   * The required amount of AP to achieve this learning.
   * @type {number}
   */
  this.requiredAp = requiredAp;
};

/**
 * Gains AP towards achieving this learning.
 * @param {number} ap The amount of AP to gain.
 */
AptitudeLearning.prototype.gainAp = function(ap)
{
  this.currentAp += ap;
};

/**
 * Sets the current AP towards achieving this learning.
 * @param {number} ap The amount of AP to set.
 */
AptitudeLearning.prototype.setAp = function(ap)
{
  this.currentAp = ap;
}

/**
 * Whether or not this learning is achieved.
 * @returns {boolean} True if the learning is achieved, false otherwise.
 */
AptitudeLearning.prototype.isLearned = function()
{
  return this.currentAp >= this.requiredAp;
};
//endregion AptitudeLearning