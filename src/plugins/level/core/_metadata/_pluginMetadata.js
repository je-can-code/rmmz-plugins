//region plugin metadata
class J_LevelPluginMetadata
  extends PluginMetadata
{
  /**
   * The project-relative path to this plugin's external configuration file. All tuning that used to live in
   * PluginManager parameters now lives here instead, so it can be authored from jmz-data-editor without ever
   * opening the RMMZ editor's Plugin Manager.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.level.json';

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  postInitialize()
  {
    super.postInitialize();

    this.initializeLevelMaster();
  }

  initializeLevelMaster()
  {
    // this file is required- a missing or invalid config crashes boot, same as every other config-driven
    // plugin in this codebase (J-ABS, J-SDP, J-JAFTING-Creation, Omni-Quest, J-Diff, J-Prof).
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName('J-LevelMaster')
      .configName('level configuration')
      .build();

    const config = ExternalJsonConfigLoader.load(J_LevelPluginMetadata.CONFIG_PATH, options);

    /**
     * Whether or not the scaling functionality is enabled.
     * @type {boolean}
     */
    this.enabled = config.useScaling === true;

    /**
     * The minimum multiplier that scaling can reduce to based on level difference. This should never actually be zero
     * or lower or unexpected things can happen.
     * @type {number}
     */
    this.minimumMultiplier = Number(config.minMultiplier);

    /**
     * The maximum multiplier that scaling can reach based on level difference.
     * @type {number}
     */
    this.maximumMultiplier = Number(config.maxMultiplier);

    const rewardMinRaw = config.rewardMinMultiplier;

    /**
     * The minimum multiplier for reward scaling (EXP / gold). Falls back to combat minimum when unset.
     * @type {number}
     */
    this.rewardMinimumMultiplier = (rewardMinRaw === undefined || rewardMinRaw === null || rewardMinRaw === '')
      ? this.minimumMultiplier
      : Number(rewardMinRaw);

    if (Number.isFinite(this.rewardMinimumMultiplier) === false)
    {
      this.rewardMinimumMultiplier = this.minimumMultiplier;
    }

    const rewardMaxRaw = config.rewardMaxMultiplier;

    /**
     * The maximum multiplier for reward scaling (EXP / gold). Falls back to combat maximum when unset.
     * @type {number}
     */
    this.rewardMaximumMultiplier = (rewardMaxRaw === undefined || rewardMaxRaw === null || rewardMaxRaw === '')
      ? this.maximumMultiplier
      : Number(rewardMaxRaw);

    if (Number.isFinite(this.rewardMaximumMultiplier) === false)
    {
      this.rewardMaximumMultiplier = this.maximumMultiplier;
    }

    /**
     * The amount per level up or down that applies. This amount stacks additively.
     * @type {number}
     */
    this.growthMultiplier = Number(config.growthMultiplier);

    /**
     * The upper limit from a zero level difference before scaling kicks in.
     * @type {number}
     */
    this.invariantUpperRange = Number(config.invariantUpperRange);

    /**
     * The lower limit from a zero level difference before scaling kicks in.
     * @type {number}
     */
    this.invariantLowerRange = Number(config.invariantLowerRange);

    /**
     * The variableId to set to modify the actor level balancer value. This number is directly added to all actors'
     * levels when considering scaling.
     * @type {number}
     */
    this.actorBalanceVariable = Number(config.variableActorBalancer);

    /**
     * The variableId to set to modify the enemy level balancer value. This number is directly added to all enemies'
     * levels when considering scaling.
     * @type {number}
     */
    this.enemyBalanceVariable = Number(config.variableEnemyBalancer);

    /**
     * The default max level beyond the max set by the database.
     * @type {number}
     */
    this.defaultBeyondMaxLevel = Number(config.defaultBeyondMaxLevel);

    /**
     * The true max level. No actor level can ascend beyond this. This will override actor max level if applicable.
     * @type {number}
     */
    this.trueMaxLevel = Number(config.trueMaxLevel);

    /**
     * Whether all classes share one actor-wide level/exp instead of each class leveling independently.
     * @type {boolean}
     */
    this.useSharedActorLevel = config.useSharedActorLevel === true;

    /**
     * The "basis" input to the canonical, class-independent exp curve used when {@link useSharedActorLevel} is on.
     * @type {number}
     */
    this.canonicalExpBasis = Number(config.canonicalExpBasis);

    /**
     * The "extra" input to the canonical exp curve.
     * @type {number}
     */
    this.canonicalExpExtra = Number(config.canonicalExpExtra);

    /**
     * The "acceleration A" input to the canonical exp curve.
     * @type {number}
     */
    this.canonicalExpAccA = Number(config.canonicalExpAccA);

    /**
     * The "acceleration B" input to the canonical exp curve.
     * @type {number}
     */
    this.canonicalExpAccB = Number(config.canonicalExpAccB);
  }
}

export default J_LevelPluginMetadata;
//endregion plugin metadata