//region AptitudeSkill
import AptitudeProgress from './AptitudeProgress.js';
/**
 * The structure of an object and the skill that was learned.
 * @param {skillId} skillId The skill id that was learned.
 * @param {boolean} [learned] Whether or not the skill was learned; defaults to false.
 * @constructor
 */
function AptitudeSkill(skillId, learned = false)
{
  this.initialize(skillId, learned);
}

AptitudeSkill.prototype = {};
AptitudeSkill.prototype.constructor = AptitudeSkill;

/**
 * Initializes the learning.
 * @param {skillId} skillId The skill id that was learned.
 * @param {boolean} [learned] Whether or not the skill was learned; defaults to false.
 */
AptitudeSkill.prototype.initialize = function(skillId, learned = false)
{
  /**
   * The skill id that was learned.
   * @type {number}
   */
  this.skillId = skillId;

  /**
   * Whether or not this aptitude skill is learned.
   * @type {boolean}
   */
  this.learned = learned;

  /**
   * The "type:id" key of the aptitude that this skill was learned from.
   * @type {string}
   */
  this._learnedFrom = String.empty;
};

/**
 * Learns the skill.
 * @param {AptitudeProgress} learnedFrom The aptitude from which this skill was learned.
 */
AptitudeSkill.prototype.learnSkill = function(learnedFrom)
{
  // flag the aptitude as learned.
  this.learned = true;

  // identify what aptitude it was learned from.
  this._learnedFrom = learnedFrom.key;
};

/**
 * Forgets the skill.
 */
AptitudeSkill.prototype.forgetSkill = function()
{
  // flag the aptitude as not learned.
  this.learned = false;

  // clear the aptitude that it was learned from.
  this._learnedFrom = String.empty;
};

/**
 * Gets the key of the aptitude that this skill was learned from.
 * @returns {string}
 */
AptitudeSkill.prototype.learnedFrom = function()
{
  // TODO: map this to something meaningful for output.
  return this._learnedFrom;
};
export default AptitudeSkill;
//endregion AptitudeSkill