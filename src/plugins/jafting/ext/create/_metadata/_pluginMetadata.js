//region plugin metadata
/**
 * Metadata unique to the crafting system.<br>
 * Such data includes things like recipes, categories, and connectivity
 * with the SDP system.
 */
class J_CraftingCreatePluginMetadata extends PluginMetadata
{
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

    // initialize the panels from plugin configuration.
    this.initializeConfiguration();

    // initialize this plugin from configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the SDPs that exist in the SDP configuration.
   */
  initializeConfiguration()
  {
    // parse the files as an actual list of objects from the JSON configuration.
    const parsedJson = JSON.parse(StorageManager.fsReadFile(J_CraftingPluginMetadata.CONFIG_PATH));
    if (parsedJson === null)
    {
      console.error('no crafting configuration was found in the /data directory of the project.');
      console.error('Consider adding configuration using the J-MZ data editor, or hand-writing one.');
      throw new Error('Crafting plugin is being used, but no config file is present.');
    }

    // class-ify over each panel.
    const classifiedCraftingConfig = J_CraftingPluginMetadata.classify(parsedJson);

    /**
     * The collection of all defined jafting recipes.
     * @type {CraftingRecipe[]}
     */
    this.recipes = classifiedCraftingConfig.recipes();

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

    const categoriesMap = new Map();
    this.categories.forEach(category => categoriesMap.set(category.key, category));

    /**
     * A key:category map of all defined categories.
     * @type {Map<string, CraftingCategory>}
     */
    this.categoriesMap = categoriesMap;

    console.log(`loaded:
      - ${this.recipes.length} recipes
      - ${this.categories.length} categories
      from file ${J_CraftingPluginMetadata.CONFIG_PATH}.`);
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
    this.menuSwitchId = parseInt(this.parsedPluginParameters['menuSwitch']);

    /**
     * The name used for the command when visible in a menu.
     * @type {string}
     */
    this.commandName = this.parsedPluginParameters['menuCommandName'] ?? 'Creation';

    /**
     * The icon used alongside the command's name when visible in the menu.
     * @type {number}
     */
    this.commandIconIndex = parseInt(this.parsedPluginParameters['menuCommandIcon']);
  }

  /**
   * Determine if the SDP system is available for use with this crafting system.
   * @return {boolean}
   */
  usingSdp()
  {
    // if we're not connected, then do not.
    if (!this.#hasSdpConnection()) return false;

    // if we're not high enough version, then do not.
    if (!this.#hasMinimumSdpVersion()) return false;

    // lets do it!
    return true;
  }

  /**
   * Checks if the plugin metadata is detected for the SDP system.
   * @return {boolean}
   */
  #hasSdpConnection()
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
  #hasMinimumSdpVersion()
  {
    // grab the minimum verison.
    const minimumVersion = this.#minimumSdpVersion();

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
  #minimumSdpVersion()
  {
    return PluginVersion.builder
      .major('2')
      .minor('0')
      .patch('0')
      .build();
  }
}
//endregion plugin metadata