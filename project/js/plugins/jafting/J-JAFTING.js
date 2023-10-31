//region Introduction
/*:
 * @target MZ
 * @plugindesc
 * [v1.0.0 JAFT] Enables the ability to craft items from recipes.
 * @author JE
 * @url https://github.com/je-can-code/rmmz-plugins
 * @base J-Base
 * @orderAfter J-Base
 * @help
 * ============================================================================
 * OVERVIEW:
 * This plugin enables a new "JAFTING" (aka crafting) scene. With it, you can
 * define recipes and enable generic item creation in your game.
 *
 * NOTE ABOUT CREATION:
 * This base plugin can only be used to create already-existing entries from
 * the database. If you want to create new weapons/armor entirely, consider
 * looking into the J-JAFTING-Refinement extension.
 * ============================================================================
 * RECIPES:
 * Have you ever wanted to make a recipe that the player can then learn and
 * create items from? Well now you can! There are absolutely no tags required
 * for this basic functionality, it is 100% defined within the plugin
 * parameters of your RMMZ editor.
 *
 * A recipe is comprised of three lists:
 * - Ingredients: the consumed items/weapons/armors.
 * - Tools: the non-consumed items/weapons/armors.
 * - Output: what the player gains when JAFTING the recipe.
 * ============================================================================
 * CHANGELOG:
 * - 1.0.1
 *    Retroactively added this CHANGELOG.
 * - 1.0.0
 *    Initial release.
 * ============================================================================
 *
 * @param JAFTINGconfigs
 * @text JAFTING SETUP
 *
 * @param JAFTINGrecipes
 * @parent JAFTINGconfigs
 * @type struct<RecipeStruct>[]
 * @text JAFTING Recipes
 *
 * @param JAFTINGcategories
 * @parent JAFTINGconfigs
 * @type struct<CategoryStruct>[]
 * @text JAFTING Categories
 *
 * @command Call Jafting Menu
 * @text Access the Jafting Menu
 * @desc Calls the Jafting Menu via plugin command.
 *
 * @command Close Jafting Menu
 * @text End the Jafting session
 * @desc Ends the current Jafting session immediately.
 * Typically used for triggering a parallel item created event.
 *
 * @command Unlock Category
 * @text Unlock new category
 * @desc Within the Crafting Mode, unlocks a new category of crafting.
 * @arg categoryKeys
 * @type string[]
 * @text Category Keys
 * @desc All the keys of the categories to be unlocked.
 *
 * @command Unlock Recipe
 * @text Unlock new recipe
 * @desc Within the Crafting Mode, unlocks a new recipe of a category of crafting.
 * @arg recipeKeys
 * @type string[]
 * @text Recipe Keys
 * @desc All the keys of the recipes to be unlocked.
 *
 * @command Lock Category
 * @text Lock a category
 * @desc Within the Crafting Mode, locks a previously unlocked category of crafting.
 * @arg key
 * @type string
 * @desc The unique identifier to this category to remove.
 * @default C_SOME
 *
 * @command Lock All Categories
 * @text Lock all crafting categories
 * @desc Locks all categories that were previously unlocked, effectively disabling crafting.
 */
/*~struct~RecipeStruct:
 * @param recipeKey
 * @type string
 * @text Recipe Key
 * @desc A unique identifier for this recipe.
 *
 * @param name
 * @type string
 * @text Name
 * @desc The name of the recipe.
 *
 * @param description
 * @type string
 * @text Description
 * @desc The description of this recipe. If unspecified, it will pull from the first output description.
 *
 * @param iconIndex
 * @type number
 * @text Icon Index
 * @desc The icon index of this recipe. If unspecified, it will pull from the first output description.
 *
 * @param categoryKeys
 * @type string[]
 * @text Category Keys
 * @desc The keys of the categories that this recipe belongs to.
 * @default []
 *
 * @param ingredients
 * @type struct<ComponentStruct>[]
 * @text Ingredients
 * @desc The ingredients required to JAFT this recipe. These are consumed.
 * @default []
 *
 * @param tools
 * @type struct<ComponentStruct>[]
 * @text Tools
 * @desc The tools required to JAFT this recipe. These are not consumed.
 * @default []
 *
 * @param output
 * @type struct<ComponentStruct>[]
 * @text Output
 * @desc Upon JAFTING this recipe, these items are given to the player.
 * @default []
 *
 * @param maskedUntilCrafted
 * @type boolean
 * @text Masked Until Crafted
 * @desc If this is set to true, then it will appear as all question marks until crafted the first time.
 * @default false
 *
 */
/*~struct~ComponentStruct:
 * @param itemId
 * @type item
 * @text Item ID
 * @desc The item this component represents.
 * There can only be one "id" identified on a component.
 *
 * @param weaponId
 * @type weapon
 * @text Weapon ID
 * @desc The weapon this component represents.
 * There can only be one "id" identified on a component.
 *
 * @param armorId
 * @type armor
 * @text Armor ID
 * @desc The armor this component represents.
 * There can only be one "id" identified on a component.
 *
 * @param num
 * @type number
 * @min 1
 * @text Quantity
 * @desc The quantity of this JAFTING component.
 * @default 1
 */
/*~struct~CategoryStruct:
 *
 * @param name
 * @type string
 * @text Category Name
 * @desc The name of this category.
 *
 * @param key
 * @type string
 * @text Category Key
 * @desc The unique key for this category.
 *
 * @param iconIndex
 * @type number
 * @text Icon Index
 * @desc The icon index to represent this category.
 * @default 0
 *
 * @param description
 * @type string
 * @text Description
 * @desc The description of this category to show up in the help window.
 */

//region plugin metadata
class J_CraftingPluginMetadata extends PluginMetadata
{
  /**
   * The path where the config for panels is located.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.crafting.json';

  /**
   * Classifies the anonymous object from the parsed json into a proper set
   * of recipes and categories.
   * @param parsedJson
   * @return {CraftingConfiguration} The blob with all data converted into proper classes.
   */
  static classify(parsedJson)
  {
    // classify the configuration data.
    const recipes = this.parseRecipes(parsedJson.recipes);
    const categories = this.parseCategories(parsedJson.categories);

    // build the new crafting configuration.
    const config = CraftingConfiguration.builder
      .recipes(recipes)
      .categories(categories)
      .build();

    // return what we made.
    return config;
  }

  /**
   * Converts the JSON-parsed blob into classified {@link CraftingRecipe}s.
   * @param {any} parsedRecipesBlob The already-parsed JSON blob.
   */
  static parseRecipes(parsedRecipesBlob)
  {
    // a mapping function for classifying the components of the recipe.
    const componentMapper = mappableComponent =>
    {
      const { count, id, type } = mappableComponent;
      const newComponent = new CraftingComponent(count, id, type);
      return newComponent;
    };

    // a mapping function for classifying the recipes of the configuration.
    const recipeMapper = mappableRecipe =>
    {
      // parse all components from the recipe.
      const parsedIngredients = mappableRecipe.ingredients.map(componentMapper, this);
      const parsedTools = mappableRecipe.tools.map(componentMapper, this);
      const parsedOutputs = mappableRecipe.outputs.map(componentMapper, this);

      // create the recipe.
      const newJaftingRecipe = new CraftingRecipe(
        mappableRecipe.name,
        mappableRecipe.key,
        mappableRecipe.categoryKeys,
        mappableRecipe.iconIndex,
        mappableRecipe.description,
        mappableRecipe.unlockedByDefault,
        mappableRecipe.maskedUntilCrafted,
        parsedIngredients,
        parsedTools,
        parsedOutputs);

      return newJaftingRecipe;
    };

    /** @type {CraftingRecipe[]} */
    const jaftingRecipes = parsedRecipesBlob.map(recipeMapper, this);

    // return what we made.
    return jaftingRecipes;
  }

  static parseCategories(parsedCategoriesBlob)
  {
    // a maping function for classify the categories of the configuration.
    const categoryMapper = mappableCategory =>
    {
      const { name, key, iconIndex, description, unlockedByDefault } = mappableCategory;
      const newCategory = new CraftingCategory(name, key, iconIndex, description, unlockedByDefault);
      return newCategory
    };

    // iterate over each category to classify the data.
    const jaftingCategories = parsedCategoriesBlob.map(categoryMapper, this);

    // return what we made.
    return jaftingCategories;
  }

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   *  Extends {@link #postInitialize}.<br>
   *  Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // initialize the other miscellaneous plugin configuration.
    this.initializeMetadata();
  }

  initializeMetadata()
  {
    /**
     * The id of a switch that represents whether or not this system is accessible
     * in the menu.
     * @type {number}
     */
    this.menuSwitchId = parseInt(this.parsedPluginParameters['menuSwitch']);

    /**
     * The name used for the command when visible in a menu.
     * @type {string}
     */
    this.commandName = this.parsedPluginParameters['menuCommandName'] ?? 'Jafting';

    /**
     * The icon used alongside the command's name when visible in the menu.
     * @type {number}
     */
    this.commandIconIndex = parseInt(this.parsedPluginParameters['menuCommandIcon']);
  }
}
//endregion plugin metadata

/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '2.1.3';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.JAFTING = {};

/**
 * A collection of all extensions for JAFTING.
 */
J.JAFTING.EXT = {};

