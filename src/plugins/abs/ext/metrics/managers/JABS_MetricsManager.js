//region JABS_MetricsManager
/**
 * A static manager that translates combat events into game variables.
 *
 * The engine hooks that feed this live in {@link JABS_Engine}, but the recording itself lives here so
 * that "what counts as a critical hit" is answerable without standing up a battle. It also gives the
 * variable writes a single choke point- every metric in the game flows through
 * {@link JABS_MetricsManager.increment} or {@link JABS_MetricsManager.recordHighWaterMark}, so a
 * question like "which of these is a running total and which is a personal best" is answered by
 * looking at which helper the call used.
 */
class JABS_MetricsManager
{
  /**
   * Constructor.
   * A static class though, so don't build it.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Gets the metadata governing which variable holds which metric.
   * @returns {JAbsMetrics_PluginMetadata}
   */
  static metadata()
  {
    // hand back the metadata governing which variable holds which metric.
    return J.ABS.EXT.METRICS.Metadata;
  }

  /**
   * Adds an amount onto a running total held in a variable.
   * @param {number} variableId The variable holding the running total.
   * @param {number} amount The amount to add.
   */
  static increment(variableId, amount)
  {
    // running totals only ever grow, so a plain modification is the whole operation.
    J.BASE.Helpers.modVariable(variableId, amount);
  }

  /**
   * Records a candidate against a personal best, keeping whichever is larger.
   * @param {number} variableId The variable holding the personal best.
   * @param {number} candidate The value that may or may not be a new best.
   */
  static recordHighWaterMark(variableId, candidate)
  {
    // read whatever record currently stands.
    const currentBest = $gameVariables.value(variableId);

    // a candidate that fails to beat the record leaves the record alone.
    if (candidate <= currentBest) return;

    // the candidate is the new record.
    $gameVariables.setValue(variableId, candidate);
  }

  /**
   * Records the defeat of a battler that was not the player.
   * @param {JABS_Battler} defeatedTarget The battler that was defeated.
   */
  static trackDefeatedEnemy(defeatedTarget)
  {
    const metadata = this.metadata();

    // inanimate battlers are scenery the player broke, not opponents the player beat.
    if (defeatedTarget.isInanimate() === true)
    {
      this.increment(metadata.destructiblesDestroyedVariableId, 1);

      return;
    }

    // everything else was a fight.
    this.increment(metadata.enemiesDefeatedVariableId, 1);
  }

  /**
   * Records the defeat of the player.
   */
  static trackDefeatedPlayer()
  {
    this.increment(this.metadata().numberOfDeathsVariableId, 1);
  }

  /**
   * Records the outcome of a hit the party landed on an enemy.
   * @param {JABS_Battler} target The enemy that was struck.
   */
  static trackAttackData(target)
  {
    const metadata = this.metadata();

    // extract the data points from the battler's action result.
    const {
      hpDamage,
      critical
    } = target.getBattler()
      .result();

    // a hit that dealt no hp damage- a miss, a pure state application, a heal- is not attack data.
    if (hpDamage <= 0) return;

    // count all damage dealt.
    this.increment(metadata.totalDamageDealtVariableId, hpDamage);

    // track the highest damage dealt in a single hit.
    this.recordHighWaterMark(metadata.highestDamageDealtVariableId, hpDamage);

    // the remaining tallies only apply to critical hits.
    if (critical !== true) return;

    // count of landed critical hits.
    this.increment(metadata.numberOfCritsDealtVariableId, 1);

    // track the biggest critical hit landed.
    this.recordHighWaterMark(metadata.biggestCritDealtVariableId, hpDamage);
  }

  /**
   * Records the outcome of a hit the party absorbed.
   * @param {JABS_Battler} target The ally that was struck.
   */
  static trackDefensiveData(target)
  {
    // extract the data points from the battler's action result.
    const {
      hpDamage,
      critical,
      parried,
      preciseParried
    } = target.getBattler()
      .result();

    // damage that landed and damage that was turned aside are mutually exclusive outcomes.
    if (hpDamage > 0)
    {
      this.trackDamageTaken(hpDamage, critical);

      return;
    }

    // nothing landed, so the only thing left worth recording is whether it was deflected on purpose.
    if (parried !== true) return;

    this.trackParry(preciseParried);
  }

  /**
   * Records a hit that got through the party's defenses.
   * @param {number} hpDamage The hp damage that landed.
   * @param {boolean} critical Whether or not the hit was a critical.
   */
  static trackDamageTaken(hpDamage, critical)
  {
    const metadata = this.metadata();

    // count all damage received.
    this.increment(metadata.totalDamageTakenVariableId, hpDamage);

    // track the highest damage received in a single hit.
    this.recordHighWaterMark(metadata.highestDamageTakenVariableId, hpDamage);

    // the remaining tallies only apply to critical hits.
    if (critical !== true) return;

    // count of critical hits received.
    this.increment(metadata.numberOfCritsTakenVariableId, 1);

    // track the biggest critical hit received.
    this.recordHighWaterMark(metadata.biggestCritTakenVariableId, hpDamage);
  }

  /**
   * Records a parry the party pulled off.
   * @param {boolean} preciseParried Whether or not the parry landed inside the precise window.
   */
  static trackParry(preciseParried)
  {
    const metadata = this.metadata();

    // count of all types of successful parries.
    this.increment(metadata.numberOfParriesVariableId, 1);

    // a precise parry is a parry that also cleared a tighter bar, so it counts toward both tallies.
    if (preciseParried !== true) return;

    this.increment(metadata.numberOfPreciseParriesVariableId, 1);
  }

  /**
   * Records which slot the player just executed an action from.
   * @param {JABS_Action} action The action driving this step.
   */
  static trackActionData(action)
  {
    const metadata = this.metadata();

    // check which cooldown this is associated with.
    const cooldownType = action.getCooldownType();

    // pivot on the slot type.
    switch (cooldownType)
    {
      case JABS_Button.Mainhand:
        this.increment(metadata.mainhandSkillUsageVariableId, 1);
        break;
      case JABS_Button.Offhand:
        this.increment(metadata.offhandSkillUsageVariableId, 1);
        break;
      default:
        // the four assignable combat slots are individually named, but nothing here cares which of
        // them it was- they are one bucket called "a skill the player chose to equip".
        this.increment(metadata.assignedSkillUsageVariableId, 1);
        break;
    }
  }
}

export default JABS_MetricsManager;
//endregion JABS_MetricsManager