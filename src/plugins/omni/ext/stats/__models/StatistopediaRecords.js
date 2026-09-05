//region StatistopediaRecords
/**
 * The party's lifetime combat record, in the shapes a game variable cannot hold.
 *
 * J-ABS-Metrics already keeps twenty-six counters, and keeps them in variables on purpose: an event
 * page can branch on a variable, which is what makes a trophy or a milestone message possible with
 * no code at all. Every one of those is a single number, and a single number is exactly what a
 * variable is good at.
 *
 * This model exists for the questions that are not a single number. "How many of those kills were
 * bearcats" and "which weapon has dealt the most damage over this whole save" are keyed collections,
 * and there is no arrangement of variables that answers them without reserving one variable per
 * enemy in the database. So the two stores are not rivals and neither is a copy of the other- the
 * variables hold the totals, this holds the breakdowns, and the Statistopedia reads both.
 *
 * Everything here is a raw observation. Nothing derived lives in this class: a crit rate is a
 * division of two counters that are both already recorded, and storing the quotient creates a third
 * number that can fall out of agreement with the two it came from. Rates are computed where they are
 * displayed.
 */
class StatistopediaRecords
{
  /**
   * How many of each enemy the party has defeated, keyed by database enemy id.
   *
   * Kept per-id rather than per-family because per-id is strictly more information: any grouping
   * worth showing- by family, by region, by whether the name starts with a bang- is a sum over these
   * at render time, and a grouping recorded directly could never be regrouped later.
   * @type {Map<number, number>}
   */
  _killsByEnemyId = new Map();

  /**
   * Total hp damage the party has dealt while each weapon was equipped, keyed by database weapon id.
   *
   * Attributed to the weapon rather than the skill, because "favorite weapon" is a question about
   * what the player reaches for and a single weapon fires many different skills.
   * @type {Map<number, number>}
   */
  _damageByWeaponId = new Map();

  /**
   * How many times each skill has been executed, keyed by database skill id.
   *
   * J-ABS-Metrics counts the same executions bucketed by which slot they came out of, which answers
   * "does this player lean on their mainhand" but cannot answer "which skill". Both are worth having
   * and neither derives from the other.
   * @type {Map<number, number>}
   */
  _usageBySkillId = new Map();

  /**
   * How many enemies the party has defeated on each map, keyed by map id.
   * @type {Map<number, number>}
   */
  _killsByMapId = new Map();

  /**
   * How many times the player has died on each map, keyed by map id.
   *
   * The map a player dies on repeatedly is the most useful single number in this whole model for
   * anyone tuning difficulty, which is why it is kept apart from the flat death count.
   * @type {Map<number, number>}
   */
  _deathsByMapId = new Map();

  /**
   * Every map id the party has set foot on.
   *
   * A set rather than a counter, because the interesting number is how much of the world has been
   * seen- revisiting the same town a hundred times is not exploration.
   * @type {Set<number>}
   */
  _visitedMapIds = new Set();

  /**
   * How many attacks the party has landed for damage.
   *
   * J-ABS-Metrics counts the damage those hits added up to and how many of them crit, but never the
   * hits themselves- so without this, a crit rate has a numerator and no denominator. It is the one
   * counter here that exists purely to make other numbers divisible.
   * @type {number}
   */
  _hitsLanded = 0;

  /**
   * How many attacks have landed on the party for damage.
   *
   * The defensive mirror of {@link _hitsLanded}, and the denominator for the rate of crits taken.
   * @type {number}
   */
  _hitsTaken = 0;

  /**
   * The most enemies defeated in a row without the player dying.
   * @type {number}
   */
  _longestKillStreak = 0;

  /**
   * The streak currently running, which becomes a record only if it survives to beat the one above.
   * @type {number}
   */
  _currentKillStreak = 0;

  /**
   * The most damage ever dealt past what was needed to kill something.
   *
   * Overkill is the stat that tells a player their build outgrew the content, and it is the one
   * superlative here with no defensive equivalent- there is no such thing as being killed extra.
   * @type {number}
   */
  _biggestOverkill = 0;

