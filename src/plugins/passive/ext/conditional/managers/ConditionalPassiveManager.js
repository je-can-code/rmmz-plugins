//region ConditionalPassiveManager
import ConditionalPassiveRule from '../__models/ConditionalPassiveRule.js';

/**
 * Parses, evaluates, and reconciles conditional passive state rules for map battlers.
 */
class ConditionalPassiveManager
{
  /**
   * Re-checks whether conditional passives changed; refreshes passive state tracking when they did.
   * @param {Game_Battler} battler
   */
  static reconcile(battler)
  {
    const nextIds = ConditionalPassiveManager.resolveActiveStateIds(battler);
    const previousIds = battler.getConditionalPassiveSnapshot();

    if (ConditionalPassiveManager.#snapshotsEqual(previousIds, nextIds))
    {
      return;
    }

    // snapshot updates inside refresh after static passives rebuild.
    battler.refreshPassiveStates();
  }

  /**
   * Appends currently satisfied conditional passive state ids after J-Passive finishes a refresh.
   * @param {Game_Battler} battler
   */
  static appendActiveConditionalPassives(battler)
  {
    const activeStateIds = ConditionalPassiveManager.resolveActiveStateIds(battler);

    // cache the live evaluation so throttled reconcile can detect drift cheaply.
    battler.setConditionalPassiveSnapshot(activeStateIds);

    activeStateIds.forEach(stateId =>
    {
      battler.addPassiveStateId(stateId, false);
    });
  }

  /**
   * Collects every conditional passive rule declared on this battler's passive sources.
   * @param {Game_Battler} battler
   * @returns {ConditionalPassiveRule[]}
   */
  static collectRules(battler)
  {
    const rules = [];
    const seen = new Set();

    battler.getPassiveStateSources()
      .forEach(source =>
      {
        if (!source || !source.note) return;

        ConditionalPassiveManager.#parseRulesFromNote(source.note)
          .forEach(rule =>
          {
            const dedupeKey = `${rule.stateId}:${rule.conditionKind}:${rule.paramValue}`;

            if (seen.has(dedupeKey)) return;

            seen.add(dedupeKey);
            rules.push(rule);
          });
      });

    return rules;
  }

  /**
   * Returns passive state ids whose conditions currently pass on this battler.
   * @param {Game_Battler} battler
   * @returns {number[]}
   */
  static resolveActiveStateIds(battler)
  {
    const activeStateIds = [];

    ConditionalPassiveManager.collectRules(battler)
      .forEach(rule =>
      {
        if (ConditionalPassiveManager.evaluateRule(battler, rule) === false) return;

        activeStateIds.push(rule.stateId);
      });

    return activeStateIds;
  }

  /**
   * Evaluates a single rule against the battler's current runtime context.
   * @param {Game_Battler} battler
   * @param {ConditionalPassiveRule} rule
   * @returns {boolean}
   */
  static evaluateRule(battler, rule)
  {
    switch (rule.conditionKind)
    {
      case 'hpBelow':
        return ConditionalPassiveManager.#evaluateHpBelow(battler, rule.paramValue);
      case 'hpAbove':
        return ConditionalPassiveManager.#evaluateHpAbove(battler, rule.paramValue);
      default:
        return false;
    }
  }

  /**
   * @param {string} note
   * @returns {ConditionalPassiveRule[]}
   */
  static #parseRulesFromNote(note)
  {
    const rules = [];
    const regex = J.PASSIVE.EXT.CONDITIONAL.RegExp.ConditionalPassive;
    const scan = new RegExp(regex.source, regex.flags.replace('g', ''));

    note.split(/[\r\n]+/)
      .forEach(line =>
      {
        scan.lastIndex = 0;

        const match = scan.exec(line);

        if (match === null) return;

        const stateId = parseInt(match[1], 10);
        const conditionKind = match[2];
        const paramValue = match[3] !== undefined ? parseFloat(match[3]) : null;

        rules.push(new ConditionalPassiveRule(stateId, conditionKind, paramValue));
      });

    return rules;
  }

  /**
   * @param {Game_Battler} battler
   * @param {number|null} thresholdPercent
   * @returns {boolean}
   */
  static #evaluateHpBelow(battler, thresholdPercent)
  {
    if (thresholdPercent === null || Number.isNaN(thresholdPercent)) return false;

    const hpRatePercent = ConditionalPassiveManager.#hpRatePercent(battler);

    return hpRatePercent < thresholdPercent;
  }

  /**
   * @param {Game_Battler} battler
   * @param {number|null} thresholdPercent
   * @returns {boolean}
   */
  static #evaluateHpAbove(battler, thresholdPercent)
  {
    if (thresholdPercent === null || Number.isNaN(thresholdPercent)) return false;

    const hpRatePercent = ConditionalPassiveManager.#hpRatePercent(battler);

    return hpRatePercent > thresholdPercent;
  }

  /**
   * @param {Game_Battler} battler
   * @returns {number}
   */
  static #hpRatePercent(battler)
  {
    const mhp = battler.mhp;

    if (mhp <= 0) return 0;

    return (battler.hp / mhp) * 100;
  }

  /**
   * @param {number[]} left
   * @param {number[]} right
   * @returns {boolean}
   */
  static #snapshotsEqual(left, right)
  {
    if (left.length !== right.length) return false;

    for (let i = 0; i < left.length; i++)
    {
      if (left[i] !== right[i]) return false;
    }

    return true;
  }
}

export default ConditionalPassiveManager;
//endregion ConditionalPassiveManager