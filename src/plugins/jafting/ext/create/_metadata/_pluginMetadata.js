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
        parsedCost,
        mappableRecipe.tier ?? 0
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

    // price the tiered recipes, which needs both the recipes and the parameters to already exist.
    this.applyTieredTuition();
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
   * The scrap price for each tier, lowest first.
   *
   * Read from parameters rather than from the crafting config, because the config is rewritten wholesale
   * by the editor and because retuning an economy should never be a data edit. A tier with no entry here
   * simply has no price, which is how a roster can grow past the table without pricing itself by accident.
   * @returns {number[]}
   */
  tierPrices()
  {
    const configured = this.parsedPluginParameters['tier-prices'];

    // the parameter parser hands back a real array, but an unset parameter hands back nothing at all.
    if (Array.isArray(configured) === false) return [];

    return configured.map(price => J.BASE.Helpers.parsePluginInt(price, 0));
  }

  /**
   * The scrap a recipe is bought with, decided by the profession it belongs to.
   *
   * The first category wins, matching the authoring rule that a recipe lives in the lane of its first
   * output. Material recipes go to smithing, since that is the station that teaches them.
   * @param {string[]} categoryKeys The categories the recipe is filed under.
   * @returns {number} The item id, or 0 when the profession has no scrap of its own.
   */
  scrapIdForCategories(categoryKeys)
  {
    const [ primaryCategory ] = categoryKeys;
    const parameters = this.parsedPluginParameters;

    if (primaryCategory.startsWith('cook-')) return J.BASE.Helpers.parsePluginInt(parameters['scrap-cook'], 0);
    if (primaryCategory.startsWith('survive-')) return J.BASE.Helpers.parsePluginInt(parameters['scrap-survive'], 0);
    if (primaryCategory.startsWith('alchemy-')) return J.BASE.Helpers.parsePluginInt(parameters['scrap-alchemy'], 0);
    if (primaryCategory.startsWith('smith-')) return J.BASE.Helpers.parsePluginInt(parameters['scrap-smith'], 0);
    if (primaryCategory.startsWith('material-')) return J.BASE.Helpers.parsePluginInt(parameters['scrap-smith'], 0);

    return 0;
  }

  /**
   * Prices every tiered recipe that named no cost of its own.
   *
   * This runs after parsing rather than during it, because the parser is static and the prices are
   * plugin parameters that only an instance holds. A recipe that named its own cost is left alone: the
   * tier is the rule and the cost is the exception.
   */
  applyTieredTuition()
  {
    this.recipes
      .filter(recipe => recipe.cost.length === 0)
      .forEach(recipe => recipe.setCost(this.tuitionForTier(recipe)), this);
  }

  /**
   * Builds the tuition a tiered recipe charges, for a recipe that named no cost of its own.
   *
   * An untiered recipe, a tier past the end of the price table, and a profession with no scrap all
   * answer the same way: an empty cost, which reads downstream as simply not being for sale.
   * @param {CraftingRecipe} recipe The recipe being priced.
   * @returns {CraftingComponent[]}
   */
  tuitionForTier(recipe)
  {
    const { tier } = recipe;

    if (tier <= 0) return [];

    const price = this.tierPrices()
      .at(tier - 1) ?? 0;

    if (price <= 0) return [];

    const scrapId = this.scrapIdForCategories(recipe.categoryKeys);

    if (scrapId <= 0) return [];

    const tuition = new CraftingComponent(price, scrapId, CraftingComponent.Types.Item);

    return [ tuition ];
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