  /**
   * The lowest hp the player has ever been reduced to and lived.
   *
   * Zero means no close call has been recorded yet rather than a survival at zero hp, which cannot
   * happen- reaching zero is what death is. The recorder tests for the zero explicitly rather than
   * seeding this at infinity, because infinity does not survive a round trip through JSON.
   * @type {number}
   */
  _lowestHpSurvived = 0;

  /**
   * The party's lifetime kills, keyed by database enemy id.
   * @returns {Map<number, number>}
   */
  killsByEnemyId()
  {
    return this._killsByEnemyId;
  }

  /**
   * Records one defeated enemy against its database id.
   * @param {number} enemyId The database id of the enemy that was defeated.
   */
  addKillForEnemy(enemyId)
  {
    const kills = this.killsByEnemyId();
    const current = kills.get(enemyId) ?? 0;
    kills.set(enemyId, current + 1);
  }

  /**
   * The party's lifetime damage, keyed by the database id of the weapon that dealt it.
   * @returns {Map<number, number>}
   */
  damageByWeaponId()
  {
    return this._damageByWeaponId;
  }

  /**
   * Adds damage onto the running total for a weapon.
   * @param {number} weaponId The database id of the weapon that was equipped.
   * @param {number} damage The hp damage that landed.
   */
  addDamageForWeapon(weaponId, damage)
  {
    const damageTotals = this.damageByWeaponId();
    const current = damageTotals.get(weaponId) ?? 0;
    damageTotals.set(weaponId, current + damage);
  }

  /**
   * How many times each skill has been executed, keyed by database skill id.
   * @returns {Map<number, number>}
   */
  usageBySkillId()
  {
    return this._usageBySkillId;
  }

  /**
   * Records one execution of a skill.
   * @param {number} skillId The database id of the skill that was executed.
   */
  addUsageForSkill(skillId)
  {
    const usage = this.usageBySkillId();
    const current = usage.get(skillId) ?? 0;
    usage.set(skillId, current + 1);
  }

  /**
   * The party's kills, keyed by the map they happened on.
   * @returns {Map<number, number>}
   */
  killsByMapId()
  {
    return this._killsByMapId;
  }

  /**
   * Records one defeated enemy against the map it fell on.
   * @param {number} mapId The map the kill happened on.
   */
  addKillForMap(mapId)
  {
    const kills = this.killsByMapId();
    const current = kills.get(mapId) ?? 0;
    kills.set(mapId, current + 1);
  }

  /**
   * The player's deaths, keyed by the map they happened on.
   * @returns {Map<number, number>}
   */
  deathsByMapId()
  {
    return this._deathsByMapId;
  }

  /**
   * Records one player death against the map it happened on.
   * @param {number} mapId The map the death happened on.
   */
  addDeathForMap(mapId)
  {
    const deaths = this.deathsByMapId();
    const current = deaths.get(mapId) ?? 0;
    deaths.set(mapId, current + 1);
  }

  /**
   * Every map id the party has set foot on.
   * @returns {Set<number>}
   */
  visitedMapIds()
  {
    return this._visitedMapIds;
  }

  /**
   * Records that the party has now been to a map.
   * @param {number} mapId The map that was entered.
   */
  addVisitedMap(mapId)
  {
    this.visitedMapIds()
      .add(mapId);
  }

  /**
   * How many attacks the party has landed for damage.
   * @returns {number}
   */
  hitsLanded()
  {
    return this._hitsLanded;
  }

  /**
   * Sets how many attacks the party has landed for damage.
   * @param {number} value The new total.
   */
  setHitsLanded(value)
  {
    this._hitsLanded = value;
  }

  /**
   * Records one landed attack.
   */
  addHitLanded()
  {
    const landed = this.hitsLanded() + 1;
    this.setHitsLanded(landed);
  }

