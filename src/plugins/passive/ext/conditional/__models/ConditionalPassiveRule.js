//region ConditionalPassiveRule
/**
 * One parsed {@link J.PASSIVE.EXT.CONDITIONAL.RegExp.ConditionalPassive} rule from a passive source note.
 */
class ConditionalPassiveRule
{
  /**
   * @param {number} stateId Passive state to treat as active while the condition holds.
   * @param {string} conditionKind Evaluator key (hpBelow, hpAbove, …).
   * @param {number|null} paramValue Optional numeric parameter for the evaluator.
   */
  constructor(stateId, conditionKind, paramValue)
  {
    /**
     * @type {number}
     */
    // assign state id on this instance for callers.
    this.stateId = stateId;

    // policy step inside constructor.
    /**
     * @type {string}
     */
    this.conditionKind = conditionKind;

    // policy step inside constructor.
    /**
     * @type {number|null}
     */
    this.paramValue = paramValue;
  }
}

export default ConditionalPassiveRule;
//endregion ConditionalPassiveRule