/**
 * A helpful collection of functions for this plugin.
 */
J.JAFTING.Helpers = {};

/**
 * Translates the plugin settings from JSON to JAFTING recipes.
 * @param {JSON} rawRecipeBlobs The raw JSON data representing the recipes.
 * @returns {CraftingRecipe[]}
 */
J.JAFTING.Helpers.translateRecipes = rawRecipeBlobs =>
{
  if (!rawRecipeBlobs)
  {
    return [];
  }

  const parsedRecipeBlobs = JSON.parse(rawRecipeBlobs);
  const parsedRecipes = [];
  parsedRecipeBlobs.forEach(recipeBlob =>
  {
    // get at the high-level recipe data.
    const parsedRecipeBlob = JSON.parse(recipeBlob);

    // parse all ingredients from the recipe.
    const parsedIngredientsBlob = JSON.parse(parsedRecipeBlob.ingredients);
    const parsedIngredients = [];
    parsedIngredientsBlob.forEach(rawIngredient =>
    {
      const parsedIngredient = JSON.parse(rawIngredient);
      const itemId = parseInt(parsedIngredient.itemId);
      const weaponId = parseInt(parsedIngredient.weaponId);
      const armorId = parseInt(parsedIngredient.armorId);
      const quantity = parseInt(parsedIngredient.num);
      if (itemId)
      {
        const newItemIngredient = new CraftingComponent(itemId, `i`, quantity, false);
        parsedIngredients.push(newItemIngredient);
      }
      if (weaponId)
      {
        const newWeaponIngredient = new CraftingComponent(weaponId, `w`, quantity, false);
        parsedIngredients.push(newWeaponIngredient);
      }
      if (armorId)
      {
        const newArmorIngredient = new CraftingComponent(armorId, `a`, quantity, false);
        parsedIngredients.push(newArmorIngredient);
      }
    });

    // parse all tools from the recipe.
    const parsedToolsBlob = JSON.parse(parsedRecipeBlob.tools);
    const parsedTools = [];
    parsedToolsBlob.forEach(rawTool =>
    {
      const parsedTool = JSON.parse(rawTool);
      const itemId = parseInt(parsedTool.itemId);
      const weaponId = parseInt(parsedTool.weaponId);
      const armorId = parseInt(parsedTool.armorId);
      const quantity = parseInt(parsedTool.num);
      if (itemId)
      {
        const newItemTool = new CraftingComponent(itemId, `i`, quantity, false);
        parsedTools.push(newItemTool);
      }
      if (weaponId)
      {
        const newWeaponTool = new CraftingComponent(weaponId, `w`, quantity, false);
        parsedTools.push(newWeaponTool);
      }
      if (armorId)
      {
        const newArmorTool = new CraftingComponent(armorId, `a`, quantity, false);
        parsedTools.push(newArmorTool);
      }
    });

    // parse all output from the recipe.
    const parsedOutputBlob = JSON.parse(parsedRecipeBlob.output);
    const parsedOutputs = [];
    parsedOutputBlob.forEach(rawOutput =>
    {
      const parsedOutput = JSON.parse(rawOutput);
      const itemId = parseInt(parsedOutput.itemId);
      const weaponId = parseInt(parsedOutput.weaponId);
      const armorId = parseInt(parsedOutput.armorId);
      const quantity = parseInt(parsedOutput.num);
      if (itemId)
      {
        const newItemOutput = new CraftingComponent(itemId, `i`, quantity, false);
        parsedOutputs.push(newItemOutput);
      }
      if (weaponId)
      {
        const newWeaponOutput = new CraftingComponent(weaponId, `w`, quantity, false);
        parsedOutputs.push(newWeaponOutput);
      }
      if (armorId)
      {
        const newArmorOutput = new CraftingComponent(armorId, `a`, quantity, false);
        parsedOutputs.push(newArmorOutput);
      }
    });

    // parse recipe metadata.
    const parsedDescription = parsedRecipeBlob.description;
    const parsedIconIndex = parseInt(parsedRecipeBlob.iconIndex)
      ? parseInt(parsedRecipeBlob.iconIndex)
      : -1;
    const parsedCategoryKeys = JSON.parse(parsedRecipeBlob.categoryKeys);

    // create and add JAFTING recipe.
    const parsedRecipe = new CraftingRecipe(
      parsedRecipeBlob.name,
      parsedRecipeBlob.recipeKey,
      parsedDescription,
      parsedCategoryKeys,
      parsedIconIndex,
      parsedTools,
      parsedIngredients,
      parsedOutputs,
      (parsedRecipeBlob.maskedUntilCrafted === 'true')
    );
    parsedRecipes.push(parsedRecipe);
  });

  return parsedRecipes;
};

/**
 * Translates the plugin settings from JSON to JAFTING categories.
 * @param {string} rawCategoryBlobs The raw JSON data representing the categories.
 * @returns {CraftingCategory[]}
 */
J.JAFTING.Helpers.translateCategories = rawCategoryBlobs =>
{
  if (!rawCategoryBlobs)
  {
    return [];
  }

  const parsedCategoryBlobs = JSON.parse(rawCategoryBlobs);
  const parsedCategories = [];
  parsedCategoryBlobs.forEach(categoryBlob =>
  {
    const parsedCategoryBlob = JSON.parse(categoryBlob);
    const parsedCategory = new CraftingCategory(
      parsedCategoryBlob.name,
      parsedCategoryBlob.key,
      parseInt(parsedCategoryBlob.iconIndex),
      parsedCategoryBlob.description
    );
    parsedCategories.push(parsedCategory);
  });

  return parsedCategories;
};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.JAFTING.Metadata = new J_CraftingPluginMetadata('J-JAFTING', '2.0.0');
J.JAFTING.Metadata.Name = `J-JAFTING`;
J.JAFTING.Metadata.Version = '2.0.0';

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.JAFTING.PluginParameters = PluginManager.parameters(J.JAFTING.Metadata.Name);

/**
 * All recipes defined in the plugin settings that can be JAFTED.
 */
J.JAFTING.Metadata.Recipes = [];

/**
 * All categories defined in the plugin settings that can contain JAFTING recipes.
 */
J.JAFTING.Metadata.Categories = [];

/**
 * A helpful mapping of all the various RMMZ classes being extended.
 */
J.JAFTING.Aliased = {
  DataManager: {},
  Game_Party: new Map(),
  Game_Player: {},
  Game_System: new Map(),
  Scene_Map: {},
};

//region plugin commands
/**
 * Plugin command for calling forth the JAFTING menu and all its windowy glory.
 */
PluginManager.registerCommand(J.JAFTING.Metadata.Name, "Call Jafting Menu", () =>
{
  $gameSystem.startJafting();
});

/**
 * Plugin command for ending the current JAFTING session.
 */
PluginManager.registerCommand(J.JAFTING.Metadata.Name, "Close Jafting Menu", () =>
{
  $gameSystem.endJafting();
});

/**
 * Plugin command for unlocking a JAFTING category (such as cooking or blacksmithing).
 */
PluginManager.registerCommand(J.JAFTING.Metadata.Name, "Unlock Category", args =>
{
  const {categoryKeys} = args;

  const parsedCategoryKeys = JSON.parse(categoryKeys);
  parsedCategoryKeys.forEach(parsedCategoryKey => $gameSystem.unlockCategory(parsedCategoryKey));
});

/**
 * Plugin command for unlocking any recipes that output only this item (or other unlocked items).
 */
PluginManager.registerCommand(J.JAFTING.Metadata.Name, "Unlock Recipe", args =>
{
  const {recipeKeys} = args;

  const parsedRecipeKeys = JSON.parse(recipeKeys);
  parsedRecipeKeys.forEach(parsedRecipeKey => $gameSystem.unlockRecipe(parsedRecipeKey));
});

/**
 * Plugin command for locking a JAFTING category (such as cooking or blacksmithing).
 */
PluginManager.registerCommand(J.JAFTING.Metadata.Name, "Lock Category", args =>
{
  const {key} = args;
  $gameSystem.lockCategory(key);
});

/**
 * Plugin command for locking all JAFTING categories.
 */
PluginManager.registerCommand(J.JAFTING.Metadata.Name, "Lock All Categories", () =>
{
  $gameSystem.lockAllCategories();
});
//endregion plugin commands
//endregion Introduction

//region DataManager
/**
 * Extends the save data extraction to include any changes in recipes/categories
 * from the plugin settings.
 */
