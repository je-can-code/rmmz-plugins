//region plugin metadata
class J_LevelPluginMetadata
  extends PluginMetadata
{
  /**
   * The maximum level definable in the level. Any level below this can be determined without extra calculations.
   * @type {number}
   */
  static EditorMaxLevel = 99;

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
    /**
     * Whether or not the scaling functionality is enabled.
     * @type {boolean}
     */
    this.enabled = this.parsedPluginParameters['useScaling'] === "true";

    /**
     * The minimum multiplier that scaling can reduce to based on level difference. This should never actually be zero
     * or lower or unexpected things can happen.
     * @type {number}
     */
    this.minimumMultiplier = Number(this.parsedPluginParameters['minMultiplier']);

    /**
     * The maximum multiplier that scaling can reach based on level difference.
     * @type {number}
     */
    this.maximumMultiplier = Number(this.parsedPluginParameters['maxMultiplier']);

    const rewardMinRaw = this.parsedPluginParameters['rewardMinMultiplier'];

    /**
     * The minimum multiplier for reward scaling (EXP / gold). Falls back to combat minimum when unset.
     * @type {number}
     */
    this.rewardMinimumMultiplier = (rewardMinRaw === undefined || rewardMinRaw === '')
      ? this.minimumMultiplier
      : Number(rewardMinRaw);

    if (Number.isFinite(this.rewardMinimumMultiplier) === false)
    {
      this.rewardMinimumMultiplier = this.minimumMultiplier;
    }

    const rewardMaxRaw = this.parsedPluginParameters['rewardMaxMultiplier'];

    /**
     * The maximum multiplier for reward scaling (EXP / gold). Falls back to combat maximum when unset.
     * @type {number}
     */
    this.rewardMaximumMultiplier = (rewardMaxRaw === undefined || rewardMaxRaw === '')
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
    this.growthMultiplier = Number(this.parsedPluginParameters['growthMultiplier']);

    /**
     * The upper limit from a zero level difference before scaling kicks in.
     * @type {number}
     */
    this.invariantUpperRange = Number(this.parsedPluginParameters['invariantUpperRange']);

    /**
     * The lower limit from a zero level difference before scaling kicks in.
     * @type {number}
     */
    this.invariantLowerRange = Number(this.parsedPluginParameters['invariantLowerRange']);

    /**
     * The variableId to set to modify the actor level balancer value. This number is directly added to all actors'
     * levels when considering scaling.
     * @type {number}
     */
    this.actorBalanceVariable = Number(this.parsedPluginParameters['variableActorBalancer']);

    /**
     * The variableId to set to modify the enemy level balancer value. This number is directly added to all enemies'
     * levels when considering scaling.
     * @type {number}
     */
    this.enemyBalanceVariable = Number(this.parsedPluginParameters['variableEnemyBalancer']);

    /**
     * The default max level beyond the max set by the database.
     * @type {number}
     */
    this.defaultBeyondMaxLevel = Number(this.parsedPluginParameters['defaultBeyondMaxLevel']);

    /**
     * The true max level. No actor level can ascend beyond this. This will override actor max level if applicable.
     * @type {number}
     */
    this.trueMaxLevel = Number(this.parsedPluginParameters['trueMaxLevel']);
  }
}

//endregion plugin metadata