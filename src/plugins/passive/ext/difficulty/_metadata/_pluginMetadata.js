//region plugin metadata
import AffixEffects from '../__models/AffixEffects.js';
import DifficultyBuilder from '../__models/DifficultyBuilder.js';
import DifficultyLayer from '../__models/DifficultyLayer.js';

class J_DiffPluginMetadata
  extends PluginMetadata
{
  /**
   * Project-relative path to the difficulty JSON configuration file.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.difficulty.json';

  /**
   * The underlying layer that represents the default.<br>
   * It is null by default but is updated at initiation and during modification of layers.
   * @type {DifficultyLayer|null}
   */
  static #default = null;

  /**
   * A default {@link DifficultyLayer} with no states and no affix biasing.
   * When all layers are disabled, this is the default layer used.
   * @type {DifficultyLayer}
   */
  static defaultLayer()
  {
    return this.#default;
  }

  /**
   * Updates the default layer with a new default.
   * @param {DifficultyLayer} layer The layer driving this step.
   */
  static updateDefaultLayer(layer)
  {
    this.#default = layer;
  }

  /**
   * Converts the JSON-parsed blob into classified {@link DifficultyMetadata}s.
   * @param {any} parsedBlob The already-parsed JSON blob.
   * @return {Map<string, DifficultyMetadata>} A map of the difficulty layers by their keys.
   */
  static classifyDifficulties(parsedBlob)
  {
    /** @type {Map<string, DifficultyMetadata>} */
    const difficultiesMap = new Map();

    // a map function for iterating and parsing blobs.
    const forEacher = parsedDifficultyBlob =>
    {
      // extract the data points from the blob.
      const {
        key,
        name,
        description,
        iconIndex,
        cost,
        actorStateId,
        enemyStateId,
        affixEffects,
        enabled,
        unlocked,
        hidden
      } = parsedDifficultyBlob;

      // a layer that leaves affixes alone omits the block entirely, and answers null for it.
      const parsedAffixEffects = (affixEffects === undefined)
        ? null
        : AffixEffects.fromRaw(key, affixEffects);

      // instantiate the builder with the base data.
      /** @type {DifficultyMetadata} */
      const completeDifficulty = new DifficultyBuilder(name, key)
        // assign the core data.
        .setDescription(description)
        .setIconIndex(iconIndex)
        .setCost(cost)
        // assign the accessors.
        .setEnabled(enabled)
        .setHidden(hidden)
        .setUnlocked(unlocked)
        // assign the states this layer grants each side of every fight.
        .setActorStateId(actorStateId)
        .setEnemyStateId(enemyStateId)
        // assign the affix biasing, when the layer declared any.
        .setAffixEffects(parsedAffixEffects)
        // build the complete object.
        .build();

      // check for duplicates in case a warning is necessary.
      if (difficultiesMap.get(key))
      {
        Diagnostics.warn(__PLUGIN_NAME__, `duplicate difficulty key definition detected for [${key}].`);
      }

      // set the difficulty!
      difficultiesMap.set(key, completeDifficulty);
    };

    // iterate over each blob and do it.
    parsedBlob.forEach(forEacher);

    // return what we parsed.
    return difficultiesMap;
  }

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Includes translation of plugin parameters.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // load difficulty layers from external JSON configuration.
    this.initializeDifficulties();

    // initialize the other miscellaneous plugin configuration.
    this.initializeMetadata();
  }

  /**
   * Loads difficulty layers from {@link J_DiffPluginMetadata.CONFIG_PATH}.
   */
  initializeDifficulties()
  {
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName(__PLUGIN_NAME__)
      .configName('difficulty configuration')
      .logSummary(result => [ `- ${result.length} difficulty layers` ])
      .build();

    // load the raw layer blobs from the configuration file.
    const parsedBlob = ExternalJsonConfigLoader.load(J_DiffPluginMetadata.CONFIG_PATH, options);

    /**
     * A map of difficulty layer metadatas by their key.
     * @type {Map<string, DifficultyMetadata>}
     */
    this.allMetadatas = J_DiffPluginMetadata.classifyDifficulties(parsedBlob);
  }

  initializeMetadata()
  {
    /**
     * The key for the default difficulty.
     * @type {string}
     */
    this.defaultKey = this.parsedPluginParameters['defaultDifficulty'] || "default_undefined";

    /**
     * The default point max for allocating difficulty layers.
     */
    this.initialPoints = J.BASE.Helpers.parsePluginInt(this.parsedPluginParameters['initialPoints'], 0);

    // update the default layer as well.
    const defaultLayer = DifficultyLayer.fromMetadata(this.allMetadatas.get(this.defaultKey));
    J_DiffPluginMetadata.updateDefaultLayer(defaultLayer);
  }
}

export default J_DiffPluginMetadata;
//endregion plugin metadata