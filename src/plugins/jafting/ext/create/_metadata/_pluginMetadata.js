//region plugin metadata
import CraftingCategory from '../__models/CraftingCategory.js';
import CraftingComponent from '../__models/CraftingComponent.js';
import CraftingConfiguration from '../__models/CraftingConfiguration.js';
import CraftingRecipe from '../__models/CraftingRecipe.js';

/**
 * Plugin metadata for the creation JAFTING plugin.<br>
 * Such data includes things like recipes, categories, and connectivity
 * with the SDP system.
 */
class J_CraftingCreatePluginMetadata
  extends PluginMetadata
{
  /**
   * Project-relative path to the crafting JSON configuration file.
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
      const {
        count,
        id,
        type,
        categories
      } = mappableComponent;

      // an absent `categories` is the common case and yields an ordinary id-based component.
      const newComponent = new CraftingComponent(count, id, type, categories ?? []);
      return newComponent;
    };

    // a mapping function for classifying the recipes of the configuration.
    const recipeMapper = mappableRecipe =>
    {
      // parse all components from the recipe.
      const parsedIngredients = mappableRecipe.ingredients.map(componentMapper, this);
      const parsedTools = mappableRecipe.tools.map(componentMapper, this);
      const parsedOutputs = mappableRecipe.outputs.map(componentMapper, this);

      // a recipe with no cost is not for sale, which is what every recipe authored before study
      // existed says by omitting the block entirely.
      const rawCost = mappableRecipe.cost ?? [];
      const parsedCost = rawCost.map(componentMapper, this);

      // an output must name exactly what it produces; there is nothing to resolve a category against.
      const categoricalOutput = parsedOutputs.find(output => output.isCategorical());
      if (categoricalOutput !== undefined)
      {
        throw new Error(`recipe '${mappableRecipe.key}' declares a categorical output, which cannot be produced.`);
      }

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
        parsedOutputs,
        parsedCost
      );

      return newJaftingRecipe;
    };

    /** @type {CraftingRecipe[]} */
    const jaftingRecipes = parsedRecipesBlob.map(recipeMapper, this);

    // return what we made.
    return jaftingRecipes;
  }

  /**
   * Converts the JSON-parsed blob into classified {@link CraftingCategory}s.
   * @param {any} parsedCategoriesBlob The already-parsed JSON blob.
   */
  static parseCategories(parsedCategoriesBlob)
  {
    // a mapping function for classifying the categories of the configuration.
    const categoryMapper = mappableCategory =>
    {
      const {
        name,
        key,
        iconIndex,
        description,
        unlockedByDefault
      } = mappableCategory;
      const newCategory = new CraftingCategory(name, key, iconIndex, description, unlockedByDefault);
      return newCategory;
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

    // initialize recipes and categories from external JSON configuration.
    this.initializeConfiguration();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Loads and classifies crafting recipes and categories from {@link J_CraftingCreatePluginMetadata.CONFIG_PATH}.
   */
  initializeConfiguration()
  {
    // this plugin cannot be constructed at all against an inadequate J-Base: initialization.js gates
    // on 3.2.0 and throws before reaching here, so there is nothing left to re-check.
    const summarize = result => [
      `- ${result.recipes().length} recipes`,
      `- ${result.categories().length} categories`,
    ];

    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName('J-JAFTING-Creation')
      .configName('crafting configuration')
      .mapper(J_CraftingCreatePluginMetadata.classify.bind(J_CraftingCreatePluginMetadata))
      .logSummary(summarize)
      .build();

    const classifiedCraftingConfig = ExternalJsonConfigLoader.load(
      J_CraftingCreatePluginMetadata.CONFIG_PATH,
      options);

    /**
     * The collection of all defined jafting recipes.
     * @type {CraftingRecipe[]}
     */
    this.recipes = classifiedCraftingConfig.recipes();

    // construct recipe map for the next step in this routine.
    const recipeMap = new Map();
    this.recipes.forEach(recipe => recipeMap.set(recipe.key, recipe));

    /**
     * A key:recipe map of all defined recipes.
     * @type {Map<string, CraftingRecipe>}
     */
    this.recipesMap = recipeMap;

    /**
     * The collection of all defined jafting categories.
     * @type {CraftingCategory[]}
     */
    this.categories = classifiedCraftingConfig.categories();

    // construct categories map for the next step in this routine.
    const categoriesMap = new Map();
    this.categories.forEach(category => categoriesMap.set(category.key, category));

    /**
     * A key:category map of all defined categories.
     * @type {Map<string, CraftingCategory>}
     */
    this.categoriesMap = categoriesMap;
  }

  /**
   * Initializes the metadata associated with this plugin.
   */
  initializeMetadata()
  {
    /**
     * The id of a switch that represents whether or not this system is accessible
     * in the menu.
     * @type {number}
     */
    this.menuSwitchId = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-switch'], 0);

    /**
     * The name used for the command when visible in a menu.
     * @type {string}
     */
    this.commandName = this.parsedPluginParameters['menu-name'] ?? 'Creation';

    /**
     * The icon used alongside the command's name when visible in the menu.
     * @type {number}
     */
    this.commandIconIndex = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['menu-icon'], 0);
  }

  /**
   * Determine if the SDP system is available for use with this crafting system.
   * @return {boolean}
   */
  usingSdp()
  {
    // if we're not connected, then do not.
    if (!this.hasSdpConnection()) return false;

    // if we're not high enough version, then do not.
    if (!this.hasMinimumSdpVersion()) return false;

    // lets do it!
    return true;
  }

  /**
   * Checks if the plugin metadata is detected for the SDP system.
   * @return {boolean}
   */
  hasSdpConnection()
  {
    // both plugins are not registered.
    if (!PluginMetadata.hasPlugin('J-SDP')) return false;

    // both plugins are registered, nice!
    return true;
  }

  /**
   * Checks if the SDP system meets the minimum version requirement for
   * connecting with this crafting system.
   * @return {boolean}
   */
  hasMinimumSdpVersion()
  {
    // grab the minimum verison.
    const minimumVersion = this.minimumSdpVersion();

    // check if we meet the minimum version threshold.
    const meetsThreshold = J.SDP.Metadata.version
      .satisfiesPluginVersion(minimumVersion);

    // if the SDP exists but doesn't meet the threshold, then we're not connecting.
    if (!meetsThreshold) return false;

    // we're good!
    return true;
  }

  /**
   * Gets the current minimum version of the SDP system that
   * this crafting will communicate with.
   * @return {PluginVersion}
   */
  minimumSdpVersion()
  {
    return PluginVersion.builder
      .major('2')
      .minor('0')
      // continue the routine with the next policy step.
      .patch('0')
      .build();
  }

}

export default J_CraftingCreatePluginMetadata;

//endregion plugin metadata