//region ConditionalPassiveManager
import ConditionalPassiveRule from '../models/ConditionalPassiveRule.js';

/**
 * Parses conditional passive tags from J-Passive sources, evaluates them against live battler
 * context, and folds satisfied rules into the passive state tracker during refresh.
 */
class ConditionalPassiveManager
{
  /**
   * Compares the last cached evaluation against the live one; triggers a passive refresh only
   * when conditional membership may have changed (HP drift, new sources, etc.).
   * @param {Game_Battler} battler The battler driving this step.
   */
  static reconcile(battler)
  {
    const nextIds = this.resolveActiveStateIds(battler);
    const previousIds = battler.getConditionalPassiveSnapshot();

    // when this.#snapshotsEqual(previousIds, nextIds), take this branch.
    if (this.#snapshotsEqual(previousIds, nextIds))
    {
      return;
    }

    // refreshPassiveStates rebuilds static passives, then appendActiveConditionalPassives
    // re-evaluates rules and updates the snapshot cache.
    battler.refreshPassiveStates();
  }

  /**
   * Runs after J-Passive finishes its static passive rebuild: evaluates every rule, caches the
   * result for cheap drift checks, and merges satisfied state ids into the passive tracker.
   * @param {Game_Battler} battler The battler driving this step.
   */
  static appendActiveConditionalPassives(battler)
  {
    const activeStateIds = this.resolveActiveStateIds(battler);

    // throttled reconcile compares against this list instead of re-parsing every source each frame.
    battler.setConditionalPassiveSnapshot(activeStateIds);

    // policy step inside append active conditional passives.
    activeStateIds.forEach(stateId =>
    {
      battler.addPassiveStateId(stateId, false);
    });
  }

  /**
   * Walks every J-Passive source on the battler and collects distinct conditional rules.
   * @param {Game_Battler} battler The battler driving this step.
   * @returns {ConditionalPassiveRule[]}
   */
  static collectRules(battler)
  {
    const captures = RPGManager.getAllCapturesFromAllNotesByRegex(
      battler.getPassiveStateSources(),
      J.PASSIVE.EXT.CONDITIONAL.RegExp.ConditionalPassive
    );

    // capture rules for downstream policy in this routine.
    const rules = [];
    const seen = new Set();

    // policy step inside collect rules.
    captures.forEach(capture =>
    {
      const [stateIdRaw, conditionKind, paramRaw] = capture;
      const stateId = parseInt(stateIdRaw, 10);
      const paramValue = paramRaw !== undefined ? parseFloat(paramRaw) : null;
      const dedupeKey = `${stateId}:${conditionKind}:${paramValue}`;

      // when seen.has(dedupeKey), take this branch.
      if (seen.has(dedupeKey)) return;

      // track this key so duplicate work is skipped later.
      seen.add(dedupeKey);
      rules.push(new ConditionalPassiveRule(stateId, conditionKind, paramValue));
    });

    // hand back rules to the caller.
    return rules;
  }

  /**
   * Returns passive state ids whose conditions currently pass on this battler.
   * @param {Game_Battler} battler The battler driving this step.
   * @returns {number[]}
   */
  static resolveActiveStateIds(battler)
  {
    const activeStateIds = [];

    // policy step inside resolve active state ids.
    this.collectRules(battler)
      .forEach(rule =>
      {
        if (this.evaluateRule(battler, rule) === false) return;

        // Append the row to the working collection.
        activeStateIds.push(rule.stateId);
      });

    // hand back active state ids to the caller.
    return activeStateIds;
  }

  /**
   * Dispatches a parsed rule to the evaluator registered for its condition kind.
   * @param {Game_Battler} battler The battler driving this step.
   * @param {ConditionalPassiveRule} rule The rule driving this step.
   * @returns {boolean}
   */
  static evaluateRule(battler, rule)
  {
    switch (rule.conditionKind)
    {
      case 'hpBelow':
        return this.#evaluateHpBelow(battler, rule.paramValue);
      // handle this switch arm for the current discriminant.
      case 'hpAbove':
        return this.#evaluateHpAbove(battler, rule.paramValue);
      default:
        return false;
    }
  }

  /**
   * @param {Game_Battler} battler The battler driving this step.
   * @param {number|null} thresholdPercent The threshold percent driving this step.
   * @returns {boolean}
   */
  static #evaluateHpBelow(battler, thresholdPercent)
  {
    if (thresholdPercent === null || Number.isNaN(thresholdPercent)) return false;

    // capture hp rate percent for downstream policy in this routine.
    const hpRatePercent = this.#hpRatePercent(battler);

    // hand back hpRatePercent < thresholdPercent to the caller.
    return hpRatePercent < thresholdPercent;
  }

  /**
   * @param {Game_Battler} battler The battler driving this step.
   * @param {number|null} thresholdPercent The threshold percent driving this step.
   * @returns {boolean}
   */
  static #evaluateHpAbove(battler, thresholdPercent)
  {
    if (thresholdPercent === null || Number.isNaN(thresholdPercent)) return false;

    // capture hp rate percent for downstream policy in this routine.
    const hpRatePercent = this.#hpRatePercent(battler);

    // hand back hpRatePercent > thresholdPercent to the caller.
    return hpRatePercent > thresholdPercent;
  }

  /**
   * @param {Game_Battler} battler The battler driving this step.
   * @returns {number}
   */
  static #hpRatePercent(battler)
  {
    const { mhp } = battler;

    // when mhp <= 0, take this branch.
    if (mhp <= 0) return 0;

    // hand back (battler.hp / mhp) * 100 to the caller.
    return (battler.hp / mhp) * 100;
  }

  /**
   * @param {number[]} left The left driving this step.
   * @param {number[]} right The right driving this step.
   * @returns {boolean}
   */
  static #snapshotsEqual(left, right)
  {
    if (left.length !== right.length) return false;

    // iterate the loop counter until the guard exits.
    for (let i = 0; i < left.length; i++)
    {
      if (left[i] !== right[i]) return false;
    }

    // hand back true to the caller.
    return true;
  }
}

export default ConditionalPassiveManager;
//endregion ConditionalPassiveManager