J.JAFTING.Aliased.DataManager.extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents)
{
  // grab the latest data from the plugin parameters for jafting.
  const fromPluginParamsRecipes =
    J.JAFTING.Helpers.translateRecipes(J.JAFTING.PluginParameters['JAFTINGrecipes']);
  const fromPluginParamsCategories =
    J.JAFTING.Helpers.translateCategories(J.JAFTING.PluginParameters['JAFTINGcategories']);

  // pull out the jafting data from the save file.
  const fromSaveFileJafting = contents.system._j._jafting;

  // iterate over the save file recipes.
  fromSaveFileJafting._recipes.forEach(savedRecipe =>
  {
    // grab the recipe from our plugin parameter data.
    const updatedRecipe = fromPluginParamsRecipes
      .find(settingsRecipe => settingsRecipe.key === savedRecipe.key);

    // if the recipe no longer exists, don't do anything with it.
    if (!updatedRecipe) return;

    // if it was unlocked before, it stays unlocked.
    if (savedRecipe.isUnlocked()) updatedRecipe.unlock();

    // if it was crafted before, it stays crafted.
    if (savedRecipe.hasBeenCrafted()) updatedRecipe.setCrafted();
  });

  // iterate over all categories from the save file and update the unlock status of each.
  fromSaveFileJafting._categories.forEach(savedCategory =>
  {
    // grab the category from our plugin parameter data.
    const updatedCategory = fromPluginParamsCategories
      .find(settingsCategory => settingsCategory.key === savedCategory.key);

    // if the category no longer exists, don't do anything with it.
    if (!updatedCategory) return;

    // if it was unlocked before, it stays unlocked.
    if (savedCategory.isUnlocked()) updatedCategory.unlock();
  });

  // update the save file data with the modified plugin settings JAFTING data.
  contents.system._j._jafting._recipes = fromPluginParamsRecipes;
  contents.system._j._jafting._categories = fromPluginParamsCategories;
  J.JAFTING.Aliased.DataManager.extractSaveContents.call(this, contents);
};
//endregion DataManager

//region Game_Player
/**
 * Extends the canMove function to ensure the player can't move around while
 * in the JAFTING menu.
 */
J.JAFTING.Aliased.Game_Player.canMove = Game_Player.prototype.canMove;
Game_Player.prototype.canMove = function()
{
  if ($gameSystem.isJafting())
  {
    return false;
  }
  else
  {
    return J.JAFTING.Aliased.Game_Player.canMove.call(this);
  }
};
//endregion Game_Player

//region Game_System
/**
 * Extends the `Game_System.initialize()` to include the JAFTING setup.
 */
J.JAFTING.Aliased.Game_System.initialize = Game_System.prototype.initialize;
Game_System.prototype.initialize = function()
{
  // perform original logic.
  J.JAFTING.Aliased.Game_System.initialize.call(this);

  // initialize the members.
  this.initJaftingMembers();
};

/**
 * Initializes the JAFTING object for tracking various things related to the system.
 */
Game_System.prototype.initJaftingMembers = function()
{
  /**
   * The over-arching object that contains all properties for this plugin.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the JAFTING system.
   */
  this._j._jafting ||= {};

  /**
   * Whether or not the JAFTING flow is executing.
   * @type {boolean}
   */
  this._j._jafting._isJafting = false;

  /**
   * The collection of all jafting recipes extracted from the database.
   * @type {CraftingRecipe[]}
   */
  this._j._jafting._recipes = J.JAFTING.Helpers.translateRecipes(J.JAFTING.PluginParameters['JAFTINGrecipes']);

  /**
   * The collection of all categories that are viewable within the JAFTING menu.
   * @type {CraftingCategory[]}
   */
  this._j._jafting._categories = J.JAFTING.Helpers.translateCategories(J.JAFTING.PluginParameters['JAFTINGcategories']);

  /**
   * A request to refresh the windows of JAFTING.
   * @type {boolean}
   */
  this._j._jafting._requestRefresh = false;
};

/**
 * Updates the list of all available JAFTING recipes from the latest plugin metadata.
 */
J.JAFTING.Aliased.Game_System.set('onAfterLoad', Game_System.prototype.onAfterLoad);
Game_System.prototype.onAfterLoad = function()
{
  // perform original logic.
  J.JAFTING.Aliased.Game_System.get('onAfterLoad').call(this);

  // update the recipes from the latest plugin metadata.
  this.updateRecipesFromPluginMetadata();

  // update the recipes from the latest plugin metadata.
  this.updateCategoriesFromPluginMetadata();
};

/**
 * Updates the recipe list from the latest plugin metadata.
 */
Game_System.prototype.updateRecipesFromPluginMetadata = function()
{
  // refresh the recipes list from the plugin metadata.
  this._j._jafting._recipes ??=
    J.JAFTING.Helpers.translateRecipes(J.JAFTING.PluginParameters['JAFTINGrecipes']);
};

/**
 * Updates the category list from the latest plugin metadata.
 */
Game_System.prototype.updateCategoriesFromPluginMetadata = function()
{
  // refresh the categories list from the plugin metadata.
  this._j._jafting._categories ??=
    J.JAFTING.Helpers.translateCategories(J.JAFTING.PluginParameters['JAFTINGcategories']);
};

/**
 * Summons the JAFTING menu.
 */
Game_System.prototype.startJafting = function()
{
  this._j._jafting._isJafting = true;
};

/**
 * Closes the JAFTING menu.
 */
Game_System.prototype.endJafting = function()
{
  this._j._jafting._isJafting = false;
};

/**
 * Gets whether or not the player is currently using the JAFTING menu.
 * @returns {boolean}
 */
Game_System.prototype.isJafting = function()
{
  return this._j._jafting._isJafting;
};

/**
 * Gets the category of crafting by key.
 * @param {string} key The unique identifier of a category of crafting.
 * @returns {CraftingCategory|null}
 */
Game_System.prototype.getCategoryByKey = function(key)
{
  const result = this._j._jafting._categories.find(category => category.key === key);
  return result;
};

/**
 * Unlocks/adds a new category to the list of available categories.
 * @param {string} key The unique identifier of this category.
 */
Game_System.prototype.unlockCategory = function(key)
{
  const foundCategory = this._j._jafting._categories.find(category => category.key === key);
  if (foundCategory)
  {
    foundCategory.unlock();
    this.setRefreshRequest(true);
  }
  else
  {
    console.warn(`Attempted to unlock a category that doesn't exist in the plugin parameters.`);
    console.warn(`Please add a category with key of [${key}] to unlock it.`);
  }
};

/**
 * Unlocks all categories of JAFTING.
 */
Game_System.prototype.unlockAllCategories = function()
{
  this._j._jafting._categories.forEach(category => category.unlock());
  this.setRefreshRequest(true);
};

/**
 * Locks/removes a previously unlocked category of JAFTING.
 * @param {string} key The unique identifier of this category.
 */
Game_System.prototype.lockCategory = function(key)
{
  const foundCategory = this._j._jafting._categories.find(category => category.key === key);
  if (foundCategory)
  {
    foundCategory.lock();
    this.setRefreshRequest(true);
  }
};

/**
 * Locks all categories of JAFTING.
 */
Game_System.prototype.lockAllCategories = function()
{
  this._j._jafting._categories.forEach(category => category.lock());
  this.setRefreshRequest(true);
};

/**
 * Unlocks a recipe. Does not unlock the category this recipe belongs to.
 * @param {string} key The key of the recipe to unlock.
 */
Game_System.prototype.unlockRecipe = function(key)
{
  const foundRecipe = this._j._jafting._recipes.find(recipe => recipe.key === key);
  if (foundRecipe)
  {
    foundRecipe.unlock();
    this.setRefreshRequest(true);
  }
};

/**
 * Locks a recipe. Does not lock the category this recipe belongs to.
 * @param {string} key The key of the recipe to unlock.
 */
Game_System.prototype.lockRecipe = function(key)
{
  const foundRecipe = this._j._jafting._recipes.find(recipe => recipe.key === key);
  if (foundRecipe)
  {
    foundRecipe.lock();
    this.setRefreshRequest(true);
  }
};

/**
 * Locks all recipes of JAFTING.
 */
Game_System.prototype.lockAllRecipes = function()
{
  this._j._jafting._recipes.forEach(recipe => recipe.lock());
  this.setRefreshRequest(true);
};

/**
 * Gets all defined JAFTING recipes.
 * @returns {CraftingRecipe[]}
 */
Game_System.prototype.getAllRecipes = function()
{
  return this._j._jafting._recipes;
};

/**
 * Gets a list of all categories that have been unlocked.
 * @returns {CraftingCategory[]}
 */
Game_System.prototype.getUnlockedCategories = function()
{
  return this._j._jafting._categories.filter(category => category.isUnlocked());
};

/**
 * Gets whether or not we have an outstanding request to refresh all JAFTING windows.
 * @returns {boolean} True if we need to refresh the windows, false otherwise.
 */
Game_System.prototype.isRefreshRequested = function()
{
  return this._j._jafting._requestRefresh;
};

/**
 * Issues a request to refresh all JAFTING windows.
 * @param {boolean} requested True if we need to refresh the windows, false otherwise.
 */
Game_System.prototype.setRefreshRequest = function(requested = true)
{
  this._j._jafting._requestRefresh = requested;
};

/**
 * For a recipe to be available for crafting/unlocked, the player must have
 * all outputs of a recipe unlocked.
 * @returns {CraftingRecipe[]}
 */
Game_System.prototype.getUnlockedRecipes = function()
{
  return this._j._jafting._recipes.filter(recipe => recipe.isUnlocked());
};

/**
 * Gets all unlocked recipes that are a part of a given category.
 * @param {string} categoryKey The category to get all unlocked recipes for.
 * @returns {CraftingRecipe[]}
 */
Game_System.prototype.getUnlockedRecipesByCategory = function(categoryKey)
{
  const recipes = this.getUnlockedRecipes();
  const unlocked = recipes.filter(recipe => recipe.categoryKeys.includes(categoryKey));

  return unlocked;
};

