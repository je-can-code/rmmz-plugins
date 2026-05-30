//region PassiveRuleThreshold
/**
 * Shared threshold comparisons for passive gate rules ({@code *Above/*Below} and {@code allAllies*}).<br/>
 * Authors write hundred-scale integers in tags for x/sparam registry keys (e.g. {@code 25} means 25% crit).
 */
class PassiveRuleThreshold
{
  /**
   * Current hp/mp/tp keys compared as percent of max.
   * @type {string[]}
   */
  static CURRENT_RESOURCE_KEYS = [ 'hp', 'mp', 'tp' ];

  /**
   * Max hp/mp/tp keys compared as flat values from {@link Game_Battler#parameter}.
   * @type {string[]}
   */
  static MAX_RESOURCE_KEYS = [ 'mhp', 'mmp', 'mtp' ];

  /**
   * Compares one battler against a threshold using inclusive Above/Below semantics.<br/>
   * {@code hpAbove, 50} passes at exactly 50%; {@code hpBelow, 25} passes at exactly 25%.
   * @param {Game_Battler} battler The battler whose live value we read.
   * @param {string} key Resource or registry key (hp, cri, mhp, etc.).
   * @param {string} direction {@code 'above'} or {@code 'below'} parsed from the rule kind suffix.
   * @param {number} threshold Tag integer to compare against (percent or flat per key type).
   * @returns {boolean} Whether the battler satisfies the inclusive threshold.
   */
  static compare(battler, key, direction, threshold)
  {
    // resolve the live left-hand value for this key on the battler.
    const value = this.resolveRuleValue(battler, key);

    // *Above means >= threshold; *Below means <= threshold (inclusive on both edges).
    if (direction === 'above')
    {
      return value >= threshold;
    }

    // below branch — same inclusivity policy on the low side.
    return value <= threshold;
  }

  /**
   * Resolves the left-hand value for a threshold key on one battler.<br/>
   * Routes current resources to percent, max resources to flat totals, everything else to registry.
   * @param {Game_Battler} battler The battler whose value we resolve.
   * @param {string} key Resource or registry key from the parsed rule kind.
   * @returns {number} Integer comparison value in tag authoring units.
   */
  static resolveRuleValue(battler, key)
  {
    // current resources are always percent-of-max for gate and stack math.
    if (this.CURRENT_RESOURCE_KEYS.includes(key))
    {
      return this.#currentResourcePercent(battler, key);
    }

    // max resources are flat parameter totals.
    if (this.MAX_RESOURCE_KEYS.includes(key))
    {
      return battler.parameter(key);
    }

    // everything else routes through ParameterRegistry (cri, sdp stats, etc.).
    return this.#registryIntegerValue(battler, key);
  }

  /**
   * Converts current hp/mp/tp into a whole-number percent of max for threshold and stack math.
   * @param {Game_Battler} battler The battler whose resource we read.
   * @param {string} resource One of {@code hp}, {@code mp}, or {@code tp}.
   * @returns {number} Rounded percent 0–100; zero when max is zero.
   */
  static #currentResourcePercent(battler, resource)
  {
    switch (resource)
    {
      case 'hp':
      {
        const { mhp } = battler;

        // guard divide-by-zero on dead or zero-max battlers.
        if (mhp <= 0) return 0;

        // hand back Math.round((battler.hp / mhp) * 100) to the caller.
        return Math.round((battler.hp / mhp) * 100);
      }
      case 'mp':
      {
        const { mmp } = battler;

        // guard divide-by-zero when the battler has no mp pool.
        if (mmp <= 0) return 0;

        // hand back Math.round((battler.mp / mmp) * 100) to the caller.
        return Math.round((battler.mp / mmp) * 100);
      }
      case 'tp':
      {
        const mtp = battler.maxTp();

        // guard divide-by-zero when tp max resolves to zero.
        if (mtp <= 0) return 0;

        // hand back Math.round((battler.tp / mtp) * 100) to the caller.
        return Math.round((battler.tp / mtp) * 100);
      }
      default:
        return 0;
    }
  }

  /**
   * Resolves a {@link ParameterRegistry} key into tag integer units for comparison.
   * @param {Game_Battler} battler The battler passed to the registry resolver.
   * @param {string} key Registry key such as {@code cri} or {@code rec}.
   * @returns {number} Whole-number value; unknown keys return zero (fail closed).
   */
  static #registryIntegerValue(battler, key)
  {
    const definition = ParameterRegistry.get(key);

    // unknown registry keys compare as zero so gates fail closed.
    if (!definition) return 0;

    // capture raw for downstream policy in this routine.
    const raw = definition.resolveValue(battler);

    // percent-style registry formats are authored as whole integers in tags.
    if (this.#usesHundredScale(definition.format))
    {
      return Math.round(raw * 100);
    }

    // hand back raw to the caller.
    return raw;
  }

  /**
   * Whether a registry format stores fractional values that authors write as hundred-scale integers.
   * @param {string} format {@link ParameterDefinition} format id.
   * @returns {boolean} True when tag values should be compared after multiplying raw by 100.
   */
  static #usesHundredScale(format)
  {
    // mirror ParameterFormat hundred-scale kinds without cross-ship import.
    return format === 'percent'
      || format === 'percentSuffix'
      || format === 'percentCentered'
      || format === 'multiplierPercent'
      || format === 'scaledPoints'
      || format === 'scaledOffset';
  }

  /**
   * Parses an {@code *Above/*Below} kind into key + direction when present.<br/>
   * Example: {@code hpBelow} → {@code { key: 'hp', direction: 'below' }}.
   * @param {string} kind Full rule kind from a parsed note tuple.
   * @returns {{ key: string, direction: string }|null} Parsed key/direction, or null when not a threshold kind.
   */
  static parseThresholdKind(kind)
  {
    if (kind.endsWith('Above'))
    {
      // strip the Above suffix to recover the comparison key (hp, cri, mhp, etc.).
      return {
        key: kind.slice(0, -5),
        direction: 'above',
      };
    }

    // when kind.endsWith('Below'), take this branch.
    if (kind.endsWith('Below'))
    {
      // strip the Below suffix to recover the comparison key.
      return {
        key: kind.slice(0, -5),
        direction: 'below',
      };
    }

    // not a threshold kind — caller handles discrete gate kinds separately.
    return null;
  }

  /**
   * Parses an {@code allAllies*Above/Below} kind when present.<br/>
   * Every allied JABS battler (including self) must satisfy the same threshold.
   * @param {string} kind Full rule kind from a parsed note tuple.
   * @returns {{ key: string, direction: string }|null} Parsed key/direction after the allAllies prefix.
   */
  static parseAllAlliesThresholdKind(kind)
  {
    if (kind.startsWith('allAllies') === false) return null;

    // strip the allAllies prefix and reuse single-battler threshold parsing.
    const remainder = kind.slice('allAllies'.length);

    // hand back this.parseThresholdKind(remainder) to the caller.
    return this.parseThresholdKind(remainder);
  }
}

export default PassiveRuleThreshold;
//endregion PassiveRuleThreshold