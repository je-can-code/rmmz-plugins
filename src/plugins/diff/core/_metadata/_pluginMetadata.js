//region plugin metadata
import DifficultyBattlerEffects from '../__models/DifficultyBattlerEffects.js';
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
   * A default {@link DifficultyLayer} with all unmodified parameters and bonuses.
   * When all layers are disabled, this is the default layer used.
   * @type {DifficultyLayer}
   */
  static defaultLayer()
  {
    return this.#default;
  }

  /**
   * Updates the default layer with a new default.
   * @param {DifficultyLayer} layer
   */
  static updateDefaultLayer(layer)
  {
    this.#default = layer;
  }

  /**
   * Converts the JSON-parsed blob into classified {@link DifficultyLayer}s.
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
        actorEffects,
        enemyEffects,
        rewards,
        enabled,
        unlocked,
        hidden
      } = parsedDifficultyBlob;

      // an iterator function for updating all param collections for these battler effects.
      const battlerEffectsMapper = battlerEffects =>
      {
        // initialize the params to defaults.
        const newBParams = [ 100, 100, 100, 100, 100, 100, 100, 100 ];
        const newXParams = [ 100, 100, 100, 100, 100, 100, 100, 100, 100, 100 ];
        const newSParams = [ 100, 100, 100, 100, 100, 100, 100, 100, 100, 100 ];
        const newCParams = [];

        // extract all the raw parameters.
        const {
          bparams,
          xparams,
          sparams,
          cparams
        } = battlerEffects;

        // update the bparams for the effects.
        bparams.forEach((paramRate, paramId) => newBParams[paramId] = paramRate);

        // update the xparams for the effects.
        xparams.forEach((paramRate, paramId) => newXParams[paramId] = paramRate);

        // update the sparams for the effects.
        sparams.forEach((paramRate, paramId) => newSParams[paramId] = paramRate);

        // update the sparams for the effects.
        cparams.forEach((paramRate, paramId) => newCParams[paramId] = paramRate);

        // create a new battler effects based on the modified params.
        const modifiedBattlerEffects = DifficultyBattlerEffects.fromRaw(newBParams, newXParams, newSParams, newCParams);

        // return the built battler effects.
        return modifiedBattlerEffects;
      };

      // parse the actor battler effects.
      const mappedActorEffects = battlerEffectsMapper(actorEffects);

      // parse the enemy battler effects.
      const mappedEnemyEffects = battlerEffectsMapper(enemyEffects);

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
        // assign the battler data.
        .setActorEffects(mappedActorEffects)
        .setEnemyEffects(mappedEnemyEffects)
        // assign reward data.
        .setRewards(rewards)
        // build the complete object.
        .build();

      // check for duplicates in case a warning is necessary.
      if (difficultiesMap.get(key))
      {
        console.warn(`Duplicate difficulty key definition detected for [${key}].`);
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
   * Extends {@link #postInitialize}.<br>
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
    const classifiedMetadatas = ExternalJsonConfigLoader.load(
      J_DiffPluginMetadata.CONFIG_PATH,
      ExternalJsonConfigLoaderOptions.Builder()
        .pluginName('J-Difficulty')
        .configName('difficulty configuration')
        .mapper(J_DiffPluginMetadata.classifyDifficulties.bind(J_DiffPluginMetadata))
        .logSummary(result => [ `- ${result.size} difficulty layers` ])
        .build()
    );

    /**
     * A map of difficulty layer metadatas by their key.
     * @type {Map<string, DifficultyMetadata>}
     */
    this.allMetadatas = classifiedMetadatas;
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