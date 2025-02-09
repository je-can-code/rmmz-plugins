//region SDP_RankupReward
/**
 * A class that represents a single tracking of a panel being unlocked.
 */
function PanelTracking(key, unlockedByDefault)
{
  this.initialize(...arguments);
}

PanelTracking.prototype = {};
PanelTracking.prototype.constructor = PanelTracking;

/**
 * Initializes a single panel tracking.
 * @param {string} panelKey The key of the panel tracked.
 * @param {boolean} unlockedByDefault Whether or not unlocked by default.
 */
PanelTracking.prototype.initialize = function(panelKey, unlockedByDefault)
{
  /**
   * The key of this panel that is being tracked.
   * @type {string}
   */
  this.key = panelKey;

  /**
   * True if the panel associated with this key is unlocked,
   * false otherwise.
   * @type {boolean}
   */
  this.unlocked = unlockedByDefault;
};

/**
 * Checks whether or not this tracked panel has been unlocked.
 * @return {boolean}
 */
PanelTracking.prototype.isUnlocked = function()
{
  return this.unlocked;
};

/**
 * Unlocks this panel in tracking, allowing party members to put points
 * towards it and rank it up.
 */
PanelTracking.prototype.unlock = function()
{
  this.unlocked = true;
};

/**
 * Locks this panel in tracking, preventing party members from putting
 * any additional points into it.
 */
PanelTracking.prototype.lock = function()
{
  this.unlocked = false;
};
//endregion SDP_RankupReward