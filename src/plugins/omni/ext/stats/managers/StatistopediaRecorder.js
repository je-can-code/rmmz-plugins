//region StatistopediaRecorder
/**
 * Files combat events into the party's {@link StatistopediaRecords}.
 *
 * This is the mirror of `JABS_MetricsManager`, and deliberately shaped like it: the engine hooks live
 * in their own files and every one of them ends in a call to a static method here, so "what counts as
 * an overkill" is answerable by reading one class instead of tracing an alias chain.
 *
 * The two recorders do not overlap. Metrics owns the lifetime counters that go into game variables so
 * events can branch on them; this owns the keyed breakdowns and the superlatives, which have no
 * variable form. Where a question needs both- a critical rate needs a count of crits from over there
 * and a count of hits from over here- the arithmetic happens at render time in
 * {@link StatistopediaService}, not in either store.
 */
class StatistopediaRecorder
{
  /**
   * The hp each battler was standing on immediately before the hit currently being applied.
   *
   * Overkill is the only statistic here that cannot be computed after the fact: the engine clamps hp
   * at zero, so by the time a hit has landed, how far past zero it would have gone is gone with it.
   * Keyed by battler uuid rather than held as a single value, because applying a skill effect can
   * provoke retaliation that applies another one before the first has finished.
   * @type {Map<string, number>}
   */
  static preHitHp = new Map();

  /**
   * Constructor.
   * A static class though, so don't build it.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * The party's record of everything a game variable cannot hold.
   * @returns {StatistopediaRecords}
   */
  static records()
  {
    return $gameParty.getStatistopediaRecords();
  }

  /**
   * Remembers what a battler was standing on before a hit lands on it.
   * @param {JABS_Battler} target The battler about to be hit.
   */
  static rememberPreHitHp(target)
  {
    const uuid = target.getUuid();
    const currentHp = target.getBattler().hp;

    StatistopediaRecorder.preHitHp.set(uuid, currentHp);
  }

  /**
   * Reads back and forgets what a battler was standing on before the hit that just landed.
   *
   * A battler with nothing remembered answers zero, which is what an overkill calculation reads as
   * "this hit did not have further to go than the target had hp" - the safe direction to be wrong in
   * for a record that only ever moves upward.
   * @param {JABS_Battler} target The battler that was hit.
   * @returns {number}
   */
  static takePreHitHp(target)
  {
    const uuid = target.getUuid();
    const remembered = StatistopediaRecorder.preHitHp.get(uuid) ?? 0;

    StatistopediaRecorder.preHitHp.delete(uuid);

    return remembered;
  }

  /**
   * Records a hit the party landed on an enemy.
   *
   * The conditions reaching this method are deliberately identical to the ones J-ABS-Metrics counts
   * its crits under. A critical rate divides one by the other, so a denominator counted under looser
   * rules than its numerator would produce a rate that could exceed one hundred percent.
   * @param {JABS_Action} action The action that landed.
   * @param {JABS_Battler} target The enemy that was struck.
   */
  static trackHitLanded(action, target)
  {
    const records = StatistopediaRecorder.records();
    const { hpDamage } = target.getBattler()
      .result();

    records.addHitLanded();

    // how far past lethal the blow went, which is only meaningful when the blow was lethal.
    const hpBefore = StatistopediaRecorder.takePreHitHp(target);
    const overkill = hpDamage - hpBefore;

    if (overkill > 0)
    {
      records.recordOverkill(overkill);
    }

    StatistopediaRecorder.trackWeaponDamage(action, hpDamage);
  }

  /**
   * Attributes damage to whatever the player was holding when they dealt it.
   *
   * Only the player's damage is attributed. An ally's contribution is real, but "favorite weapon" is
   * a question about what the person holding the controller reaches for, and folding in a weapon the
   * ally AI chose would answer a question nobody asked.
   * @param {JABS_Action} action The action that landed.
   * @param {number} hpDamage The damage it dealt.
   */
  static trackWeaponDamage(action, hpDamage)
  {
    const caster = action.getCaster();

    if (caster.isPlayer() === false) return;

    const equippedWeapons = caster.getBattler()
      .weapons();

    // an unarmed swing has no weapon to credit.
    if (equippedWeapons.length === 0) return;

    const weapon = equippedWeapons.at(0);

    StatistopediaRecorder.records()
      .addDamageForWeapon(weapon.id, hpDamage);
  }

  /**
   * Records a hit that landed on the party.
   * @param {JABS_Battler} target The ally that was struck.
   */
  static trackHitTaken(target)
  {
    const records = StatistopediaRecorder.records();

    records.addHitTaken();

    // surviving a hit is the whole point of the closest-call record, so it is measured after.
    const remainingHp = target.getBattler().hp;

    records.recordHpSurvived(remainingHp);

    // the pre-hit reading is consumed here too, so a defensive hit does not leave one behind.
    StatistopediaRecorder.takePreHitHp(target);
  }

  /**
   * Records a defeated enemy against its database id, the map it fell on, and the running streak.
   * @param {JABS_Battler} defeatedTarget The battler that was defeated.
   */
  static trackDefeatedEnemy(defeatedTarget)
  {
    // inanimate battlers are scenery the player broke, and counting a chopped tree toward a kill
    // streak would let a player farm a record out of a shrub.
    if (defeatedTarget.isInanimate() === true) return;

    const records = StatistopediaRecorder.records();
    const mapId = $gameMap.mapId();

    records.addKillForEnemy(defeatedTarget.battlerId());
    records.addKillForMap(mapId);
    records.extendKillStreak();
  }

  /**
   * Records the player's death against the map it happened on, and ends the running streak.
   */
  static trackDefeatedPlayer()
  {
    const records = StatistopediaRecorder.records();
    const mapId = $gameMap.mapId();

    records.addDeathForMap(mapId);
    records.breakKillStreak();
  }

  /**
   * Records which skill the player just executed.
   * @param {JABS_Action} action The action that was executed.
   */
  static trackSkillUsage(action)
  {
    const skill = action.getBaseSkill();

    StatistopediaRecorder.records()
      .addUsageForSkill(skill.id);
  }

  /**
   * Records that the party has now set foot on a map.
   * @param {number} mapId The map that was entered.
   */
  static trackVisitedMap(mapId)
  {
    StatistopediaRecorder.records()
      .addVisitedMap(mapId);
  }
}

export default StatistopediaRecorder;
//endregion StatistopediaRecorder