//region plugin metadata
import CraftingCategory from '../__models/CraftingCategory.js';
import CraftingComponent from '../__models/CraftingComponent.js';
import CraftingConfiguration from '../__models/CraftingConfiguration.js';
import CraftingProfession from '../__models/CraftingProfession.js';
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
    const professions = this.parseProfessions(parsedJson.professions ?? []);

    // build the new crafting configuration.
    const config = CraftingConfiguration.builder
      .recipes(recipes)
      .categories(categories)
      .professions(professions)
      .build();

    // return what we made.
    return config;
  }

  /**
   * Converts the JSON-parsed blob into classified {@link CraftingProfession}s.
   *
   * An absent block is the common case for a configuration authored before professions existed, and it
   * yields no professions at all rather than a failure - which reads downstream as nothing being for
   * sale, exactly as a roster with no economy should.
   * @param {any} parsedProfessionsBlob The already-parsed JSON blob.
   * @returns {CraftingProfession[]}
   */
  static parseProfessions(parsedProfessionsBlob)
  {
    // a mapping function for classifying the professions of the configuration.
    const professionMapper = mappableProfession =>
    {
      const {
        key,
        name,
        iconIndex,
        description,
        scrapItemId,
        tierPrices
      } = mappableProfession;

      // an absent price table is how a profession says none of its recipes are taught by a shop.
      const newProfession = new CraftingProfession(
        key,
        name,
        iconIndex,
        description,
        scrapItemId,
        tierPrices ?? []);

      return newProfession;
    };

    const jaftingProfessions = parsedProfessionsBlob.map(professionMapper, this);

    // return what we made.
    return jaftingProfessions;
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
        unlockedByDefault,
        professionKey
      } = mappableCategory;

      // an absent profession is how a category authored before professions existed says it joins none.
      const newCategory = new CraftingCategory(
        name,
        key,
        iconIndex,
        description,
        unlockedByDefault,
        professionKey ?? String.empty);

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
      `- ${result.professions().length} professions`,
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

    /**
     * The collection of all defined crafting professions.
     * @type {CraftingProfession[]}
     */
    this.professions = classifiedCraftingConfig.professions();

    // construct profession map so a category can be resolved to its owner in one lookup.
    const professionsMap = new Map();
    this.professions.forEach(profession => professionsMap.set(profession.key, profession));

    /**
     * A key:profession map of all defined professions.
     * @type {Map<string, CraftingProfession>}
     */
    this.professionsMap = professionsMap;
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
   * The profession a recipe belongs to, found through the first category it is filed under.
   *
   * The first category wins, matching the authoring rule that a recipe lives in the lane of its first
   * output. A recipe filed under nothing, a category naming no profession, and a category naming one
   * that does not exist all answer null - each meaning the same thing, that there is nobody to sell it.
   * @param {string[]} categoryKeys The categories the recipe is filed under.
   * @returns {CraftingProfession|null} The owning profession, or null when the recipe joins none.
   */
  professionForCategories(categoryKeys)
  {
    const [ primaryCategory ] = categoryKeys;

    // a recipe filed under no category at all belongs to no profession.
    if (primaryCategory === undefined) return null;

    const category = this.categoriesMap.get(primaryCategory);

    // a category that is not in configuration cannot say which profession it joined.
    if (category === undefined) return null;

    // an empty profession key is how a category says it deliberately joined none.
    if (category.professionKey === String.empty) return null;

    const profession = this.professionsMap.get(category.professionKey);

    // a key naming a profession that does not exist is treated as naming none.
    if (profession === undefined) return null;

    return profession;
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
   * A recipe belonging to no profession, an untiered recipe, a tier past the end of its profession's
   * price table, and a profession that sells nothing all answer the same way: an empty cost, which
   * reads downstream as simply not being for sale.
   * @param {CraftingRecipe} recipe The recipe being priced.
   * @returns {CraftingComponent[]}
   */
  tuitionForTier(recipe)
  {
    const profession = this.professionForCategories(recipe.categoryKeys);

    // a recipe nobody teaches has no tuition to charge.
    if (profession === null) return [];

    // a profession with no currency or no priced rungs is one whose recipes are found, not bought.
    if (profession.isForSale() === false) return [];

    const price = profession.priceForTier(recipe.tier);

    // an untiered recipe, or one deeper than its profession's ladder reaches, carries no price.
    if (price <= 0) return [];

    const tuition = new CraftingComponent(price, profession.scrapItemId, CraftingComponent.Types.Item);

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