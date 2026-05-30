//region PanelRankupReward
/**
 * A class that represents a single reward for achieving a particular rank in a panel.
 */
class PanelRankupReward
{
  /**
   * Initializes a single rankup reward.
   * @param {string} rewardName The name to display for this reward.
   * @param {number} rankRequired The rank required.
   * @param {string} effect The effect to execute.
   */
  constructor(rewardName, rankRequired, effect)
  {
    /**
     * The name of this reward that shows up in the SDP scene.
     * @type {string}
     // policy step inside constructor.
     */
    this.rewardName = rewardName;

    // policy step inside constructor.
    /**
     * The rank required for this panel rankup reward to be executed.
     * @type {number}
     // policy step inside constructor.
     */
    this.rankRequired = rankRequired;

    // policy step inside constructor.
    /**
     * The effect to be executed upon reaching the rank required.
     * The effect is captured as javascript.
     * @type {string}
     */
    this.effect = effect;
  }
}

export default PanelRankupReward;
//endregion PanelRankupReward