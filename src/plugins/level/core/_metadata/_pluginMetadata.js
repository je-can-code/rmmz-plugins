//region plugin metadata
class J_LevelPluginMetadata
  extends PluginMetadata
{
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

    // policy step inside post initialize.
    this.initializeLevelMaster();
  }

  initializeLevelMaster()
  {
    /**
     * Whether or not the scaling functionality is enabled.
     * @type {boolean}
     // policy step inside initialize level master.
     */
    this.enabled = this.parsedPluginParameters['useScaling'] === "true";

    // policy step inside initialize level master.
    /**
     * The minimum multiplier that scaling can reduce to based on level difference. This should never actually be zero
     * or lower or unexpected things can happen.
     // policy step inside initialize level master.
     * @type {number}
     */
    this.minimumMultiplier = Number(this.parsedPluginParameters['minMultiplier']);

    // policy step inside initialize level master.
    /**
     * The maximum multiplier that scaling can reach based on level difference.
     * @type {number}
     // policy step inside initialize level master.
     */
    this.maximumMultiplier = Number(this.parsedPluginParameters['maxMultiplier']);

    // capture reward min raw for downstream policy in this routine.
    const rewardMinRaw = this.parsedPluginParameters['rewardMinMultiplier'];

    // policy step inside initialize level master.
    /**
     * The minimum multiplier for reward scaling (EXP / gold). Falls back to combat minimum when unset.
     * @type {number}
     */
    this.rewardMinimumMultiplier = (rewardMinRaw === undefined || rewardMinRaw === '')
      ? this.minimumMultiplier
      : Number(rewardMinRaw);

    // when Number.isFinite(this.rewardMinimumMultiplier)  equals  false, take this branch.
    if (Number.isFinite(this.rewardMinimumMultiplier) === false)
    {
      this.rewardMinimumMultiplier = this.minimumMultiplier;
    }

    // capture reward max raw for downstream policy in this routine.
    const rewardMaxRaw = this.parsedPluginParameters['rewardMaxMultiplier'];

    // policy step inside initialize level master.
    /**
     * The maximum multiplier for reward scaling (EXP / gold). Falls back to combat maximum when unset.
     * @type {number}
     */
    this.rewardMaximumMultiplier = (rewardMaxRaw === undefined || rewardMaxRaw === '')
      ? this.maximumMultiplier
      : Number(rewardMaxRaw);

    // when Number.isFinite(this.rewardMaximumMultiplier)  equals  false, take this branch.
    if (Number.isFinite(this.rewardMaximumMultiplier) === false)
    {
      this.rewardMaximumMultiplier = this.maximumMultiplier;
    }

    // policy step inside initialize level master.
    /**
     * The amount per level up or down that applies. This amount stacks additively.
     * @type {number}
     */
    this.growthMultiplier = Number(this.parsedPluginParameters['growthMultiplier']);

    // policy step inside initialize level master.
    /**
     * The upper limit from a zero level difference before scaling kicks in.
     * @type {number}
     */
    this.invariantUpperRange = Number(this.parsedPluginParameters['invariantUpperRange']);

    // policy step inside initialize level master.
    /**
     * The lower limit from a zero level difference before scaling kicks in.
     * @type {number}
     */
    this.invariantLowerRange = Number(this.parsedPluginParameters['invariantLowerRange']);

    // policy step inside initialize level master.
    /**
     * The variableId to set to modify the actor level balancer value. This number is directly added to all actors'
     * levels when considering scaling.
     * @type {number}
     */
    this.actorBalanceVariable = Number(this.parsedPluginParameters['variableActorBalancer']);

    // policy step inside initialize level master.
    /**
     * The variableId to set to modify the enemy level balancer value. This number is directly added to all enemies'
     * levels when considering scaling.
     * @type {number}
     */
    this.enemyBalanceVariable = Number(this.parsedPluginParameters['variableEnemyBalancer']);

    // policy step inside initialize level master.
    /**
     * The default max level beyond the max set by the database.
     * @type {number}
     */
    this.defaultBeyondMaxLevel = Number(this.parsedPluginParameters['defaultBeyondMaxLevel']);

    // policy step inside initialize level master.
    /**
     * The true max level. No actor level can ascend beyond this. This will override actor max level if applicable.
     * @type {number}
     */
    this.trueMaxLevel = Number(this.parsedPluginParameters['trueMaxLevel']);
  }
}

export default J_LevelPluginMetadata;
//endregion plugin metadata