/**
 * Gets all unlocked recipes that are a part of a given category that have
 * also been crafted at least once.
 * @param {string} categoryKey The category to get all unlocked recipes for.
 * @returns {CraftingRecipe[]}
 */
Game_System.prototype.getCraftedRecipesByCategory = function(categoryKey)
{
  // get all unlocked recipes of a given category.
  const unlocked = this.getUnlockedRecipesByCategory(categoryKey);

  // check to make sure we have at least one before
  if (unlocked.length)
  {
    // a filtering function to determine what is available.
    const craftedRecipes = unlocked.filter(recipe => recipe.crafted);

    // return what we found.
    return craftedRecipes;
  }

  console.warn("no recipes have yet been crafted.")
  return [];
};

/**
 * Gets the number of recipes that have been crafted in a particular category.
 * @param {string} categoryKey The category key to search through.
 * @returns {number} The number of recipes that have been crafted.
 */
Game_System.prototype.getCraftedRecipesCountByCategory = function(categoryKey)
{
  return this.getCraftedRecipesByCategory(categoryKey).length;
};

/**
 * Gets a specific recipe by its key.
 * @param {string} recipeKey The key of the recipe to find.
 * @returns {CraftingRecipe|null} The found recipe, or null if it wasn't found.
 */
Game_System.prototype.getRecipe = function(recipeKey)
{
  // grab all the recipes agailable.
  const recipes = this.getAllRecipes();

  // if we don't have any recipes, then always null.
  if (!recipes.length) return null;

  // find the recipe by its key.
  const foundRecipe = recipes.find(recipe => recipe.key === recipeKey);

  // normalize the return value to null rather than undefined if necessary.
  return foundRecipe ?? null;
};

/**
 * Translates an unidentified RPG::Item into it's item type abbreviation.
 * @param {object} rpgItem The RPG::Item that needs it's type determined.
 * @returns {string} One of: `i`, `w`, `a` for `item`, `weapon`, `armor`.
 */
Game_System.prototype.translateRpgItemToType = function(rpgItem)
{
  if (rpgItem.itypeId)
  {
    return "i";
  }
  else if (rpgItem.wtypeId)
  {
    return "w";
  }
  else if (rpgItem.atypeId)
  {
    return "a";
  }
  else
  {
    console.error(rpgItem);
    console.error(`check the logs, there were issues translating items for recipes.`)
  }
};
//endregion Game_System

//region Scene_Jafting
class Scene_Jafting extends Scene_MenuBase
{
  /**
   * Pushes this current scene onto the stack, forcing it into action.
   */
  static callScene()
  {
    SceneManager.push(this);
  }

  /**
   * Constructor.
   */
  constructor()
  {
    // call super when having extended constructors.
    super();

    // jumpstart initialization on creation.
    this.initialize();
  }

  //region init
  /**
   * Initialize all properties for our omnipedia.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    // initialize the root-namespace definition members.
    this.initCoreMembers();

    // initialize the main omnipedia base list of pedias.
    this.initPrimaryMembers();
  }

  /**
   * The core properties of this scene are the root namespace definitions for this plugin.
   */
  initCoreMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with the omnipedia.
     */
    this._j._crafting = {};
  }

  /**
   * The primary properties of the scene are the initial properties associated with
   * the main list containing all pedias unlocked by the player along with some subtext of
   * what the pedia entails.
   */
  initPrimaryMembers()
  {
    /**
     * The window that shows the list of available pedias.
     * @type {Window_JaftingList}
     */
    this._j._crafting._commandList = null;

    /**
     * The window that displays at the top while the omnipedia list is active.
     * @type {Window_JaftingListHeader}
     */
    this._j._crafting._listHeader = null;
  }
  //endregion init

  //region create
  /**
   * Initialize all resources required for this scene.
   */
  create()
  {
    // perform original logic.
    super.create();

    // create the various display objects on the screen.
    this.createDisplayObjects();
  }

  /**
   * Creates the display objects for this scene.
   */
  createDisplayObjects()
  {
    // create all our windows.
    this.createAllWindows();
  }

  /**
   * Creates all windows associated with this scene.
   */
  createAllWindows()
  {
    // create all root windows for the main listing.
    this.createJaftingRootWindows();
  }
  //endregion create

  //region windows
  /**
   * Creates the root-level omnipedia windows.
   */
  createJaftingRootWindows()
  {
    // create the root omnipedia list of pedias.
    this.createJaftingListWindow();

    // create the header window.
    this.createJaftingListHeaderWindow();
  }

  //region header window
  /**
   * Creates a header window for the omnipedia list.
   */
  createJaftingListHeaderWindow()
  {
    // create the window.
    const window = this.buildJaftingListHeaderWindow();

    // update the tracker with the new window.
    this.setJaftingListHeaderWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the omnipedia list header window.
   * @returns {Window_JaftingListHeader}
   */
  buildJaftingListHeaderWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.jaftingListHeaderRectangle();

    // create the window with the rectangle.
    const window = new Window_JaftingListHeader(rectangle);

    window.refresh();

    // return the built and configured omnipedia list window.
    return window;
  }

  /**
   * Gets the rectangle associated with the omnipedia list header window.
   * @returns {Rectangle}
   */
  jaftingListHeaderRectangle()
  {
    // define the width of the list.
    const width = 1000;

    // determine the x based on the width.
    const x = (Graphics.boxWidth / 2) - (width * 0.5);

    // define the height of the rectangle.
    const height = 100;

    // arbitrarily decide the y.
    const y = 100;

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked omnipedia list header window.
   * @returns {Window_JaftingListHeader}
   */
  getJaftingListHeaderWindow()
  {
    return this._j._crafting._listHeader;
  }

  /**
   * Set the currently tracked omnipedia list header window to the given window.
   * @param {Window_JaftingListHeader} listHeaderWindow The omnipedia list header window to track.
   */
  setJaftingListHeaderWindow(listHeaderWindow)
  {
    this._j._crafting._listHeader = listHeaderWindow;
  }

  /**
   * Opens the root header window.
   */
  openRootHeaderWindow()
  {
    // grab the root header window.
    const rootHeaderWindow = this.getJaftingListHeaderWindow();

    // open and show the root header window.
    rootHeaderWindow.open();
    rootHeaderWindow.show();
  }

  /**
   * Closes the root header window.
   */
  closeRootHeaderWindow()
  {
    // grab the root header window.
    const rootHeaderWindow = this.getJaftingListHeaderWindow();

    // close and hide the root header window.
    rootHeaderWindow.close();
    rootHeaderWindow.hide();
  }
  //endregion header window

  //region list window
  /**
   * Creates the list of pedias available to the player to peruse.
   */
  createJaftingListWindow()
  {
    // create the window.
    const window = this.buildJaftingListWindow();

    // update the tracker with the new window.
    this.setJaftingListWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Sets up and defines the omnipedia listing window.
   * @returns {Window_JaftingList}
   */
  buildJaftingListWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.jaftingListRectangle();

    // create the window with the rectangle.
    const window = new Window_JaftingList(rectangle);

    // assign cancel functionality.
    window.setHandler('cancel', this.popScene.bind(this));

    // assign on-select functionality.
    window.setHandler('ok', this.onRootJaftingSelection.bind(this));

    // return the built and configured omnipedia list window.
    return window;
  }

  /**
   * Gets the rectangle associated with the omnipedia list command window.
   * @returns {Rectangle}
   */
  jaftingListRectangle()
  {
    // define the width of the list.
    const width = 800;

    // calculate the X for where the origin of the list window should be.
    const x = (Graphics.boxWidth / 2) - (width * 0.5);

    // define the height of the list.
    const height = 240;

    // calculate the Y for where the origin of the list window should be.
    const y = (Graphics.boxHeight / 2) - (height * 0.5);

    // build the rectangle to return.
    return new Rectangle(x, y, width, height);
  }

  /**
   * Gets the currently tracked omnipedia list window.
   * @returns {Window_JaftingList}
   */
  getJaftingListWindow()
  {
    return this._j._crafting._commandList;
  }

  /**
   * Set the currently tracked omnipedia list window to the given window.
   * @param {Window_JaftingList} listWindow The omnipedia list window to track.
   */
  setJaftingListWindow(listWindow)
  {
    this._j._crafting._commandList = listWindow;
  }

  /**
   * Opens the root list window and activates it.
   */
  openRootListWindow()
  {
    // grab the root omnipedia list window.
    const rootListWindow = this.getJaftingListWindow();

    // open, show, and activate the root list window.
    rootListWindow.open();
    rootListWindow.show();
    rootListWindow.activate();
  }

  /**
   * Closes the root list window.
   */
  closeRootListWindow()
  {
    // grab the root omnipedia list window.
    const rootListWindow = this.getJaftingListWindow();

    // close and deactivate the root list window.
    rootListWindow.close();
    rootListWindow.deactivate();
  }

  /**
   * Gets the current symbol of the root omnipedia.
   * This is effectively the currently highlighted selection's key of that window.
   * @returns {string}
   */
  getRootJaftingKey()
  {
    return this.getJaftingListWindow().currentSymbol();
  }
  //endregion list window

  /**
   * Opens all windows associated with the root omnipedia.
   */
  openRootJaftingWindows()
  {
    // open the root list window.
    this.openRootListWindow();

    // open the root header window.
    this.openRootHeaderWindow();
  }

  /**
   * Closes all windows associated with the root omnipedia.
   */
  closeRootJaftingWindows()
  {
    // close the list window.
    this.closeRootListWindow();

    // close the header window.
    this.closeRootHeaderWindow();
  }
  //endregion windows

  //region actions
  //region root actions
  /**
   * When a jafting choice is made, execute this logic.
   * This is only implemented/extended by the jafting types.
   */
  onRootJaftingSelection()
  {
    console.debug(`selected "${this.getRootJaftingKey()}" option.`);
  }
  //endregion root actions
  //endregion actions
}
//endregion Scene_Jafting

