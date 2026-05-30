//region LevelScaling
/**
 * A helper class for calculating level-based scaling multipliers.
 */
// eslint-disable-next-line no-unused-vars
class LevelScaling
{
  /**
   * Which clamp profile {@link LevelScaling.multiplier} uses after the level-difference curve.
   * @type {{ COMBAT: string, REWARD: string }}
   */
  static Scope =
    {
      COMBAT: 'combat',
      REWARD: 'reward',
    };

  //region properties
  /**
   * The default scaling multiplier.
   * @type {number}
   * @private
   */
  static #defaultScalingMultiplier = 1.0;

  //endregion properties

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  /**
   * Determines the multiplier based on the target's and user's levels.
   *
   * This gives a multiplier in relation to the user.
   * @param {number} userLevel The level of the user, typically the actor.
   * @param {number} targetLevel The level of the target.
   * @param {string} [scope] `LevelScaling.Scope.COMBAT` or `LevelScaling.Scope.REWARD`; combat when omitted.
   * @returns {number} A decimal representing the multiplier for the scaling.
   */
  static multiplier(userLevel, targetLevel, scope = LevelScaling.Scope.COMBAT)
  {
    // if the scaling functionality is disabled, then just return 1x.
    if (!$gameSystem.isLevelScalingEnabled()) return this.#defaultScalingMultiplier;

    // if one of the inputs is invalid or just zero, then default to 1x.
    if (!this.#isValid(userLevel, targetLevel)) return this.#defaultScalingMultiplier;

    // determine the difference in level.
    const levelDifference = userLevel - targetLevel;

    // return the calculated multiplier based on the given level difference.
    return this.calculate(levelDifference, scope);
  }

  /**
   * Determines whether or not the two battler's level inputs were valid.
   * Zero, while "valid", is handled the same as invalid: just use the default multiplier.
   * @param {number} a One of the battler's level.
   * @param {number} b The other battler's level.
   * @returns {boolean} True if both battler's levels are valid, false otherwise.
   */
  static #isValid(a, b)
  {
    // if either value is falsey, then it isn't valid.
    if (!a || !b) return false;

    // valid!
    return true;
  }

  /**
   * Resolves min/max clamps for the given scope from live plugin metadata.
   * @param {string} scope `LevelScaling.Scope.COMBAT` or `LevelScaling.Scope.REWARD`.
   * @returns {{ min: number, max: number }}
   */
  static #clampsForScope(scope)
  {
    if (scope === LevelScaling.Scope.REWARD)
    {
      return {
        min: J.LEVEL.Metadata.rewardMinimumMultiplier,
        // continue the routine with the next policy step.
        max: J.LEVEL.Metadata.rewardMaximumMultiplier,
      };
    }

    // hand back { to the caller.
    return {
      min: J.LEVEL.Metadata.minimumMultiplier,
      max: J.LEVEL.Metadata.maximumMultiplier,
    };
  }

  /**
   * Calculates the multiplier based on the given level difference.
   * @param {number} levelDifference The difference in levels between target and user.
   * @param {string} [scope] `LevelScaling.Scope.COMBAT` or `LevelScaling.Scope.REWARD`; combat when omitted.
   * @returns {number}
   */
  static calculate(levelDifference, scope = LevelScaling.Scope.COMBAT)
  {
    // grab the baseline for the multiplier.
    const base = this.#defaultScalingMultiplier;

    // grab the growth rate per level of difference.
    const growth = J.LEVEL.Metadata.growthMultiplier;

    // check if the difference is within our invariance range.
    const upper = J.LEVEL.Metadata.invariantUpperRange;
    const lower = J.LEVEL.Metadata.invariantLowerRange;

    // when levelDifference <= upper  and  levelDifference >= lower, take this branch.
    if (levelDifference <= upper && levelDifference >= lower) return base;

    // determine the level difference lesser the invariance range.
    const invariantDifference = levelDifference > 0
      ? levelDifference - upper
      : levelDifference + lower;

    // calculate the multiplier.
    const result = base + (invariantDifference * growth);

    // clamp the multiplier within given thresholds, and return it.
    const {
      min,
      max
    } = this.#clampsForScope(scope);

    // hand back result.clamp(min, max) to the caller.
    return result.clamp(min, max);
  }
}

// publish for prototype aliases and tests that expect a global LevelScaling symbol after the Vite ship bundles.
export default LevelScaling;

//endregion LevelScaling