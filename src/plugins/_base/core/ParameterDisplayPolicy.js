//region ParameterDisplayPolicy
/**
 * Value-aware display policy for {@link ParameterDefinition} entries.
 * Drives sign-column padding, dynamic status colors, and clamped sentinel labels.
 */
class ParameterDisplayPolicy
{
  /**
   * Default catalog display — static color only, no extra sign rules.
   * @type {string}
   */
  static NONE = 'none';

  /**
   * Damage intake rates (PDR, MDR, FDR): lower is better; {@code -100%} → {@link ParameterDisplaySentinel.IMMUNE}.
   * @type {string}
   */
  static DAMAGE_RATE = 'damageRate';

  /**
   * Reward gain rates (EXP, gold, drops, SDP, APT, REC, PHA): higher is better; {@code -100%} → {@link ParameterDisplaySentinel.NONE}.
   * @type {string}
   */
  static REWARD_RATE = 'rewardRate';

  /**
   * Skill cost rates (HCR, MCR, TCR): lower is better; {@code -100%} → {@link ParameterDisplaySentinel.FREE}.
   * @type {string}
   */
  static COST_RATE = 'costRate';

  /**
   * Signed centered percent with no dynamic color (aggro); {@code -100%} → {@link ParameterDisplaySentinel.NONE}.
   * @type {string}
   */
  static SIGNED = 'signed';
}

export default ParameterDisplayPolicy;
//endregion ParameterDisplayPolicy