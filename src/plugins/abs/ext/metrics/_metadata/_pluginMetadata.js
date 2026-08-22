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

    this.initializeOutcomeMetadata(metrics);
    this.initializeOffenseMetadata(metrics);
    this.initializeDamageTakenMetadata(metrics);
    this.initializeMitigationMetadata(metrics);
    this.initializeUsageMetadata(metrics);
  }

  /**
   * Initializes the variables tracking who died and how often.
   * @param {object} metrics The parsed `metrics` block.
   */
  initializeOutcomeMetadata(metrics)
  {
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
     * The variable counting how many times a non-player ally has gone down.
     * @type {number}
     */
    this.alliesDownedVariableId = metrics.alliesDowned;

    /**
     * The variable counting how many times the player has been defeated.
     * @type {number}
     */
    this.numberOfDeathsVariableId = metrics.numberOfDeaths;
  }

  /**
   * Initializes the variables describing what the party dishes out.
   * @param {object} metrics The parsed `metrics` block.
   */
  initializeOffenseMetadata(metrics)
  {
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
     * The variable counting swings that an enemy evaded outright.
     *
     * This is a hit-versus-evasion roll rather than a swing at empty air, so a high count says the
     * player kept picking fights with things well above their level.
     * @type {number}
     */
    this.attacksEvadedByEnemiesVariableId = metrics.attacksEvadedByEnemies;
  }

  /**
   * Initializes the variables describing what the party absorbs.
   * @param {object} metrics The parsed `metrics` block.
   */
  initializeDamageTakenMetadata(metrics)
  {
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
  }

  /**
   * Initializes the variables describing everything the party did to make an incoming hit hurt less.
   * @param {object} metrics The parsed `metrics` block.
   */
  initializeMitigationMetadata(metrics)
  {
    /**
     * The variable counting fully negated hits of either parry kind.
     *
     * Both the passive roll and the deliberate button press write the same outcome, so this is the
     * combined total. Subtracting the precise tally from it yields the passive one, which is why no
     * variable is spent holding that separately.
     * @type {number}
     */
    this.numberOfParriesVariableId = metrics.numberOfParries;

    /**
     * The variable counting parries earned by holding guard inside the parry window.
     *
     * The deliberate half of the parry system, and the one worth being smug about.
     * @type {number}
     */
    this.numberOfPreciseParriesVariableId = metrics.numberOfPreciseParries;

    /**
     * The variable counting glancing blows- the partial parry, which still lands but for less.
     * @type {number}
     */
    this.numberOfGlancingBlowsVariableId = metrics.numberOfGlancingBlows;

    /**
     * The variable counting hits that landed on a battler who was actively guarding.
     * @type {number}
     */
    this.numberOfGuardedHitsVariableId = metrics.numberOfGuardedHits;

    /**
     * The variable counting incoming attacks the party evaded outright.
     * @type {number}
     */
    this.attacksEvadedByPartyVariableId = metrics.attacksEvadedByParty;

    /**
     * The variable accumulating the damage guarding subtracted from incoming hits.
     *
     * The single most legible answer to "was holding guard worth it" - a player who never raised it
     * reads zero here, and one who lived on it reads a number rivaling their total damage taken.
     * @type {number}
     */
    this.damagePreventedByGuardingVariableId = metrics.damagePreventedByGuarding;
  }

  /**
   * Initializes the variables describing which inputs the player actually reaches for.
   * @param {object} metrics The parsed `metrics` block.
   */
  initializeUsageMetadata(metrics)
  {
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
     * The variable counting how many times the player raised their guard.
     *
     * Counted on the transition into guarding rather than per frame held, so this answers "how often
     * did they reach for it" instead of "how long did they lean on it".
     * @type {number}
     */
    this.guardActivationsVariableId = metrics.guardActivations;

    /**
     * The variable counting tool slot usage.
     * @type {number}
     */
    this.toolUsageVariableId = metrics.toolUsage;

    /**
     * The variable counting usable item slot usage.
     * @type {number}
     */
    this.usableItemUsageVariableId = metrics.usableItemUsage;
  }
}

export default JAbsMetrics_PluginMetadata;
//endregion plugin metadata