  /**
   * How many attacks have landed on the party for damage.
   * @returns {number}
   */
  hitsTaken()
  {
    return this._hitsTaken;
  }

  /**
   * Sets how many attacks have landed on the party for damage.
   * @param {number} value The new total.
   */
  setHitsTaken(value)
  {
    this._hitsTaken = value;
  }

  /**
   * Records one attack landing on the party.
   */
  addHitTaken()
  {
    const taken = this.hitsTaken() + 1;
    this.setHitsTaken(taken);
  }

  /**
   * The most enemies ever defeated between two deaths.
   * @returns {number}
   */
  longestKillStreak()
  {
    return this._longestKillStreak;
  }

  /**
   * Sets the longest kill streak on record.
   * @param {number} value The new record.
   */
  setLongestKillStreak(value)
  {
    this._longestKillStreak = value;
  }

  /**
   * The streak currently running.
   * @returns {number}
   */
  currentKillStreak()
  {
    return this._currentKillStreak;
  }

  /**
   * Sets the streak currently running.
   * @param {number} value The new running streak.
   */
  setCurrentKillStreak(value)
  {
    this._currentKillStreak = value;
  }

  /**
   * Extends the running streak by one, promoting it to the record if it now beats the record.
   *
   * The promotion happens here rather than on death, because a player who is mid-streak and has
   * already passed their old best should see the new number immediately- waiting until they die to
   * acknowledge it would mean the menu disagrees with what just happened on screen.
   */
  extendKillStreak()
  {
    const extended = this.currentKillStreak() + 1;
    this.setCurrentKillStreak(extended);

    // a streak that has not passed the record leaves the record where it was.
    if (extended <= this.longestKillStreak()) return;

    this.setLongestKillStreak(extended);
  }

  /**
   * Ends the running streak, leaving the record it may have set alone.
   */
  breakKillStreak()
  {
    this.setCurrentKillStreak(0);
  }

  /**
   * The most damage ever dealt past a lethal blow.
   * @returns {number}
   */
  biggestOverkill()
  {
    return this._biggestOverkill;
  }

  /**
   * Sets the biggest overkill on record.
   * @param {number} value The new record.
   */
  setBiggestOverkill(value)
  {
    this._biggestOverkill = value;
  }

  /**
   * Records a candidate against the overkill record, keeping whichever is larger.
   * @param {number} overkill The damage dealt in excess of the target's remaining hp.
   */
  recordOverkill(overkill)
  {
    // a candidate that fails to beat the record leaves the record alone.
    if (overkill <= this.biggestOverkill()) return;

    this.setBiggestOverkill(overkill);
  }

  /**
   * The lowest hp the player has ever survived at, or zero if there is no record yet.
   * @returns {number}
   */
  lowestHpSurvived()
  {
    return this._lowestHpSurvived;
  }

  /**
   * Sets the lowest hp ever survived at.
   * @param {number} value The new record.
   */
  setLowestHpSurvived(value)
  {
    this._lowestHpSurvived = value;
  }

  /**
   * Records a candidate against the closest-call record, keeping whichever is lower.
   *
   * The first survival always takes the record regardless of how comfortable it was, because a
   * record of zero means "nothing recorded" rather than "survived at zero" - without that case a
   * minimum seeded at zero could never be beaten by any real value.
   * @param {number} remainingHp The hp the player was left standing on.
   */
  recordHpSurvived(remainingHp)
  {
    // a hit that did not leave the player standing is a death, and deaths are counted elsewhere.
    if (remainingHp <= 0) return;

    const currentRecord = this.lowestHpSurvived();

    // the first record ever set has nothing to beat.
    if (currentRecord === 0)
    {
      this.setLowestHpSurvived(remainingHp);

      return;
    }

    // a candidate that is not closer than the record leaves the record alone.
    if (remainingHp >= currentRecord) return;

    this.setLowestHpSurvived(remainingHp);
  }
}

export default StatistopediaRecords;
SerializableRegistry.register(StatistopediaRecords);
//endregion StatistopediaRecords