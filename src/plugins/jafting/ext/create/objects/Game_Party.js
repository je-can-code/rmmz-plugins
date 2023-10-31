//region Game_Party
/**
 * Extends {@link #initialize}.<br>
 * Also initializes our jafting members.
 */
J.JAFTING.Aliased.Game_Party.set('initialize', Game_Party.prototype.initialize);
Game_Party.prototype.initialize = function()
{
  // perform original logic.
  J.JAFTING.Aliased.Game_Party.get('initialize').call(this);

  // init sdp members.
  this.initJaftingMembers();

  // populate the trackings.
  this.populateJaftingTrackings();
};

/**
 * Initializes all members of the jafting system.
 */
Game_Party.prototype.initJaftingMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the jafting system.
   */
  this._j._crafting ||= {};

  /**
   * A collection of all recipes being tracked by this party.
   * There should always be one for every recipe imported from the configuration.
   * @type {RecipeTracking[]}
   */
  this._j._crafting._recipeTrackings = [];

  /**
   * A collection of all categories being tracked by this party.
   * There should always be one for every category imported from the configuration.
   * @type {CategoryTracking[]}
   */
  this._j._crafting._categoryTrackings = [];
};

/**
 * Populates all jafting trackings from the current plugin metadata.
 */
Game_Party.prototype.populateJaftingTrackings = function()
{
  // populate the recipes.
  this._j._crafting._recipeTrackings = J.JAFTING.EXT.CREATE.Metadata.recipes
    .map(recipe => new RecipeTracking(recipe.key, recipe.unlockedByDefault));

  // populate the categories.
  this._j._crafting._categoryTrackings = J.JAFTING.EXT.CREATE.Metadata.categories
    .map(category => new CategoryTracking(category.key, category.unlockedByDefault));
};

/**
 * Gets all jafting recipe trackings.
 * @return {RecipeTracking[]}
 */
Game_Party.prototype.getAllRecipeTrackings = function()
{
  return this._j._crafting._recipeTrackings;
};

/**
 * Gets all jafting category trackings.
 * @return {CategoryTracking[]}
 */
Game_Party.prototype.getAllCategoryTrackings = function()
{
  return this._j._crafting._categoryTrackings;
};

/**
 * Gets all recipe trackings that are unlocked.
 * @return {RecipeTracking[]}
 */
Game_Party.prototype.getUnlockedRecipeTrackings = function()
{
  return this.getAllRecipeTrackings().filter(recipe => recipe.isUnlocked());
};

/**
 * Gets all category trackings that are unlocked.
 * @return {CategoryTracking[]}
 */
Game_Party.prototype.getUnlockedCategoryTrackings = function()
{
  return this.getAllCategoryTrackings().filter(category => category.isUnlocked());
};

/**
 * Gets a current list of all jafting recipes that are unlocked.
 * @return {CraftingRecipe[]}
 */
Game_Party.prototype.getUnlockedRecipes = function()
{
  // start our tracking with an empty array.
  const unlockedRecipes = [];

  // iterate over each of the unlocked trackings.
  this.getUnlockedRecipeTrackings().forEach(tracking =>
  {
    // grab the recipe associated with the key.
    const recipe = this.getRecipeByKey(tracking.key);

    // skip unfound keys if we have those somehow.
    if (!recipe) return;

    // add the recipe to the list.
    unlockedRecipes.push(recipe);
  });

  // return what we found.
  return unlockedRecipes;
};

/**
 * Gets a current list of all jafting categories that are unlocked.
 * @return {CraftingCategory[]}
 */
Game_Party.prototype.getUnlockedCategories = function()
{
  // start our tracking with an empty array.
  const unlockedCategories = [];

  // iterate over each of the unlocked trackings.
  this.getUnlockedCategoryTrackings().forEach(tracking =>
  {
    // grab the category associated with the key.
    const category = this.getCategoryByKey(tracking.key);

    // skip unfound keys if we have those somehow.
    if (!category) return;

    // add the category to the list.
    unlockedCategories.push(category);
  });

  // return what we found.
  return unlockedCategories;
};

/**
 * Returns a map of all jafting recipes keyed by the recipe's key.
 * @return {Map<string, CraftingRecipe>}
 */
Game_Party.prototype.getAllRecipesAsMap = function()
{
  return J.JAFTING.EXT.CREATE.Metadata.recipesMap;
};

/**
 * Gets the recipe tracking associated with a specific key.
 * @param {string} key The key of the recipe tracking to find.
 * @return {RecipeTracking}
 */