//region Scene_Map
/**
 * Hooks into the `Scene_Map.initialize` function and adds the JAFTING objects for tracking.
 */
J.JAFTING.Aliased.Scene_Map.initialize = Scene_Map.prototype.initialize;
Scene_Map.prototype.initialize = function()
{
  J.JAFTING.Aliased.Scene_Map.initialize.call(this);
  this._j = this._j || {};
  // this.initJaftingMenu();
};

/**
 * Initializes all JAFTING components.
 */
Scene_Map.prototype.initJaftingMenu = function()
{
  this._j._jaftingMenu = {
    // shared properties and windows
    _windowFocus: null,
    _jaftingMode: null,
    _helpWindow: null,
    _modeWindow: null, // craft, free, refine
    _categoryWindow: null, // the various types
    _currentCategory: null,
    _currentRecipe: null,
    _confirmationWindow: null,
    _resultsWindow: null,

    // for crafting mode
    _recipeListWindow: null,
    _projectedCraftingResultWindow: null,
    _ingredientsRequiredWindow: null,
    _craftCostWindow: null,

    // for free mode
    _inventoryWindow: null,
    _freeMixDetailsWindow: null,
  };
};

/**
 * Create the Hud with all the rest of the windows.
 */
J.JAFTING.Aliased.Scene_Map.createAllWindows = Scene_Map.prototype.createAllWindows;
Scene_Map.prototype.createAllWindows = function()
{
  J.JAFTING.Aliased.Scene_Map.createAllWindows.call(this);
  // this.createJaftingMenu();
};

/**
 * Creates all JAFTING windows associated with each mode of crafting.
 */
Scene_Map.prototype.createJaftingMenu = function()
{
  this.createJaftingSharedWindows();
  this.createJaftingCraftModeWindows();
  this.createJaftingFreeModeWindows();
};

/**
 * Creates all JAFTING windows that are shared between the different modes.
 */
Scene_Map.prototype.createJaftingSharedWindows = function()
{
  this.createJaftingHelpWindow();
  this.createJaftingModeWindow();
  this.createJaftingCategoryWindow();
};

/**
 * Creates the help window used throughout all of the JAFTING menu.
 */
Scene_Map.prototype.createJaftingHelpWindow = function()
{
  const w = Graphics.boxWidth;
  const h = 100;
  const x = 0;
  const y = 0;
  const rect = new Rectangle(x, y, w, h);
  const wind = new Window_Help(rect);
  this._j._jaftingMenu._helpWindow = wind;
  this._j._jaftingMenu._helpWindow.close();
  this._j._jaftingMenu._helpWindow.hide();
  this.addWindow(this._j._jaftingMenu._helpWindow);
};

/**
 * Creates the mode selection window used to determine which type of JAFTING
 * that the player will perform.
 */
Scene_Map.prototype.createJaftingModeWindow = function()
{
  const w = 800;
  const h = 68;
  const x = 0;
  const y = Graphics.boxHeight - h;
  const rect = new Rectangle(x, y, w, h);
  const wind = new Window_JaftingModeMenu(rect);
  wind.setHandler('cancel', this.closeJaftingMenu.bind(this));
  wind.setHandler('craft-mode', this.chooseJaftingCraftMode.bind(this));
  wind.setHandler('free-mode', this.chooseJaftingFreeMode.bind(this));
  this._j._jaftingMenu._modeWindow = wind;
  this._j._jaftingMenu._modeWindow.close();
  this._j._jaftingMenu._modeWindow.hide();
  this.addWindow(this._j._jaftingMenu._modeWindow);
};

/**
 * Creates the category selection window used to determine which category of
 * craft-mode or free-mode
 */
Scene_Map.prototype.createJaftingCategoryWindow = function()
{
  const w = 350;
  const h = Graphics.height - this._j._jaftingMenu._helpWindow.height - 60;
  const x = 0;
  const y = this._j._jaftingMenu._helpWindow.height;
  const rect = new Rectangle(x, y, w, h);
  const wind = new Window_JaftingCraftCategory(rect);
  wind.setHandler('cancel', this.closeJaftingWindow.bind(this, "category"));
  wind.setHandler('crafting-category', this.chooseJaftingCraftRecipe.bind(this));
  this._j._jaftingMenu._categoryWindow = wind;
  this._j._jaftingMenu._categoryWindow.close();
  this._j._jaftingMenu._categoryWindow.hide();
  this.addWindow(this._j._jaftingMenu._categoryWindow);
};

Scene_Map.prototype.createJaftingCraftModeWindows = function()
{
  this.createJaftingCraftRecipeListWindow();
  this.createJaftingCraftRecipeDetailsWindow();
};

/**
 * Creates the window containing the list of recipes available for crafting.
 */
Scene_Map.prototype.createJaftingCraftRecipeListWindow = function()
{
  const w = 350;
  const h = Graphics.height - this._j._jaftingMenu._helpWindow.height - 60;
  const x = 0;
  const y = this._j._jaftingMenu._helpWindow.height;
  const rect = new Rectangle(x, y, w, h);
  const wind = new Window_JaftingCraftRecipeList(rect);
  wind.setHandler('cancel', this.closeJaftingWindow.bind(this, "craft-recipes-list"));
  wind.setHandler('ok', this.confirmSelectedRecipe.bind(this));
  this._j._jaftingMenu._recipeListWindow = wind;
  this._j._jaftingMenu._recipeListWindow.close();
  this._j._jaftingMenu._recipeListWindow.hide();
  this.addWindow(this._j._jaftingMenu._recipeListWindow);
};

/**
 * Creates the window containing the recipe details, such as ingredients and tools required
 * and the items it will output on crafting the recipe.
 */
Scene_Map.prototype.createJaftingCraftRecipeDetailsWindow = function()
{
  const w = this._j._jaftingMenu._helpWindow.width - this._j._jaftingMenu._recipeListWindow.width;
  const h = Graphics.height - this._j._jaftingMenu._helpWindow.height - 60;
  const x = this._j._jaftingMenu._recipeListWindow.width;
  const y = this._j._jaftingMenu._helpWindow.height;
  const rect = new Rectangle(x, y, w, h);
  const wind = new Window_JaftingCraftRecipeDetails(rect);
  this._j._jaftingMenu._ingredientsRequiredWindow = wind;
  this._j._jaftingMenu._ingredientsRequiredWindow.close();
  this._j._jaftingMenu._ingredientsRequiredWindow.hide();
  this.addWindow(this._j._jaftingMenu._ingredientsRequiredWindow);
};

/**
 * The actions to perform when selecting the "crafting" mode.
 * Opens up the category window to choose a category to look at recipes for.
 */
Scene_Map.prototype.chooseJaftingCraftMode = function()
{
  this.setWindowFocus("craft-mode");
};

/**
 * The actions to perform when selecting the "freestyle" mode.
 * Opens up the items-only window for picking a base item to freestyle off of.
 */
Scene_Map.prototype.chooseJaftingFreeMode = function()
{
  throw new Error("Free mode is not implemented in this version.");
};

/**
 * The actions to perform when a category is selected.
 * Opens the recipe list for a given category.
 */
Scene_Map.prototype.chooseJaftingCraftRecipe = function()
{
  const category = this.getCurrentCategory();

  this.setWindowFocus("craft-recipes-list");
  this._j._jaftingMenu._recipeListWindow.currentCategory = category;
};

/**
 * The actions to perform when a recipe is selected.
 * Crafts the designated recipe.
 */
Scene_Map.prototype.confirmSelectedRecipe = function()
{
  SoundManager.playShop();
  this.jaftRecipe();
};

/**
 * Forces the player to gain all items of the given recipe's output.
 */
Scene_Map.prototype.jaftRecipe = function()
{
  const recipe = this.getCurrentRecipe();
  recipe.craft();
};

Scene_Map.prototype.createJaftingFreeModeWindows = function()
{
  //this._j._jaftingMenu._inventoryWindow = null;
  //this._j._jaftingMenu._freeMixDetailsWindow = null;
};

/**
 * Extends the `Scene_Map.update()` to include updating these windows as well.
 */
J.JAFTING.Aliased.Scene_Map.update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function()
{
  J.JAFTING.Aliased.Scene_Map.update.call(this);

  // if ($gameSystem.isRefreshRequested())
  // {
  //   this.refreshJafting();
  // }
  //
  // if ($gameSystem.isJafting())
  // {
  //   this.manageJaftingMenu();
  // }
  // else
  // {
  //   this.hideAllJaftingWindows();
  // }
};

/**
 * Refreshes all windows that could possibly require refreshing when requested.
 * As an example, if the player gains/loses an item, all windows will need refreshing
 * to reflect the change in quantity.
 */
