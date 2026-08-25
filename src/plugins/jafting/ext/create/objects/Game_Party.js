//region Game_Party
import RecipeTracking from './../__models/RecipeTracking.js';
import CategoryTracking from './../__models/CategoryTracking.js';

/**
 * Extends {@link #initMembers}.<br/>
 * Also initializes our jafting members.
 */
J.JAFTING.EXT.CREATE.Aliased.Game_Party.set('initMembers', Game_Party.prototype.initMembers);
Game_Party.prototype.initMembers = function()
{
  // perform original logic.
  J.JAFTING.EXT.CREATE.Aliased.Game_Party.get('initMembers')
    .call(this);

  // init the members.
  this.initJaftingCreationMembers();

  // populate the trackings.
  this.populateJaftingTrackings();
};

/**
 * Initializes all members of the jafting system.
 */
Game_Party.prototype.initJaftingCreationMembers = function()
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
  this.setRecipeTrackings(J.JAFTING.EXT.CREATE.Metadata.recipes
    .map(recipe => new RecipeTracking(recipe.key, recipe.unlockedByDefault)));

  // populate the categories.
  this.setCategoryTrackings(J.JAFTING.EXT.CREATE.Metadata.categories
    .map(category => new CategoryTracking(category.key, category.unlockedByDefault)));
};

/**
 * Refreshes all the recipe trackings from the plugin metadata.
 */
Game_Party.prototype.updateRecipesFromConfig = function()
{
  // grab the current list of trackings by reference.
  const trackings = this.getAllRecipeTrackings();

  // iterate over all of the ones defined in the plugin metadata.
  J.JAFTING.EXT.CREATE.Metadata.recipes.forEach(recipe =>
  {
    // skip ones that we shouldn't be adding.
    // NOTE: recipes typically only leverage the key.
    if (!this.canGainEntry(recipe.key)) return;

    // find one by the same key in the existing trackings.
    const foundTracking = trackings.find(tracking => tracking.key === recipe.key);

    // check if we found a tracking.
    if (!foundTracking)
    {
      // we didn't find one, so create and add a new tracking.
      const newTracking = new RecipeTracking(recipe.key, recipe.unlockedByDefault);
      trackings.push(newTracking);
    }
  });
};

/**
 * Refreshes all the category trackings from the plugin metadata.
 */
Game_Party.prototype.updateCategoriesFromConfig = function()
{
  // grab the current list of trackings by reference.
  const trackings = this.getAllCategoryTrackings();

  // iterate over all of the ones defined in the plugin metadata.
  J.JAFTING.EXT.CREATE.Metadata.categories.forEach(category =>
  {
    // skip ones that we shouldn't be adding.
    // NOTE: categories can leverage both key and name.
    if (!this.canGainEntry(category.key) || !this.canGainEntry(category.name)) return;

    // find one by the same key in the existing trackings.
    const found = trackings.find(tracking => tracking.key === category.key);

    // check if we found a tracking.
    if (!found)
    {
      // we didn't find one, so create and add a new tracking.
      const newTracking = new CategoryTracking(category.key, category.unlockedByDefault);
      trackings.push(newTracking);
    }
  });
};

/**
 * Gets all jafting recipe trackings.
 * @return {RecipeTracking[]}
 */
Game_Party.prototype.getAllRecipeTrackings = function()
{
  return this.recipeTrackings();
};

/**
 * Gets all jafting category trackings.
 * @return {CategoryTracking[]}
 */
Game_Party.prototype.getAllCategoryTrackings = function()
{
  return this.categoryTrackings();
};

/**
 * Gets all recipe trackings that are unlocked.
 * @return {RecipeTracking[]}
 */
Game_Party.prototype.getUnlockedRecipeTrackings = function()
{
  return this.getAllRecipeTrackings()
    .filter(recipe => recipe.isUnlocked());
};

/**
 * Gets all category trackings that are unlocked.
 * @return {CategoryTracking[]}
 */
