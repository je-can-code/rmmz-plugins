//region PanelRankupReward
/**
 * A class that represents a single reward for achieving a particular rank in a panel.
 */
function PanelRankupReward()
{
  this.initialize(...arguments);
}

PanelRankupReward.prototype = {};
PanelRankupReward.prototype.constructor = PanelRankupReward;

/**
 * Initializes a single rankup reward.
 * @param {string} rewardName The name to display for this reward.
 * @param {number} rankRequired The rank required.
 * @param {string} effect The effect to execute.
 */
PanelRankupReward.prototype.initialize = function(rewardName, rankRequired, effect)
{
  /**
   * The name of this reward that shows up in the SDP scene.
   * @type {string}
   */
  this.rewardName = rewardName;

  /**
   * The rank required for this panel rankup reward to be executed.
   * @type {number}
   */
  this.rankRequired = rankRequired;

  /**
   * The effect to be executed upon reaching the rank required.
   * The effect is captured as javascript.
   * @type {string}
   */
  this.effect = effect;
};
//endregion PanelRankupReward