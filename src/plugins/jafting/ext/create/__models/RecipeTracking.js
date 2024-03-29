//region CraftRecipe_Tracking
/**
 * A data model representing the tracking of a single crafting recipe key.
 */
function RecipeTracking(key, unlocked, timesCrafted)
{
  this.initialize(...arguments);
}

RecipeTracking.prototype = {};
RecipeTracking.prototype.constructor = RecipeTracking;

/**
 * Initializes a single recipe tracking.
 * @param {string} recipeKey The key of the recipe tracked.
 * @param {boolean} unlocked Whether or not unlocked.
 * @param {number=} timesCrafted The number of times this recipe has been crafted before.
 */
RecipeTracking.prototype.initialize = function(recipeKey, unlocked, timesCrafted = 0)
{
  /**
   * The key of this recipe that is being tracked.
   * @type {string}
   */
  this.key = recipeKey;

  /**
   * True if the recipe associated with this key is unlocked,
   * false otherwise.
   * @type {boolean}
   */
  this.unlocked = unlocked;

  /**
   * The number of times a recipe with this key has been crafted.
   * @type {number}
   */
  this.proficiency = 0;
};

/**
 * Checks whether or not this tracked recipe has been unlocked.
 * @return {boolean}
 */
RecipeTracking.prototype.isUnlocked = function()
{
  return this.unlocked;
};

/**
 * Unlocks this crafting recipe.<br>
 * It will be available to the player if they have the other requirements met.
 */
RecipeTracking.prototype.unlock = function()
{
  this.unlocked = true;
};

/**
 * Locks this crafting recipe.<br>
 * It will be hidden from the player, even if they have other requirements met.
 */
RecipeTracking.prototype.lock = function()
{
  this.unlocked = false;
};

/**
 * Improves the crafting proficiency for this recipe.
 */
RecipeTracking.prototype.improveProficiency = function(improvement = 1)
{
  this.proficiency += improvement;
}

/**
 * Checks if this recipe has been crafted before.
 * @return {boolean}
 */
RecipeTracking.prototype.hasBeenCrafted = function()
{
  return this.craftingProficiency() > 0;
};

/**
 * Gets how many times this particular recipe has been crafted.
 * @return {number}
 */
RecipeTracking.prototype.craftingProficiency = function()
{
  return this.proficiency;
};
//endregion CraftRecipe_Tracking