Scene_Map.prototype.refreshJafting = function()
{
  $gameSystem.setRefreshRequest(false);
  this._j._jaftingMenu._recipeListWindow.refresh();
  this._j._jaftingMenu._ingredientsRequiredWindow.refresh();
  this._j._jaftingMenu._categoryWindow.refresh();
  this.setRecipeDescription();
};

/**
 * Sets the currently focused/activated window to be a given part of the flow.
 * @param {string} newFocus The new window flow to focus on.
 */
Scene_Map.prototype.setWindowFocus = function(newFocus)
{
  this._j._jaftingMenu._windowFocus = newFocus;
};

/**
 * Gets the current window being focused.
 * @returns {string}
 */
Scene_Map.prototype.getWindowFocus = function()
{
  return this._j._jaftingMenu._windowFocus;
};

/**
 * Sets the category currently selected.
 * @param {string} category The currently selected category.
 */
Scene_Map.prototype.setCurrentCategory = function(category)
{
  this._j._jaftingMenu._currentCategory = category;
};

/**
 * Gets the currently selected category.
 * @returns {string} The currently selected category.
 */
Scene_Map.prototype.getCurrentCategory = function()
{
  return this._j._jaftingMenu._currentCategory;
};

/**
 * Sets the currently selected recipe.
 * @param {string} recipe The currently selected recipe.
 */
Scene_Map.prototype.setCurrentRecipe = function(recipe)
{
  this._j._jaftingMenu._currentRecipe = recipe;
};

/**
 * Gets the currently selected recipe.
 * @returns {string} The currently selected recipe.
 */
Scene_Map.prototype.getCurrentRecipe = function()
{
  return this._j._jaftingMenu._currentRecipe;
};

/**
 * Manages window focus within the JAFTING menus.
 * Compare with `Scene_Map.prototype.closeJaftingWindow` to know what close.
 */
Scene_Map.prototype.manageJaftingMenu = function()
{
  switch (this.getWindowFocus())
  {
    case "main":
      this.toggleJaftingHelpWindow(true);
      this.toggleJaftingModeWindow(true);
      this.determineModeHelpWindowText();
      break;
    case "craft-mode":
      this.toggleJaftingModeWindow(false);
      this.toggleJaftingCraftTypeWindow(true);
      this.determineCategoryHelpWindowText();
      break;
    case "craft-recipes-list":
      this.toggleJaftingCraftTypeWindow(false);
      this.toggleJaftingRecipeListWindow(true);
      this.toggleJaftingRecipeDetailsWindow(true);
      this.determineRecipeHelpWindowText();
      break;
    case "free-mode":
      // open up item selection list to free-style off of.
      break;
    case "refine-mode":
      // open up weapon/armor selection list to pick primary gear.
      break;
    case "refine-secondary":
      // open up an all item/weapon/armor selection list to pick secondary.
      break;
    case "results":
      break;
    case null:
      this.setWindowFocus("main");
      break;
  }
};

/**
 * Toggles the visibility for the help window in the JAFTING menu.
 * @param {boolean} visible Whether or not to show this window.
 */
Scene_Map.prototype.toggleJaftingHelpWindow = function(visible)
{
  if (visible)
  {
    this._j._jaftingMenu._helpWindow.show();
    this._j._jaftingMenu._helpWindow.open();
  }
  else
  {
    this._j._jaftingMenu._helpWindow.close();
    this._j._jaftingMenu._helpWindow.hide();
  }
};

/**
 * Toggles the visibility for the mode selection window in the JAFTING menu.
 * @param {boolean} visible Whether or not to show this window.
 */
Scene_Map.prototype.toggleJaftingModeWindow = function(visible)
{
  if (visible)
  {
    this._j._jaftingMenu._modeWindow.show();
    this._j._jaftingMenu._modeWindow.open();
    this._j._jaftingMenu._modeWindow.activate();
  }
  else
  {
    this._j._jaftingMenu._modeWindow.close();
    this._j._jaftingMenu._modeWindow.hide();
    this._j._jaftingMenu._modeWindow.deactivate();
    this._j._jaftingMenu._modeWindow.select(0);
  }
};

/**
 * Toggles the visibility for the type selection window in the JAFTING menu
 * for the craft mode.
 * @param {boolean} visible Whether or not to show this window.
 */
Scene_Map.prototype.toggleJaftingCraftTypeWindow = function(visible)
{
  if (visible)
  {
    this._j._jaftingMenu._categoryWindow.show();
    this._j._jaftingMenu._categoryWindow.open();
    this._j._jaftingMenu._categoryWindow.activate();
  }
  else
  {
    this._j._jaftingMenu._categoryWindow.close();
    this._j._jaftingMenu._categoryWindow.hide();
    this._j._jaftingMenu._categoryWindow.deactivate();
  }
};

/**
 * Toggles the visibility for the recipe selection window in the JAFTING menu
 * for the craft mode.
 * @param {boolean} visible Whether or not to show this window.
 */
Scene_Map.prototype.toggleJaftingRecipeListWindow = function(visible)
{
  if (visible)
  {
    this._j._jaftingMenu._recipeListWindow.show();
    this._j._jaftingMenu._recipeListWindow.open();
    this._j._jaftingMenu._recipeListWindow.activate();
  }
  else
  {
    this._j._jaftingMenu._recipeListWindow.close();
    this._j._jaftingMenu._recipeListWindow.hide();
    this._j._jaftingMenu._recipeListWindow.select(0);
    this._j._jaftingMenu._recipeListWindow.deactivate();
  }
};

/**
 * Toggles the visibility for the recipe details window in the JAFTING menu
 * for the craft mode.
 * @param {boolean} visible Whether or not to show this window.
 */
Scene_Map.prototype.toggleJaftingRecipeDetailsWindow = function(visible)
{
  if (visible)
  {
    this._j._jaftingMenu._ingredientsRequiredWindow.show();
    this._j._jaftingMenu._ingredientsRequiredWindow.open();
    this._j._jaftingMenu._ingredientsRequiredWindow.activate();
  }
  else
  {
    this._j._jaftingMenu._ingredientsRequiredWindow.close();
    this._j._jaftingMenu._ingredientsRequiredWindow.hide();
    this._j._jaftingMenu._ingredientsRequiredWindow.deactivate();
  }
};

/**
 * Resets the current index of the recipe window to `null`.
 */
Scene_Map.prototype.resetAllIndices = function()
{
  this._j._jaftingMenu._modeWindow.currentIndex = null;
  this._j._jaftingMenu._modeWindow.refresh();

  this._j._jaftingMenu._categoryWindow.currentIndex = null;
  this._j._jaftingMenu._categoryWindow.refresh();

  this._j._jaftingMenu._ingredientsRequiredWindow.currentRecipe = null;
  this._j._jaftingMenu._ingredientsRequiredWindow.refresh();

  this._j._jaftingMenu._recipeListWindow.refresh();
  this._j._jaftingMenu._recipeListWindow.currentIndex = null;
  this._j._jaftingMenu._recipeListWindow.currentCategory = null;
};

/**
 * Sets the text of the help window for the mode selection based on
 * the currently selected option.
 */
Scene_Map.prototype.determineModeHelpWindowText = function()
{
  const index = this._j._jaftingMenu._modeWindow.index();
  // don't update the text if the index matches! (prevents tons of unnecessary updates)
  if (index === this._j._jaftingMenu._modeWindow.currentIndex) return;

  const currentSymbol = this._j._jaftingMenu._modeWindow.currentSymbol();

  this._j._jaftingMenu._modeWindow.currentIndex = index;
  let message = ``;
  switch (currentSymbol)
  {
    case `craft-mode`:
      message = `Crafting mode allows for the creation of new items.\n`;
      message += `Choose a category of JAFTING to get started.`;
      break;
    case `free-mode`:
      message = `Free mode leverages RNG will create new items from experimentation.\n`;
      message += `This is slated for JAFTING v3.0.`;
      break;
    case `refine-mode`:
      message = `Refinement mode empowers items by fusing another item into a base.\n`;
      message += `This is slated for JAFTING v2.0.`;
      break;
    case `cancel`:
      message = `Close the JAFTING menu and resume your adventures.\n`;
      message += `After all, ingredients and recipes won't find themselves!`;
      break;
  }

  this._j._jaftingMenu._helpWindow.setText(message);
};

/**
 * Sets the text of the help window for the mode selection based on
 * the currently selected category.
 */
Scene_Map.prototype.determineCategoryHelpWindowText = function()
{
  const index = this._j._jaftingMenu._categoryWindow.index();
  // don't update the text if the index matches! (prevents tons of unnecessary updates)
  if (index === this._j._jaftingMenu._categoryWindow.currentIndex) return;

  this._j._jaftingMenu._categoryWindow.currentIndex = index;

  // extract the unique key of the category from the panel.
  const {key, description} = this._j._jaftingMenu._categoryWindow.getCategoryDetails();
  this.setCurrentCategory(key);

  // handle multi-line descriptions separated by a "\n" new line.
  const multipartDescription = description.split("\\n");
  let message = `${multipartDescription[0]}`;
  if (multipartDescription.length > 1)
  {
    message += `\n${multipartDescription[1]}`;
  }
  this._j._jaftingMenu._helpWindow.setText(message);
};

