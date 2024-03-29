//region CraftCategory_Tracking
/**
 * A data model representing the tracking of a single crafting category key.
 */
function CategoryTracking(key, unlocked, timesCrafted)
{
  this.initialize(...arguments);
}

CategoryTracking.prototype = {};
CategoryTracking.prototype.constructor = CategoryTracking;

/**
 * Initializes a single category tracking.
 * @param {string} key The key of the category tracked.
 * @param {boolean} unlocked Whether or not unlocked.
 * @param {number=} timesCrafted The number of times a recipe with this category key has been crafted before.
 */
CategoryTracking.prototype.initialize = function(key, unlocked, timesCrafted = 0)
{
  /**
   * The key of this category that is being tracked.
   * @type {string}
   */
  this.key = key;

  /**
   * True if the category associated with this key is unlocked,
   * false otherwise.
   * @type {boolean}
   */
  this.unlocked = unlocked;

  /**
   * The number of times a recipe with this category key has been crafted.
   * @type {number}
   */
  this.timesCrafted = 0;
};

/**
 * Checks whether or not this tracked recipe has been unlocked.
 * @return {boolean}
 */
CategoryTracking.prototype.isUnlocked = function()
{
  return this.unlocked;
};

/**
 * Unlocks this crafting category.<br>
 * It will be available to the player if they have the other requirements met.
 */
CategoryTracking.prototype.unlock = function()
{
  this.unlocked = true;
};

/**
 * Locks this crafting category.<br>
 * It will be hidden from the player, even if they have other requirements met.
 */
CategoryTracking.prototype.lock = function()
{
  this.unlocked = false;
};

CategoryTracking.prototype.craftedCount = function()
{
  return this.timesCrafted;
};
//endregion CraftRecipe_Tracking