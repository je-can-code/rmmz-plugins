//region Game_Temp
import DifficultyLayer from './../__models/DifficultyLayer.js';
import DifficultyConfig from './../__models/DifficultyConfig.js';
import DifficultyBuilder from './../__models/DifficultyBuilder.js';
import DifficultyAffixManager from './../managers/DifficultyAffixManager.js';
import J_DiffPluginMetadata from '../_metadata/_pluginMetadata.js';

/**
 * Intializes all additional members of this class.
 */
J.PASSIVE.EXT.DIFFICULTY.Aliased.Game_Temp.set('initMembers', Game_Temp.prototype.initMembers);
Game_Temp.prototype.initMembers = function()
{
  // perform original logic.
  J.PASSIVE.EXT.DIFFICULTY.Aliased.Game_Temp.get('initMembers')
    .call(this);

  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with the difficulty system.
   */
  this._j._difficulty ||= {};

  /**
   * All difficulties that were defined in the plugin metadata.
   * @type {Map<string, DifficultyMetadata>}
   */
  this._j._difficulty._metadata = J.PASSIVE.EXT.DIFFICULTY.Metadata.allMetadatas;

  /**
   * All difficulties available for use.
   * @type {Map<string, DifficultyLayer>}
   */
  this._j._difficulty._allLayers = new Map();

  /**
   * All difficulties' default configurations.
   * @type {Map<string, DifficultyConfig>}
   */
  this._j._difficulty._allConfigs = new Map();

  /**
   * The "applied" difficulty: the summary layer the difficulty menu lists first, standing for every
   * enabled layer at once.
   * @type {DifficultyLayer}
   */
  this._j._difficulty._appliedDifficulty = J_DiffPluginMetadata.defaultLayer();

  /**
   * The passive sources every actor draws its difficulty states from.
   * Empty while no layer in force grants actors a state.
   * @type {RPG_BaseItem[]}
   */
  this._j._difficulty._actorSources = [];

  /**
   * The passive sources every enemy draws its difficulty states from.
   * Empty while no layer in force grants enemies a state.
   * @type {RPG_BaseItem[]}
   */
  this._j._difficulty._enemySources = [];
};

/**
 * Gets all difficulties that have been defined by plugin metadata.
 * @returns {Map<string, DifficultyLayer>}
 */
Game_Temp.prototype.getAllDifficultyLayers = function()
{
  return this._j._difficulty._allLayers;
};

/**
 * Finds the {@link DifficultyLayer} that matches the given key.
 * @param {string} key The key of the difficulty to find.
 * @returns {DifficultyLayer|undefined} The difficulty if it existed, `undefined` otherwise;
 */
Game_Temp.prototype.findDifficultyLayerByKey = function(key)
{
  // grab all the difficulties.
  const difficulties = this.getAllDifficultyLayers();

  // return what was found.
  return difficulties.get(key);
};

/**
 * Sets up the difficulty layers based on the plugin parameters.
 */
Game_Temp.prototype.setupDifficultySystem = function()
{
  // iterate over each of the metadatas.
  this.metadata().forEach((difficultyMetadata, key) =>
  {
    // create the difficulty from metadata.
    const difficultyLayer = DifficultyLayer.fromMetadata(difficultyMetadata);

    // add the difficulty layer to the list of available layers.
    this.getAllDifficultyLayers().set(key, difficultyLayer);

    // create the config from metadata.
    const difficultyConfig = DifficultyConfig.fromMetadata(difficultyMetadata);

    // add the difficulty config to the list of available configs.
    this.allConfigs().set(key, difficultyConfig);

    // also register the configuration with the system for tracking.
    $gameSystem.registerDifficultyConfig(difficultyConfig);
  });

  // refresh the applied difficulty.
  this.refreshAppliedDifficulty();
};

/**
 * Gets the applied difficulty.
 * If somehow there is no applied difficulty in-place, then the default will be used.
 * @returns {DifficultyLayer}
 */
Game_Temp.prototype.getAppliedDifficulty = function()
{
  return this._j._difficulty._appliedDifficulty;
};

/**
 * Sets the applied difficulty to the given difficulty.
 * @param {DifficultyLayer} difficulty The new applied difficulty.
 */
