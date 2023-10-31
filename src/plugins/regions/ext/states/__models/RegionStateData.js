//region RegionStateData
/**
 * A data class containing the various data points associated with a region that
 * may apply a state while standing upon it.
 */
class RegionStateData
{
  /**
   * The regionId this data class stores data for.
   * @type {number}
   */
  regionId = -1;

  /**
   * The stateId that can be applied when within this regionId.
   * @type {number}
   */
  stateId = 0;

  /**
   * The 1-100 integer percent chance of state application while within this regionId.
   * @type {number}
   */
  chance = 0;

  /**
   * The animationId to play when the state is infact applied.
   * @type {number}
   */
  animationId = 0;

  /**
   * Constructor.
   */
  constructor(regionId, stateId, chanceOfApplication = 100, animationId = 0)
  {
    this.regionId = regionId;
    this.stateId = stateId;
    this.chance = chanceOfApplication;
    this.animationId = animationId;
  }
}
//endregion RegionStateData