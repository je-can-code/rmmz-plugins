//region JABS_MetricsManager
/**
 * A static manager that translates combat events into game variables.
 *
 * The engine hooks that feed this live across {@link JABS_Engine}, {@link Game_Action} and
 * {@link JABS_Battler}, but the recording itself lives here so that "what counts as a critical hit"
 * is answerable without standing up a battle. It also gives the variable writes a single choke
 * point- every metric in the game flows through {@link JABS_MetricsManager.increment} or
 * {@link JABS_MetricsManager.recordHighWaterMark}, so a question like "which of these is a running
 * total and which is a personal best" is answered by looking at which helper the call used.
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

  //region outcomes
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
   * Records the downing of a non-player ally.
   */
  static trackDefeatedAlly()
  {
    this.increment(this.metadata().alliesDownedVariableId, 1);
  }

  /**
   * Records the defeat of the player.
   */
  static trackDefeatedPlayer()
  {
    this.increment(this.metadata().numberOfDeathsVariableId, 1);
  }

  //endregion outcomes

  //region offense
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
      critical,
      evaded
    } = target.getBattler()
      .result();

    // an enemy slipping the swing entirely is the only thing worth recording about a whiff.
    if (evaded === true)
    {
      this.increment(metadata.attacksEvadedByEnemiesVariableId, 1);

      return;
    }

    // a hit that dealt no hp damage- a pure state application, or a heal arriving as negative
    // damage- is not attack data, and adding a negative would walk the lifetime total backwards.
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

  //endregion offense

  //region defense
  /**
   * Records the outcome of a hit the party absorbed.
   * @param {JABS_Battler} target The ally that was struck.
   */
  static trackDefensiveData(target)
  {
    const metadata = this.metadata();

    // extract the data points from the battler's action result.
    const {
      hpDamage,
      critical,
      parried,
      glancing,
      evaded
    } = target.getBattler()
      .result();

    // a glancing blow still lands, so it is recorded alongside whatever damage got through rather
    // than instead of it.
    if (glancing === true)
    {
      this.increment(metadata.numberOfGlancingBlowsVariableId, 1);
    }

    // damage that landed and damage that was turned aside are mutually exclusive outcomes.
    if (hpDamage > 0)
    {
      this.trackDamageTaken(hpDamage, critical);

      return;
    }

    // nothing landed, so which of the ways it failed to land is what remains to be recorded.
    if (parried === true)
    {
      this.increment(metadata.numberOfParriesVariableId, 1);

      return;
    }

    if (evaded === true)
    {
      this.increment(metadata.attacksEvadedByPartyVariableId, 1);
    }
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

  //endregion defense

  //region mitigation
  /**
   * Records a parry earned by holding guard inside the parry window.
   *
   * The combined parry tally is not touched here: the deliberate parry also writes the same
   * `parried` outcome the passive one does, so it is already counted where every fully negated hit
   * is counted. Adding to both from here would double the total and make the passive count- which is
   * derived by subtraction- come out negative.
   */
  static trackPreciseParry()
  {
    this.increment(this.metadata().numberOfPreciseParriesVariableId, 1);
  }

  /**
   * Records a hit that landed on a battler who was actively guarding.
   */
  static trackGuardedHit()
  {
    this.increment(this.metadata().numberOfGuardedHitsVariableId, 1);
  }

  /**
   * Records how much damage guarding subtracted from an incoming hit.
   * @param {number} originalDamage The damage before the guard reduction was applied.
   * @param {number} reducedDamage The damage that remained after the guard reduction.
   */
  static trackDamagePrevented(originalDamage, reducedDamage)
  {
    // work out what guarding actually saved.
    const prevented = originalDamage - reducedDamage;

    // a guard that improved nothing has nothing to record, and healing runs through this same path
    // as negative damage- where "prevented" would be a nonsense number pointing the wrong way.
    if (prevented <= 0) return;

    this.increment(this.metadata().damagePreventedByGuardingVariableId, prevented);
  }

  //endregion mitigation

  //region usage
  /**
   * Records that the player raised their guard.
   */
  static trackGuardActivation()
  {
    this.increment(this.metadata().guardActivationsVariableId, 1);
  }

  /**
   * Records the use of an item out of one of the two item-bearing slots.
   *
   * Counted here rather than off the executed map action, because an item only produces a map action
   * when it has a skill attached to it- so a plain healing potion would never be counted at all.
   * @param {string} buttonType The slot the item was used from.
   */
  static trackItemUsage(buttonType)
  {
    const metadata = this.metadata();

    // the two item slots are counted apart: a tool is a piece of equipment the player chose to
    // carry, while the usable item slot is whatever consumable was to hand.
    if (buttonType === JABS_Button.Tool)
    {
      this.increment(metadata.toolUsageVariableId, 1);

      return;
    }

    this.increment(metadata.usableItemUsageVariableId, 1);
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
      case JABS_Button.Dodge:
        // a dodge executes as a real map action carrying its own cooldown key, so without a case of
        // its own it lands in the default arm and quietly inflates the equipped-skill tally.
        this.increment(metadata.dodgeSkillUsageVariableId, 1);
        break;
      case JABS_Button.Tool:
      case JABS_Button.UsableItem:
        // both item slots are counted where the item is consumed instead, which catches the ones
        // carrying no skill at all. Landing here is the action an item happened to spawn, and
        // counting it again would double every item that has one.
        break;
      default:
        // the four assignable combat slots are individually named, but nothing here cares which of
        // them it was- they are one bucket called "a skill the player chose to equip".
        this.increment(metadata.assignedSkillUsageVariableId, 1);
        break;
    }
  }

  //endregion usage
}

export default JABS_MetricsManager;
//endregion JABS_MetricsManager