Game_Party.prototype.getUnlockedCategoryTrackings = function()
{
  return this.getAllCategoryTrackings()
    .filter(category => category.isUnlocked());
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
  this.getUnlockedRecipeTrackings()
    .forEach(tracking =>
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
  this.getUnlockedCategoryTrackings()
    .forEach(tracking =>
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
 * Gets all unlocked recipes that are a part of a given category.
 * @param {string} categoryKey The category to get all unlocked recipes for.
 * @returns {CraftingRecipe[]}
 */
Game_Party.prototype.getUnlockedRecipesByCategory = function(categoryKey)
{
  const recipes = this.getUnlockedRecipes();
  const unlocked = recipes.filter(recipe => recipe.categoryKeys.includes(categoryKey));

  return unlocked;
};

/**
 * Gets every recipe of a given category that a shop could put on its shelf.
 *
 * Three filters, and leaving any one of them out breaks the shop in a different way:
 *
 * - **Carries a cost.** Nothing authored before study existed has one, so without this the shelf holds
 *   every recipe in the game, priced at nothing.
 * - **{@link #canGainEntry}.** The divider rows that pad the configuration are never *unlocked*, which
 *   is the only reason nobody has ever seen one. A shelf built out of what is locked is built out of
 *   precisely the rows that guard exists to hide.
 * - **Belongs to the category.** The shop shows one category at a time, as the crafting menu does.
 *
 * Note that this deliberately does *not* filter out what the party already knows. A recipe already
 * learned still belongs on the shelf, greyed and sorted to the bottom, because a shop that hides what
 * you have bought cannot show you how much of it there was.
 * @param {string} categoryKey The category to get all purchasable recipes for.
 * @returns {CraftingRecipe[]}
 */
Game_Party.prototype.getPurchasableRecipesByCategory = function(categoryKey)
{
  const recipesMap = this.getAllRecipesAsMap();
  const allRecipes = Array.from(recipesMap.values());

  return allRecipes
    .filter(recipe => recipe.isPurchasable())
    .filter(recipe => this.canGainEntry(recipe.key))
    .filter(recipe => recipe.categoryKeys.includes(categoryKey));
};

/**
 * Gets all unlocked recipes that are a part of a given category that have
 * also been crafted at least once.
 * @param {string} categoryKey The category to get all unlocked recipes for.
 * @returns {CraftingRecipe[]}
 */
Game_Party.prototype.getCraftedRecipeCountByCategoryKey = function(categoryKey)
{
  // get all unlocked recipes of a given category.
  const unlocked = this.getUnlockedRecipesByCategory(categoryKey);

  if (!unlocked.length) return 0;

  // grab the keys of all the unlocked recipes.
  const keys = unlocked.map(recipe => recipe.key);

  // filter the unlocked recipe trackings to the ones that are relevant and crafted.
  const trackings = this
    .getUnlockedRecipeTrackings()
    .filter(recipe => keys.includes(recipe.key))
    .filter(recipe => recipe.hasBeenCrafted());

  // return what we found.
  return trackings.length;
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
  return this.getAllRecipesAsMap()
    .get(key);
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
  return this.getAllCategoriesAsMap()
    .get(key);
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
    Diagnostics.error('J-JAFTING-Creation', `the recipe key of ${key} was not found in the list of recipes to lock.`);
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
    const problem = `the recipe key of ${key} was not found in the list of recipes to unlock.`;
    Diagnostics.error('J-JAFTING-Creation', problem);
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
    const problem = `the category key of ${key} was not found in the list of categories to lock.`;
    Diagnostics.error('J-JAFTING-Creation', problem);
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
    const problem = `the category key of ${key} was not found in the list of categories to unlock.`;
    Diagnostics.error('J-JAFTING-Creation', problem);
    return;
  }

  // unlock the recipe.
  tracking.unlock();
};

/**
 * Unlocks all implemented categories.
 */
Game_Party.prototype.unlockAllCategories = function()
{
  this
    .getAllCategoryTrackings()
    .filter(tracking => this.canGainEntry(tracking.key))
    .forEach(tracking => tracking.unlock());
};

/**
 * Locks all implemented categories.
 */
Game_Party.prototype.lockAllCategories = function()
{
  this
    .getAllCategoryTrackings()
    .forEach(tracking => tracking.lock());
};

/**
 * Unlocks all implemented recipes.
 */
Game_Party.prototype.unlockAllRecipes = function()
{
  this
    .getAllRecipeTrackings()
    .filter(tracking => this.canGainEntry(tracking.key))
    .forEach(tracking => tracking.unlock());
};

/**
 * Locks all implemented recipes.
 */
Game_Party.prototype.lockAllRecipes = function()
{
  this
    .getAllRecipeTrackings()
    .forEach(tracking => tracking.lock());
};

/**
 * Whether or not a named entry should be unlockable.
 * This is mostly for skipping recipe names that are used as dividers in the list.
 * @param {string} name The name of the entry.
 * @return {boolean} True if the entry can be gained, false otherwise.
 */
Game_Party.prototype.canGainEntry = function(name)
{
  // skip entries that are null.
  if (name === null) return false;

  // skip entries with empty names.
  if (name.trim().length === 0) return false;

  // skip entries that start with an underscore (arbitrary).
  if (name.startsWith('_')) return false;

  // skip entries that start with a multiple equals (arbitrary).
  if (name.startsWith('==')) return false;

  // skip entries that are the "empty" name (arbitrary).
  if (name.includes('-- empty --')) return false;

  // we can gain it!
  return true;
};

/**
 * Adds +1 proficiency to all recipe trackings, revealing them if they were previously masked.
 * This is mostly for debugging purposes.
 */
Game_Party.prototype.revealAllKnownRecipes = function()
{
  this
    .getAllRecipeTrackings()
    .filter(tracking => this.canGainEntry(tracking.key))
    .forEach(tracking => tracking.improveProficiency(1));
};

/**
 * Completely unlocks all recipes and categories and reveals them if they would be otherwise masked.
 * This is mostly for debugging purposes.
 */
Game_Party.prototype.unlockEverythingCompletely = function()
{
  this.unlockAllRecipes();
  this.unlockAllCategories();
  this.revealAllKnownRecipes();
};

Game_Party.prototype.updateVariableWithCraftedCountByCategories = function(variableId, categoryKeys)
{
  // initialize with zero crafted entries.
  let count = 0;

  // iterate over each of the category keys.
  categoryKeys.forEach(categoryKey =>
  {
    // add the crafted amount for each category passed.
    count += this.getCraftedRecipeCountByCategoryKey(categoryKey);
  }, this);

  // update the variable requested with the total count.
  $gameVariables.setValue(variableId, count);
};

//region properties
/**
 * Gets the recipe trackings.
 * @returns {RecipeTracking[]} The recipeTrackings.
 */
Game_Party.prototype.recipeTrackings = function()
{
  // hand back the recipe trackings.
  return this._j._crafting._recipeTrackings;
};

/**
 * Sets the recipe trackings.
 * @param {RecipeTracking[]} newRecipeTrackings The new recipeTrackings.
 */
Game_Party.prototype.setRecipeTrackings = function(newRecipeTrackings)
{
  // assign the recipe trackings.
  this._j._crafting._recipeTrackings = newRecipeTrackings;
};

/**
 * Gets the category trackings.
 * @returns {CategoryTracking[]} The categoryTrackings.
 */
Game_Party.prototype.categoryTrackings = function()
{
  // hand back the category trackings.
  return this._j._crafting._categoryTrackings;
};

/**
 * Sets the category trackings.
 * @param {CategoryTracking[]} newCategoryTrackings The new categoryTrackings.
 */
Game_Party.prototype.setCategoryTrackings = function(newCategoryTrackings)
{
  // assign the category trackings.
  this._j._crafting._categoryTrackings = newCategoryTrackings;
};
//endregion properties
//endregion Game_Party