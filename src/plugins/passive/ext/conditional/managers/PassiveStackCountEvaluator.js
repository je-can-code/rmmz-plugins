//region PassiveStackCountEvaluator
import PassiveRuleJabsAccess from '../helpers/PassiveRuleJabsAccess.js';
import PassiveRuleThreshold from '../helpers/PassiveRuleThreshold.js';
import PassiveGateEvaluator from './PassiveGateEvaluator.js';

/**
 * Evaluates {@link passiveStateCount} tuples into stack contribution counts.<br/>
 * Returns integer stack totals per source; 0 is valid and excludes that source from the stack map upstream.
 */
class PassiveStackCountEvaluator
{
  /**
   * Evaluates one parsed {@code passiveStateCount} tuple from database notes.<br/>
   * Delegates to {@link #evaluate} after unpacking {@code [stateId, kind, param]}.
   * @param {Game_Battler} battler The battler whose live context drives the count.
   * @param {any[]} tuple Parsed note tuple {@code [stateId, kind, param]}.
   * @returns {number} Stack contribution from this source (0 is valid).
   */
  static evaluateTuple(battler, tuple)
  {
    // state id is tuple[0]; kind and param drive the scaling formula.
    const [ , kind, param ] = tuple;

    // hand back this.evaluate(battler, kind, param) to the caller.
    return this.evaluate(battler, kind, param);
  }

  /**
   * Resolves a stack-count kind into an integer contribution for one source.<br/>
   * All formulas use {@code Math.floor(value / param)} so partial thresholds do not grant extra stacks.
   * @param {Game_Battler} battler The battler whose live context drives the count.
   * @param {string} kind Stack scaler kind from the note tuple.
   * @param {number|string|null} param Divisor or points-per-stack from the note tuple.
   * @returns {number} Stack contribution from this source (0 when kind is unknown).
   */
  static evaluate(battler, kind, param)
  {
    // per-{registryKey} kinds scale by floor(value / pointsPerStack).
    if (kind.startsWith('per-'))
    {
      return this.#evaluatePerParam(battler, kind.slice(4), Number(param));
    }

    // dispatch on the discriminant for the next policy branch.
    switch (kind)
    {
      case 'negativeStateCount':
        return Math.floor(PassiveGateEvaluator.countNegativeStates(battler) / Number(param));
      case 'alliesNearby':
        return Math.floor(PassiveRuleJabsAccess.nearbyAlliesExcludingSelf(battler).length / Number(param));

      // lessIsMore* — missing resource percent drives stacks (low hp → more stacks).
      case 'lessIsMoreHp':
        return Math.floor(this.#missingResourcePercent(battler, 'hp') / Number(param));
      case 'lessIsMoreMp':
        return Math.floor(this.#missingResourcePercent(battler, 'mp') / Number(param));
      case 'lessIsMoreTp':
        return Math.floor(this.#missingResourcePercent(battler, 'tp') / Number(param));

      // moreIsMore* — current resource percent drives stacks (high hp → more stacks).
      case 'moreIsMoreHp':
        return Math.floor(PassiveRuleThreshold.resolveRuleValue(battler, 'hp') / Number(param));
      case 'moreIsMoreMp':
        return Math.floor(PassiveRuleThreshold.resolveRuleValue(battler, 'mp') / Number(param));
      case 'moreIsMoreTp':
        return Math.floor(PassiveRuleThreshold.resolveRuleValue(battler, 'tp') / Number(param));
      default:
        // unknown scaler kinds contribute nothing rather than defaulting to 1.
        return 0;
    }
  }

  /**
   * Scales stacks from a registry or resource key using {@code per-{key}, pointsPerStack} tags.<br/>
   * Example: {@code per-cri, 3} at 9% crit → {@code floor(9 / 3) = 3} stacks.
   * @param {Game_Battler} battler The battler whose parameter value we read.
   * @param {string} key Registry or resource key after the {@code per-} prefix.
   * @param {number} pointsPerStack Tag param — every this-many points grants one stack.
   * @returns {number} Floored stack count; zero when pointsPerStack is invalid.
   */
  static #evaluatePerParam(battler, key, pointsPerStack)
  {
    // guard divide-by-zero and negative authoring mistakes.
    if (pointsPerStack <= 0) return 0;

    // capture value for downstream policy in this routine.
    const value = PassiveRuleThreshold.resolveRuleValue(battler, key);

    // hand back Math.floor(value / pointsPerStack) to the caller.
    return Math.floor(value / pointsPerStack);
  }

  /**
   * Computes how much of a resource is missing, as a percent, for {@code lessIsMore*} stack kinds.<br/>
   * Full resource → 0 missing; empty resource → 100 missing.
   * @param {Game_Battler} battler The battler whose resource we inspect.
   * @param {string} resource One of {@code hp}, {@code mp}, or {@code tp}.
   * @returns {number} Whole-number percent missing (0–100).
   */
  static #missingResourcePercent(battler, resource)
  {
    const current = PassiveRuleThreshold.resolveRuleValue(battler, resource);

    // clamp so overheal/overfill never produces negative "missing" stacks.
    return Math.max(0, 100 - current);
  }
}

export default PassiveStackCountEvaluator;
//endregion PassiveStackCountEvaluator