/**
 * Sets the text of the help window for the mode selection based on
 * the currently selected recipe.
 */
Scene_Map.prototype.determineRecipeHelpWindowText = function()
{
  const index = this._j._jaftingMenu._recipeListWindow.index();
  // don't update the text if the index matches! (prevents tons of unnecessary updates)
  if (index === this._j._jaftingMenu._recipeListWindow.currentIndex &&
    !$gameSystem.isRefreshRequested())
  {
    return;
  }

  this._j._jaftingMenu._recipeListWindow.currentIndex = index;

  // extract the unique key of the category from the panel.
  const details = this._j._jaftingMenu._recipeListWindow.getRecipeDetails();
  if (!details)
  {
    this._j._jaftingMenu._helpWindow.setText("There are no unlocked recipes.");
    return;
  }

  // assign the current recipe to the details for display.
  this.setCurrentRecipe(details);
  this._j._jaftingMenu._ingredientsRequiredWindow.currentRecipe = this.getCurrentRecipe();

  this.setRecipeDescription();
};

/**
 * Sets the description of the recipe into the help window text.
 */
Scene_Map.prototype.setRecipeDescription = function()
{
  const details = this._j._jaftingMenu._recipeListWindow.getRecipeDetails();
  if (!details) return;

  // handle multi-line descriptions separated by a "\n" new line.
  const description = details.getRecipeDescription();
  const multipartDescription = description.split("\\n");
  let message = `${multipartDescription[0]}`;
  if (multipartDescription.length > 1)
  {
    message += `\n${multipartDescription[1]}`;
  }
  this._j._jaftingMenu._helpWindow.setText(message);
};

/**
 * Hides all windows associated with JAFTING.
 */
Scene_Map.prototype.hideAllJaftingWindows = function()
{
  this.toggleJaftingHelpWindow(false);
  this.toggleJaftingModeWindow(false);
  this.toggleJaftingCraftTypeWindow(false);
  this.toggleJaftingRecipeListWindow(false);
  this.toggleJaftingRecipeDetailsWindow(false);
  this.resetAllIndices();
};

/**
 * Closes a designated window from somewhere within the JAFTING menu.
 * Compare with `Scene_Map.prototype.manageJaftingMenu` to see where the focus goes.
 * @param {string} jaftingWindow The type of window we're closing.
 */
Scene_Map.prototype.closeJaftingWindow = function(jaftingWindow)
{
  this.resetAllIndices();
  switch (jaftingWindow)
  {
    case "main":
      this.hideAllJaftingWindows();
      this.closeJaftingMenu();
      break;
    case "category":
      this.toggleJaftingCraftTypeWindow(false);
      this.toggleJaftingModeWindow(true);
      this.setWindowFocus("main");
      break;
    case "craft-recipes-list":
      this.toggleJaftingRecipeListWindow(false);
      this.toggleJaftingRecipeDetailsWindow(false);
      this.toggleJaftingCraftTypeWindow(true);
      this.setWindowFocus("craft-mode");
      break;
  }
};

/**
 * Closes the entire menu of JAFTING.
 */
Scene_Map.prototype.closeJaftingMenu = function()
{
  this._j._jaftingMenu._modeWindow.closeMenu();
};
//endregion Scene_Map

//region Window_JaftingCraftCategory
/**
 * A simple window that shows a list of categories unlocked.
 */
class Window_JaftingCraftCategory extends Window_Command
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);

    /**
     * The currently selected index of this mode selection window.
     * @type {number}
     */
    this._currentIndex = null;
  }

  /**
   * Gets the current index that was last assigned of this window.
   * @returns {number}
   */
  get currentIndex()
  {
    return this._currentIndex;
  }

  /**
   * Sets the current index to a given value.
   */
  set currentIndex(index)
  {
    this._currentIndex = index;
  }

  /**
   * OVERWRITE Sets the alignment for this command window to be left-aligned.
   */
  itemTextAlign()
  {
    return "left";
  }

  /**
   * Gets the details of the currently selected category.
   * @returns {CraftingCategory}
   */
  getCategoryDetails()
  {
    // cannot return details for null.
    if (this.currentIndex === null || !this._list.length) return null;

    const details = this._list[this.currentIndex].ext;
    return details;
  }

  /**
   * Determines whether or not there are any recipes learned for a given category.
   * @param {string} categoryKey The key of the category to check for recipes.
   * @returns {boolean}
   */
  hasRecipes(categoryKey)
  {
    const unlockedRecipes = $gameSystem.getUnlockedRecipesByCategory(categoryKey);
    const hasRecipesForCategory = unlockedRecipes.length > 0;
    return hasRecipesForCategory;
  }

  /**
   * Creates a list of all unlocked categories of crafting.
   */
  makeCommandList()
  {
    const unlockedCategories = $gameSystem.getUnlockedCategories();

    // don't make the list if we have no categories to draw.
    if (!unlockedCategories.length) return;

    unlockedCategories.forEach(category =>
    {
      const hasRecipesForCategory = this.hasRecipes(category.key);
      this.addCommand(category.name, `crafting-category`, hasRecipesForCategory, category, category.iconIndex);
    });
  }
}
//endregion Window_JaftingCraftCategory

//region Window_JaftingCraftRecipeDetails
/**
 * The window that displays all tools, ingredients, and output from a given recipe.
 */
class Window_JaftingCraftRecipeDetails extends Window_Base
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);
    this.initMembers();
  }

  /**
   * Initializes all members of this window.
   */
  initMembers()
  {
    /**
     * The recipe currently being displayed in this window.
     * @type {CraftingRecipe}
     */
    this._currentRecipe = null;
  }

  /**
   * Gets the current recipe being displayed.
   * @returns {CraftingRecipe}
   */
  get currentRecipe()
  {
    return this._currentRecipe;
  }

  /**
   * Sets the current recipe to be this recipe.
   * @param {CraftingRecipe} recipe The recipe to assign as the current.
   */
  set currentRecipe(recipe)
  {
    this._currentRecipe = recipe;
    this.refresh();
  }

  /**
   * Refreshes this window and all its content.
   */
  refresh()
  {
    // don't refresh if there is no recipe to refresh the contents of.
    if (!this.currentRecipe) return;

    this.contents.clear();
    this.drawRecipeInfo();
  }

  /**
   * Draws the recipe details of the currently selected recipe.
   */
  drawRecipeInfo()
  {
    this.drawRecipeTitle();
    this.drawRecipeIngredients();
    this.drawRecipeTools();
    this.drawRecipeOutput();
  }

  /**
   * Draws the title of the recipe.
   */
  drawRecipeTitle()
  {
    const recipe = this.currentRecipe;
    const iconIndex = this.currentRecipe.getRecipeIconIndex();
    const lh = this.lineHeight();
    this.drawTextEx(`\\{\\I[${iconIndex}] \\C[6]${recipe.getRecipeName()}\\C[0]\\}`, 0, lh * 0, 300);
  }

  /**
   * Draw all ingredients for the recipe.
   */
  drawRecipeIngredients()
  {
    const recipe = this.currentRecipe;
    const {ingredients} = recipe;
    const ox = 30;
    const lh = this.lineHeight();
    this.drawTextEx(`\\C[1]Ingredients\\C[0]`, ox, lh * 2, 300);
    ingredients.forEach((ingredient, index) =>
    {
      const rpgItem = J.BASE.Helpers.translateItem(ingredient.id, ingredient.type);
      const x = ox + 40;
      const y = lh * (3 + (index));
      const need = ingredient.count;
      const have = $gameParty.numItems(rpgItem);
      this.drawRecipeIngredientCount(need, have, x - 60, y);
      this.drawRecipeItemName(rpgItem, x + 40, y);
    });
  }

  /**
   * Draws a single recipe and it's required count vs how many the player has on-hand.
   * @param {number} need The number of this ingredient that is needed.
   * @param {number} have The number of this ingredient that the player has currently.
   * @param {number} x The `x` coordinate.
   * @param {number} y The `y` coordinate.
   */
  drawRecipeIngredientCount(need, have, x, y)
  {
    const haveTextColor = (have >= need) ? 24 : 18;
    this.drawTextEx(`\\C[${haveTextColor}]${have}\\C[0]`, x, y, 100);
    this.drawTextEx(`/`, x + 35, y, 100);
    this.drawTextEx(`${need}`, x + 55, y, 100);
  }

  /**
   * Draw all tools for the recipe.
   */
  drawRecipeTools()
  {
    const recipe = this.currentRecipe;
    const {tools} = recipe;
    const ox = 430;
    const lh = this.lineHeight();
    this.drawTextEx(`\\C[1]Tools Required\\C[0]`, ox, lh * 2, 300);
    tools.forEach((tool, index) =>
    {
      const rpgItem = J.BASE.Helpers.translateItem(tool.id, tool.type);
      const x = ox + 40;
      const y = lh * (3 + (index));
      const available = $gameParty.numItems(rpgItem);
      this.drawRecipeToolAvailability(available, x - 40, y);
      this.drawRecipeItemName(rpgItem, x, y);
    });
  }

  /**
   * Draws a symbol representing whether or not the tool is in the player's possession.
   * @param {boolean} available
   * @param {number} x The `x` coordinate.
   * @param {number} y The `y` coordinate.
   */
  drawRecipeToolAvailability(available, x, y)
  {
    const availableTextColor = available ? 24 : 18;
    const symbol = available ? " ✔" : "❌";
    this.drawTextEx(`\\C[${availableTextColor}]${symbol}\\C[0]`, x, y, 50);
  }

  /**
   * Draws the name of a given ingredient.
   * @param {object} rpgItem The underlying item that needs drawing.
   * @param {number} x The `x` coordinate.
   * @param {number} y The `y` coordinate.
   */
  drawRecipeItemName(rpgItem, x, y)
  {
    this.drawTextEx(`\\I[${rpgItem.iconIndex}]${rpgItem.name}`, x, y, 300);
  }

  /**
   * Draw all output for the recipe.
   */
  drawRecipeOutput()
  {
    const recipe = this.currentRecipe;
    const outputs = recipe.outputs;
    const lh = this.lineHeight();
    const ox = 430;
    this.drawTextEx(`\\C[1]Recipe Output\\C[0]`, ox, lh * 8, 300);
    outputs.forEach((component, index) =>
    {
      const {count} = component;
      const rpgItem = component.getItem();
      const y = lh * (9 + (index));
      this.drawRecipeOutputItem(rpgItem, count, ox, y);
    });
  }

  /**
   * Draws one output item and it's yield.
   * @param {object} rpgItem The underlying item that needs drawing.
   * @param {number} count The number of items that this output yields.
   * @param {number} x The `x` coordinate.
   * @param {number} y The `y` coordinate.
   */
  drawRecipeOutputItem(rpgItem, count, x, y)
  {
    const paddedCount = count.padZero(2);
    const itemCount = ($gameParty.numItems(rpgItem)).padZero(2);
    const itemNumbers = `${paddedCount}x / (x${itemCount})`
    let {name} = rpgItem;
    if (this.currentRecipe.maskedUntilCrafted && !this.currentRecipe.hasBeenCrafted())
    {
      name = name.replace(/[A-Za-z!-?.]/ig, "?");
    }
    this.drawTextEx(`${itemNumbers}x \\I[${rpgItem.iconIndex}]${name}`, x, y, 300);
  }
}
//endregion Window_JaftingCraftRecipeDetails

