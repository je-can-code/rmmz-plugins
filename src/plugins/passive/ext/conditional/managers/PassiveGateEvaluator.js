//region PassiveGateEvaluator
import PassiveRuleJabsAccess from '../helpers/PassiveRuleJabsAccess.js';
import PassiveRuleThreshold from '../helpers/PassiveRuleThreshold.js';

/**
 * Evaluates {@link passiveSourceRule}/{@link passiveStateRule} tuples against live battler context.<br/>
 * Every tuple on a source/state pair must pass (AND semantics); cross-source stacking is handled upstream in J-Passive.
 */
class PassiveGateEvaluator
{
  /**
   * Evaluates one gate rule kind against the battler's current map context.<br/>
   * Discrete kinds dispatch in the switch; threshold kinds fall through to {@link #evaluateThresholdKind}.
   * @param {Game_Battler} battler The battler whose context we evaluate.
   * @param {string} kind Rule kind from a parsed note tuple.
   * @param {number|string|null} param Optional tag parameter (count, threshold, slot name, frame count).
   * @returns {boolean} Whether this single tuple passes right now.
   */
  static evaluate(battler, kind, param)
  {
    switch (kind)
    {
      // proximity gates — default radius from plugin param default-proximity-tiles.
      case 'alliesNearby':
        return PassiveRuleJabsAccess.nearbyAlliesExcludingSelf(battler).length >= Number(param);
      case 'enemiesNearby':
        return PassiveRuleJabsAccess.nearbyEnemies(battler).length >= Number(param);

      // discrete state and cooldown gates.
      case 'hasState':
        return battler.isStateAffected(Number(param));
      case 'negativeStateCount':
        return this.countNegativeStates(battler) >= Number(param);
      case 'slotOnCooldown':
        return this.#isSlotOnCooldown(battler, param) === true;
      case 'slotOffCooldown':
        return this.#isSlotOnCooldown(battler, param) === false;
      case 'allOnCooldown':
        return this.#areAllSlotsOnCooldown(battler) === true;
      case 'allOffCooldown':
        return this.#areAllSlotsOnCooldown(battler) === false;

      // timing gates — frames since last stamp must meet or exceed param.
      case 'sinceLastMoved':
        return this.#framesSince(battler.getPassiveRuleLastMovedFrame()) >= Number(param);
      case 'sinceLastHit':
        return this.#framesSince(battler.getPassiveRuleLastHitFrame()) >= Number(param);
      case 'sinceLastAttacked':
        return this.#framesSince(battler.getPassiveRuleLastAttackedFrame()) >= Number(param);

      // timing gates — frames since last stamp must be within param (inclusive).
      case 'movedWithin':
        return this.#framesSince(battler.getPassiveRuleLastMovedFrame()) <= Number(param);
      case 'hitWithin':
        return this.#framesSince(battler.getPassiveRuleLastHitFrame()) <= Number(param);
      case 'attackedWithin':
        return this.#framesSince(battler.getPassiveRuleLastAttackedFrame()) <= Number(param);

      default:
        // hpAbove, criBelow, allAlliesHpAbove, etc. fall through to threshold parsing.
        return this.#evaluateThresholdKind(battler, kind, param);
    }
  }

  /**
   * Evaluates {@code *Above/*Below} and {@code allAllies*} threshold kinds.<br/>
   * Unknown kinds fail closed so tag typos do not silently grant passives.
   * @param {Game_Battler} battler The battler whose values we compare.
   * @param {string} kind Full threshold kind from the note tuple.
   * @param {number|string|null} param Tag threshold integer.
   * @returns {boolean} Whether the threshold gate passes.
   */
  static #evaluateThresholdKind(battler, kind, param)
  {
    const allAllies = PassiveRuleThreshold.parseAllAlliesThresholdKind(kind);

    if (allAllies)
    {
      // every allied battler (including self) must satisfy the same threshold.
      return PassiveRuleJabsAccess.allAlliedBattlersIncludingSelf(battler)
        .every(allyBattler =>
          PassiveRuleThreshold.compare(allyBattler, allAllies.key, allAllies.direction, Number(param)));
    }

    const threshold = PassiveRuleThreshold.parseThresholdKind(kind);

    // unknown kinds fail closed so typos do not silently grant passives.
    if (!threshold) return false;

    return PassiveRuleThreshold.compare(battler, threshold.key, threshold.direction, Number(param));
  }

  /**
   * Counts negative states currently affecting this battler.<br/>
   * Negative classification comes from {@code state.jabsNegative} / J-ABS {@code <negative>} tag.
   * @param {Game_Battler} battler The battler whose active states we inspect.
   * @returns {number} Count of states flagged negative by J-ABS.
   */
  static countNegativeStates(battler)
  {
    return battler.allStates()
      .filter(state => state && state.jabsNegative === true)
      .length;
  }

  /**
   * Whether one JABS skill slot is currently on cooldown for this battler.<br/>
   * Used by {@code slotOnCooldown} / {@code slotOffCooldown} gate kinds.
   * @param {Game_Battler} battler The battler whose slot we inspect.
   * @param {string|number} slotParam Author tag value (mainhand, skill1, raw button key, etc.).
   * @returns {boolean} True when the slot is cooling down; false when ready or off-map.
   */
  static #isSlotOnCooldown(battler, slotParam)
  {
    const jabsBattler = PassiveRuleJabsAccess.getJabsBattler(battler);

    // off-map battlers treat slots as never on cooldown for gate purposes.
    if (!jabsBattler) return false;

    const slotKey = PassiveRuleJabsAccess.resolveSlotKey(slotParam);

    // JABS reports ready === false while the slot is still cooling down.
    return jabsBattler.isSkillTypeCooldownReady(slotKey) === false;
  }

  /**
   * Whether every registered JABS skill slot is on cooldown simultaneously.<br/>
   * Used by {@code allOnCooldown} / {@code allOffCooldown} source-wide gate kinds.
   * @param {Game_Battler} battler The battler whose slot manager we inspect.
   * @returns {boolean} True only when every slot reports not-ready.
   */
  static #areAllSlotsOnCooldown(battler)
  {
    const jabsBattler = PassiveRuleJabsAccess.getJabsBattler(battler);

    if (!jabsBattler) return false;

    const slotManager = jabsBattler.getBattler().getSkillSlotManager();

    if (!slotManager) return false;

    // every registered JABS skill slot must be on cooldown for allOnCooldown to pass.
    return slotManager.getAllSlots()
      .every(slot => jabsBattler.isSkillTypeCooldownReady(slot.key) === false);
  }

  /**
   * Frames elapsed since a passive-rule timestamp was stamped.<br/>
   * Never-stamped events behave as "since forever" for sinceLast* kinds.
   * @param {number} stampFrame {@link Graphics.frameCount} when the event last occurred (0 = never).
   * @returns {number} Elapsed frames since the stamp.
   */
  static #framesSince(stampFrame)
  {
    // never stamped means "since forever" for sinceLast* and a large window for *Within rules.
    if (stampFrame <= 0) return Graphics.frameCount;

    return Graphics.frameCount - stampFrame;
  }
}

export default PassiveGateEvaluator;
//endregion PassiveGateEvaluator