Game_Temp.prototype.setAppliedDifficulty = function(difficulty)
{
  this._j._difficulty._appliedDifficulty = difficulty;
};

/**
 * Refreshes the applied difficulty, and everything that follows from it, from the enabled layers.
 *
 * This is the one seam every change to the enabled set passes through - starting a new game, loading a
 * save, and toggling a layer all reach it - which is why each consequence of a change is rebuilt here
 * rather than at a narrower call site.
 */
Game_Temp.prototype.refreshAppliedDifficulty = function()
{
  // build the applied difficulty.
  const appliedDifficulty = this.buildAppliedDifficulty();

  // set the new layer.
  this.setAppliedDifficulty(appliedDifficulty);

  // rebuild the passive sources carrying each side's difficulty states.
  this.refreshDifficultyPassiveSources();

  // enemy affixes belong to J-Passive-Affix; only with it installed is there any biasing to fold.
  if (J.PASSIVE.EXT.AFFIX)
  {
    DifficultyAffixManager.buildEffectivePools();
  }

  // hand every living battler the difficulty states now in force.
  this.refreshDifficultyPassives();
};

/**
 * Builds the applied difficulty based on the currently enabled layers.
 * With nothing enabled the authored default layer applies outright; otherwise a summary layer stands
 * for every enabled layer at once, carrying their combined cost.
 * @returns {DifficultyLayer}
 */
Game_Temp.prototype.buildAppliedDifficulty = function()
{
  // grab the layers the player currently has enabled.
  const enabledDifficulties = this.enabledDifficultyLayers();

  // check if we have no enabled difficulties.
  if (enabledDifficulties.length === 0)
  {
    // we'll just apply the default layer.
    return J_DiffPluginMetadata.defaultLayer();
  }

  // the summary starts from the default layer's cost and adds every enabled layer's cost to it.
  const { cost: initialCost } = J_DiffPluginMetadata.defaultLayer();
  const cost = enabledDifficulties.reduce((runningCost, layer) => runningCost + layer.cost, initialCost);

  // deconstruct the static descriptors of the applied difficulty layer.
  const {
    appliedKey,
    appliedName,
    appliedDescription
  } = DifficultyLayer;

  // build the new applied difficulty layer.
  return new DifficultyBuilder(appliedName, appliedKey)
    .setDescription(appliedDescription)
    .setCost(cost)
    .buildAsLayer();
};

/**
 * Gets every layer the player currently has enabled, in the order the configurations are tracked.
 * @returns {DifficultyLayer[]}
 */
Game_Temp.prototype.enabledDifficultyLayers = function()
{
  return $gameSystem.getAllDifficultyConfigs()
    .filter(config => config.enabled)
    .map(config => this.findDifficultyLayerByKey(config.key));
};

/**
 * Gets every layer currently in force: the enabled ones, or the default layer alone when nothing is
 * enabled, mirroring {@link #buildAppliedDifficulty}.
 * @returns {DifficultyLayer[]}
 */
Game_Temp.prototype.difficultyLayersInForce = function()
{
  // grab the layers the player currently has enabled.
  const enabledDifficulties = this.enabledDifficultyLayers();

  // with nothing enabled, the default layer is what stays in force.
  if (enabledDifficulties.length === 0)
  {
    return [ J_DiffPluginMetadata.defaultLayer() ];
  }

  // otherwise, every enabled layer is.
  return enabledDifficulties;
};

/**
 * Gets the state ids the layers in force grant every actor, leaving out layers that grant none.
 * @returns {number[]}
 */
Game_Temp.prototype.actorDifficultyStateIds = function()
{
  return this.difficultyLayersInForce()
    .map(layer => layer.actorStateId)
    .filter(stateId => stateId !== 0);
};

/**
 * Gets the state ids the layers in force grant every enemy, leaving out layers that grant none.
 * @returns {number[]}
 */
Game_Temp.prototype.enemyDifficultyStateIds = function()
{
  return this.difficultyLayersInForce()
    .map(layer => layer.enemyStateId)
    .filter(stateId => stateId !== 0);
};

/**
 * Rebuilds the passive sources each side draws its difficulty states from.
 *
 * Built here, once per change, rather than on every request: J-Passive asks each battler for its
 * sources whenever it re-reads that battler's passives, and J-Passive-Conditional asks on every rule
 * sweep, so a fresh row per request would re-parse its note for every battler on every frame.
 */