//region Window_JaftingCraftRecipeList
/**
 * A simple window that shows a list of recipes available based on unlocked ingredients.
 */
class Window_JaftingCraftRecipeList
  extends Window_Command
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);

    /**
     * The currently selected index of this mode selection window.
     * @type {number}
     */
    this._currentIndex = null;

    /**
     * The currently selected category that this recipe list is derived from.
     * @type {string}
     */
    this._currentCategory = null;
  }

  /**
   * Gets the current index that was last assigned of this window.
   * @returns {number}
   */
  get currentIndex()
  {
    return this._currentIndex;
  }

  /**
   * Sets the current index to a given value.
   */
  set currentIndex(index)
  {
    this._currentIndex = index;
  }

  /**
   * Gets the current category that the recipe list is based off of.
   * @returns {string}
   */
  get currentCategory()
  {
    return this._currentCategory;
  }

  /**
   * Sets the current category to a given category.
   */
  set currentCategory(category)
  {
    this._currentCategory = category;
    this.refresh();
  }

  /**
   * OVERWRITE Sets the alignment for this command window to be left-aligned.
   */
  itemTextAlign()
  {
    return "left";
  }

  /**
   * Gets the details of the currently selected category.
   * @returns {CraftingCategory}
   */
  getRecipeDetails()
  {
    // cannot return details for null.
    if (this.currentIndex === null) return null;

    // cannot get the details for an empty list.
    if (!this._list.length) return null;

    if (this.currentIndex > this._list.length - 1)
    {
      this.currentIndex = 0;
      this.select(0);
    }

    const details = this._list[this.currentIndex].ext;
    return details;
  }

  /**
   * Creates a list of all unlocked recipes that belong to this category of crafting.
   */
  makeCommandList()
  {
    const unlockedRecipes = $gameSystem.getUnlockedRecipesByCategory(this.currentCategory);

    // don't make the list if we have no categories to draw.
    if (!unlockedRecipes.length) return;

    // create commands based on the recipe and the ingredients/tools vs player inventory.
    unlockedRecipes.forEach(recipe =>
    {
      const canCraft = recipe.canCraft();
      const name = recipe.getRecipeName();
      const iconIndex = recipe.getRecipeIcon();

      // determine if enabled/disabled by ingredients+tools in inventory.
      this.addCommand(name, `chosen-recipe`, canCraft, recipe, iconIndex);
    });
  }
}
//endregion Window_JaftingCraftRecipeList

//region Window_OmnipediaList
/**
 * A window displaying the list of jafting types available.
 */
class Window_JaftingList extends Window_Command
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Implements {@link #makeCommandList}.<br>
   * Creates the command list of omnipedia entries available for this window.
   */
  makeCommandList()
  {
    // grab all the omnipedia listings available.
    const commands = this.buildCommands();

    // add all the built commands.
    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds all commands for this command window.
   * Adds all omnipedia commands to the list that are available.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    /*
    const refinementCommand = new WindowCommandBuilder("Refinement")
      .setSymbol("refinement")
      .addSubTextLine("The niche hobbiest dream.")
      .addSubTextLine("Update equips by consuming other equips and materials- to an extent.")
      .setIconIndex(2566)
      .build();

    const freestyleCommand = new WindowCommandBuilder("Freestyle")
      .setSymbol("freestyle")
      .addSubTextLine("Submit to RNGesus.")
      .addSubTextLine("Freestyle with some materials to experience creation- with a touch of random.")
      .setIconIndex(2569)
      .build();
    */

    return [];
  }

  /**
   * Overrides {@link #itemHeight}.<br>
   * Makes the command rows bigger so there can be additional lines.
   * @returns {number}
   */
  itemHeight()
  {
    return this.lineHeight() * 2;
  }
}
//endregion Window_OmnipediaList

//region Window_OmnipediaListHeader
class Window_JaftingListHeader extends Window_Base
{
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * Implements {@link Window_Base.drawContent}.<br>
   * Draws a header and some detail for the omnipedia list header.
   */
  drawContent()
  {
    // define the origin x,y coordinates.
    const [x, y] = [0, 0];

    // shorthand the lineHeight.
    const lh = this.lineHeight();

    // draw the header.
    this.drawHeader(x, y);

    // draw the detail under the header.
    const detailY = y + (lh * 1);
    this.drawDetail(x, detailY);
  }

  /**
   * Draws the header text.
   * @param {number} x The base x coordinate for this section.
   * @param {number} y The base y coordinate for this section.
   */
  drawHeader(x, y)
  {
    // make the font size nice and big.
    this.modFontSize(10);

    // define the text for this section.
    const headerText = 'The Jafting System';

    // when using "center"-alignment, you center across the width of the window.
    const headerTextWidth = this.width;

    // enable italics.
    this.toggleBold(true);

    // render the headline title text.
    this.drawText(headerText, x, y, headerTextWidth, "center");

    // reset any lingering font settings.
    this.resetFontSettings();
  }

  /**
   * Draws the detail text.
   * @param {number} x The base x coordinate for this section.
   * @param {number} y The base y coordinate for this section.
   */
  drawDetail(x, y)
  {
    // define the text for this section.
    const detailText = 'Item Creation of all kinds, at your doorstep.';

    // when using "center"-alignment, you center across the width of the window.
    const detailTextWidth = this.width;

    // enable italics.
    this.toggleItalics(true);

    // render the headline title text.
    this.drawText(detailText, x, y, detailTextWidth, "center");

    // reset any lingering font settings.
    this.resetFontSettings();
  }
}
//endregion Window_OmnipediaListHeader

//region Window_JaftingModeMenu
/**
 * The mode selection window for JAFTING.
 */
class Window_JaftingModeMenu
  extends Window_HorzCommand
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that represents this window.
   */
  constructor(rect)
  {
    super(rect);
    this.initialize(rect);
    /**
     * The currently selected index of this mode selection window.
     * @type {number}
     */
    this._currentIndex = null;
  }

  /**
   * Gets the current index that was last assigned of this window.
   * @returns {number}
   */
  get currentIndex()
  {
    return this._currentIndex;
  }

  /**
   * Sets the current index to a given value.
   */
  set currentIndex(index)
  {
    this._currentIndex = index;
  }

  /**
   * Generate commands for all modes of crafting.
   */
  makeCommandList()
  {
    const hasCategories = $gameSystem.getUnlockedCategories();
    this.addCommand(`Crafting`, `craft-mode`, hasCategories.length, null, 193);
    this.addCommand(`Freestyle`, `free-mode`, false, null, 93); // disabled till implemented.
    this.addCommand(`Cancel`, `cancel`, true, null, 90);
  }

  /**
   * OVERWRITE Sets the alignment for this command window to be left-aligned.
   */
  itemTextAlign()
  {
    return "left";
  }

  /**
   * Closes the entire JAFTING menu.
   */
  closeMenu()
  {
    if (!this.isClosed())
    {
      this.close();
      if (J.ABS)
      {
        $jabsEngine.absPause = false;
        $jabsEngine.requestAbsMenu = false;
      }

      $gameSystem.endJafting();
    }
  }
}
//endregion Window_JaftingModeMenu