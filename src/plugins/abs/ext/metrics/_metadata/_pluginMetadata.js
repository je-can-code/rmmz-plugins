//region plugin metadata
/**
 * Plugin metadata for J-ABS-Metrics.
 *
 * Every value this plugin needs is a variableId, and a variableId is a primitive that means nothing
 * on its own- which is exactly the kind of thing that belongs beside the rest of the JABS
 * configuration rather than in a plugin parameter blob nobody can diff.
 */
class JAbsMetrics_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   * @param {string} name The name of this plugin.
   * @param {string} version The semver-formatted version of this plugin.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Loads the metrics block from the external JABS config.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // initialize this plugin from external configuration.
    this.initializeMetadata();
  }

  /**
   * Initializes the metadata associated with this plugin by reading the `metrics` block from
   * `config.jabs.json`. J-ABS parses that file while its own metadata is being published, and this
   * plugin is ordered after it, so the parsed root is guaranteed to be present by the time this runs.
   */
  initializeMetadata()
  {
    const { metrics } = J.ABS.Metadata.ExternalConfig;

    /**
     * The variable counting how many animate enemies have been slain.
     * @type {number}
     */
    this.enemiesDefeatedVariableId = metrics.enemiesDefeated;

    /**
     * The variable counting how many inanimate battlers- trees, ore, crates- have been broken.
     * Kept apart from the enemy tally so a player who spent an hour chopping shrubs does not read
     * as a player who spent an hour fighting.
     * @type {number}
     */
    this.destructiblesDestroyedVariableId = metrics.destructiblesDestroyed;

    /**
     * The variable accumulating every point of hp damage the party has dealt.
     * @type {number}
     */
    this.totalDamageDealtVariableId = metrics.totalDamageDealt;

    /**
     * The variable holding the largest single hit the party has ever landed.
     * @type {number}
     */
    this.highestDamageDealtVariableId = metrics.highestDamageDealt;

    /**
     * The variable counting how many critical hits the party has landed.
     * @type {number}
     */
    this.numberOfCritsDealtVariableId = metrics.numberOfCritsDealt;

    /**
     * The variable holding the largest single critical hit the party has ever landed.
     * @type {number}
     */
    this.biggestCritDealtVariableId = metrics.biggestCritDealt;

    /**
     * The variable counting successful parries of any kind.
     * @type {number}
     */
    this.numberOfParriesVariableId = metrics.numberOfParries;

    /**
     * The variable counting parries that landed inside the precise window.
     * A precise parry also counts toward the plain parry tally- this is a subset, not a sibling.
     * @type {number}
     */
    this.numberOfPreciseParriesVariableId = metrics.numberOfPreciseParries;

    /**
     * The variable accumulating every point of hp damage the party has absorbed.
     * @type {number}
     */
    this.totalDamageTakenVariableId = metrics.totalDamageTaken;

    /**
     * The variable holding the largest single hit the party has ever absorbed.
     * @type {number}
     */
    this.highestDamageTakenVariableId = metrics.highestDamageTaken;

    /**
     * The variable counting how many critical hits have landed on the party.
     * @type {number}
     */
    this.numberOfCritsTakenVariableId = metrics.numberOfCritsTaken;

    /**
     * The variable holding the largest single critical hit the party has ever absorbed.
     * @type {number}
     */
    this.biggestCritTakenVariableId = metrics.biggestCritTaken;

    /**
     * The variable counting actions executed from the mainhand slot.
     * @type {number}
     */
    this.mainhandSkillUsageVariableId = metrics.mainhandSkillUsage;

    /**
     * The variable counting actions executed from the offhand slot.
     * @type {number}
     */
    this.offhandSkillUsageVariableId = metrics.offhandSkillUsage;

    /**
     * The variable counting actions executed from any of the four assignable combat slots.
     * @type {number}
     */
    this.assignedSkillUsageVariableId = metrics.assignedSkillUsage;

    /**
     * The variable counting dodge skill activations.
     * @type {number}
     */
    this.dodgeSkillUsageVariableId = metrics.dodgeSkillUsage;

    /**
     * The variable counting how many times the player has been defeated.
     * @type {number}
     */
    this.numberOfDeathsVariableId = metrics.numberOfDeaths;
  }
}

export default JAbsMetrics_PluginMetadata;
//endregion plugin metadata