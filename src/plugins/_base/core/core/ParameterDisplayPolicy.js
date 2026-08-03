//region ParameterDisplayPolicy
/**
 * Value-aware display policy for {@link ParameterDefinition} entries.
 * Drives signed padding and dynamic status colors without changing raw battler math.
 */
class ParameterDisplayPolicy
{
  /**
   * Default catalog display — static color only, no extra sign rules.
   * @type {string}
   */
  static NONE = 'none';

  /**
   * Damage intake rates (PDR, MDR, FDR): lower is better, negative is protective.
   * @type {string}
   */
  static DAMAGE_RATE = 'damageRate';

  /**
   * Reward gain rates (EXP, gold, drops, SDP, APT): higher is better, centered at zero.
   * @type {string}
   */
  static REWARD_RATE = 'rewardRate';

  /**
   * Signed centered percent with no dynamic color (aggro).
   * @type {string}
   */
  static SIGNED = 'signed';

  /**
   * Skill cost reduction rates (HCR, etc.): lower is better, reducing what the battler pays.
   * @type {string}
   */
  static COST_RATE = 'costRate';
}

export default ParameterDisplayPolicy;
//endregion ParameterDisplayPolicy