Game_Party.prototype.getRecipeTrackingByKey = function(key)
{
  return this.getAllRecipeTrackings()
    .find(tracked => (tracked.key === key));
};

/**
 * Get a jafting recipe by its key.
 * @param {string} key The key of the recipe to find.
 * @return {CraftingRecipe}
 */
Game_Party.prototype.getRecipeByKey = function(key)
{
  return this.getAllRecipesAsMap().get(key);
};

/**
 * Returns a map of all jafting categories keyed by the category's key.
 * @return {Map<string, CraftingCategory>}
 */
Game_Party.prototype.getAllCategoriesAsMap = function()
{
  return J.JAFTING.EXT.CREATE.Metadata.categoriesMap;
};

/**
 * Get a jafting category by its key.
 * @param {string} key The key of the category to find.
 * @return {CraftingCategory}
 */
Game_Party.prototype.getCategoryByKey = function(key)
{
  return this.getAllCategoriesAsMap().get(key);
};

/**
 * Gets the category tracking associated with a specific key.
 * @param {string} key The key of the category tracking to find.
 * @return {CategoryTracking}
 */
Game_Party.prototype.getCategoryTrackingByKey = function(key)
{
  return this.getAllCategoryTrackings()
    .find(tracked => (tracked.key === key));
};

/**
 * Locks a recipe associated with the given key.
 * @param {string} key The key of the recipe to lock.
 */
Game_Party.prototype.lockRecipe = function(key)
{
  // grab the tracking we're working with.
  const tracking = this.getRecipeTrackingByKey(key);

  // validate there is a tracking.
  if (!tracking)
  {
    // stop processing if there isn't any tracking.
    console.error(`The recipe key of ${key} was not found in the list of recipes to lock.`);
    return;
  }

  // lock the recipe.
  tracking.lock();
};

/**
 * Unlocks a recipe associated with the given key.
 * @param {string} key The key of the recipe to unlock.
 */
Game_Party.prototype.unlockRecipe = function(key)
{
  // grab the tracking we're working with.
  const tracking = this.getRecipeTrackingByKey(key);

  // validate there is a tracking.
  if (!tracking)
  {
    // stop processing if there isn't any tracking.
    console.error(`The recipe key of ${key} was not found in the list of recipes to unlock.`);
    return;
  }

  // unlock the recipe.
  tracking.unlock();
};

/**
 * Locks a category associated with the given key.
 * @param {string} key The key of the category to lock.
 */
Game_Party.prototype.lockCategory = function(key)
{
  // grab the tracking we're working with.
  const tracking = this.getCategoryTrackingByKey(key);

  // validate there is a tracking.
  if (!tracking)
  {
    // stop processing if there isn't any tracking.
    console.error(`The category of ${key} was not found in the list of categorys to lock.`);
    return;
  }

  // lock the recipe.
  tracking.lock();
};

/**
 * Unlocks a category associated with the given key.
 * @param {string} key The key of the category to unlock.
 */
Game_Party.prototype.unlockCategory = function(key)
{
  // grab the tracking we're working with.
  const tracking = this.getCategoryTrackingByKey(key);

  // validate there is a tracking.
  if (!tracking)
  {
    // stop processing if there isn't any tracking.
    console.error(`The category key of ${key} was not found in the list of categories to unlock.`);
    return;
  }

  // unlock the recipe.
  tracking.unlock();
};

Game_Party.prototype.unlockAllCategories = function()
{
  this
    .getAllCategoryTrackings()
    .forEach(tracking => tracking.unlock());
};

Game_Party.prototype.unlockAllRecipes = function()
{
  this
    .getAllRecipeTrackings()
    .filter(tracking => !tracking.key.startsWith('_'))
    .forEach(tracking => tracking.unlock());
};

/**
 * Extends `gainItem()` to also refresh the JAFTING windows on item quantity change.
 * @param {RPG_Item|RPG_Weapon|RPG_Armor} item The item to modify the quantity of.
 * @param {number} amount The amount to modify the quantity by.
 * @param {boolean} includeEquip Whether or not to include equipped items for equipment.
 */
J.JAFTING.Aliased.Game_Party.set('gainItem', Game_Party.prototype.gainItem);
Game_Party.prototype.gainItem = function(item, amount, includeEquip)
{
  // perform original logic.
  J.JAFTING.Aliased.Game_Party.get('gainItem').call(this, item, amount, includeEquip);

  // refresh the JAFTING windows on item quantity change.
  $gameSystem.setRefreshRequest(true);
};
//endregion Game_Party