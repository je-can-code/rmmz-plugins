//region RegionSkillData
/**
 * A data class containing the various data points associated with a region that
 * may execute a skill while standing upon it.
 */
class RegionSkillData
{
  /**
   * The regionId this data class stores data for.
   * @type {number}
   */
  regionId = -1;

  /**
   * The skillId that can be executed while within this regionId.
   * @type {number}
   */
  skillId = 0;

  /**
   * The 1-100 integer percent chance of skill execution while within this regionId.
   * @type {number}
   */
  chance = 0;

  /**
   * The id of the enemy whose stats will power this skill execution.
   * @type {number}
   */
  casterId = 0;

  /**
   * Whether or not this region skill execution is considered friendly towards the player.
   * @type {boolean}
   */
  isFriendly = false;

  /**
   * Constructor.
   */
  constructor(regionId, stateId, chanceOfApplication = 100, casterId = 0, isFriendly = false)
  {
    this.regionId = regionId;
    this.skillId = stateId;
    this.chance = chanceOfApplication;
    this.casterId = casterId;
    this.isFriendly = isFriendly;
  }
}
//endregion RegionSkillData