Game_Temp.prototype.refreshDifficultyPassiveSources = function()
{
  // the states the layers in force grant each side.
  const actorStateIds = this.actorDifficultyStateIds();
  const enemyStateIds = this.enemyDifficultyStateIds();

  // one source per side, or none for a side nothing is granted to.
  const actorSources = this.buildDifficultyPassiveSources(actorStateIds);
  const enemySources = this.buildDifficultyPassiveSources(enemyStateIds);

  // replace what each side draws from.
  this.setActorDifficultySources(actorSources);
  this.setEnemyDifficultySources(enemySources);
};

/**
 * Builds the passive sources that grant the given states.
 * J-Passive reads a synthetic row's `<uniquePassive>` tag exactly as it reads one on a database row,
 * so one row carrying every granted id is all a side needs. Unique rather than stackable, so a state
 * two layers somehow both name is still granted once.
 * @param {number[]} stateIds The ids of the states to grant.
 * @returns {RPG_BaseItem[]} One source carrying every id, or none when there is nothing to grant.
 */
Game_Temp.prototype.buildDifficultyPassiveSources = function(stateIds)
{
  // a side nothing is granted to needs no source at all.
  if (stateIds.length === 0) return [];

  // the synthetic row: nothing but the passive tag carrying every granted id.
  const rawSource = {
    id: -1,
    meta: {},
    name: String.empty,
    note: `<uniquePassive:[${stateIds.join(',')}]>`,
    description: String.empty,
    iconIndex: 0,
  };

  // wrap it the way J-Passive wraps its own synthetic rows.
  return [ new RPG_BaseItem(rawSource, rawSource.id) ];
};

/**
 * Hands every living battler the difficulty states now in force.
 *
 * J-Passive rebuilds a battler's passives only when something about that battler changes, and a
 * difficulty toggle changes nothing about any battler, so each one has to be told. Rebuilding its
 * passives also invalidates the trait, note and parameter caches that read them.
 */
Game_Temp.prototype.refreshDifficultyPassives = function()
{
  // every actor this playthrough has built, without constructing any it has not.
  $gameActors.existingActors()
    .forEach(actor => actor.refreshPassiveStates());

  // every enemy in a stock battle.
  $gameTroop.members()
    .forEach(enemy => enemy.refreshPassiveStates());

  // every enemy on the map, when J-ABS is what spawns them; its allies are actors, refreshed above.
  if (J.ABS)
  {
    JABS_AiManager.getAllBattlers()
      .map(jabsBattler => jabsBattler.getBattler())
      .filter(battler => battler.isEnemy())
      .forEach(enemy => enemy.refreshPassiveStates());
  }
};

//region properties
/**
 * Gets the difficulty metadata staged for the layer being edited.
 * @returns {object} The staged difficulty metadata.
 */
Game_Temp.prototype.metadata = function()
{
  // hand back the metadata.
  return this._j._difficulty._metadata;
};

/**
 * Gets the all configs.
 * @returns {Map<string, DifficultyConfig>} The allConfigs.
 */
Game_Temp.prototype.allConfigs = function()
{
  // hand back the all configs.
  return this._j._difficulty._allConfigs;
};

/**
 * Gets the passive sources every actor draws its difficulty states from.
 * @returns {RPG_BaseItem[]}
 */
Game_Temp.prototype.actorDifficultySources = function()
{
  return this._j._difficulty._actorSources;
};

/**
 * Sets the passive sources every actor draws its difficulty states from.
 * @param {RPG_BaseItem[]} sources The new sources.
 */
Game_Temp.prototype.setActorDifficultySources = function(sources)
{
  this._j._difficulty._actorSources = sources;
};

/**
 * Gets the passive sources every enemy draws its difficulty states from.
 * @returns {RPG_BaseItem[]}
 */
Game_Temp.prototype.enemyDifficultySources = function()
{
  return this._j._difficulty._enemySources;
};

/**
 * Sets the passive sources every enemy draws its difficulty states from.
 * @param {RPG_BaseItem[]} sources The new sources.
 */
Game_Temp.prototype.setEnemyDifficultySources = function(sources)
{
  this._j._difficulty._enemySources = sources;
};
//endregion properties
//endregion Game_Temp