//region ParameterFormat
/**
 * Display formatting policy for a {@link ParameterDefinition}.
 */
class ParameterFormat
{
  /**
   * Whole-number base parameter (ATK, DEF, HIT, etc.).
   * @type {string}
   */
  static FLAT = 'flat';

  /**
   * Large pool base parameter (MHP, MMP).
   * @type {string}
   */
  static FLAT_LARGE = 'flatLarge';

  /**
   * Ex-parameter rate shown in percent space (multiply by 100).
   * @type {string}
   */
  static PERCENT = 'percent';

  /**
   * S-parameter rate centered around zero (multiply by 100, subtract 100).
   * @type {string}
   */
  static PERCENT_CENTERED = 'percentCentered';

  /**
   * Regeneration rate shown as per-second (divide engine tick by 5).
   * @type {string}
   */
  static REGEN_PER_SECOND = 'regenPerSecond';

  /**
   * Percent stat with explicit suffix (CDM, CDR, CNT, MRF, etc.).
   * @type {string}
   */
  static PERCENT_SUFFIX = 'percentSuffix';

  /**
   * Multiplier shown in percent space without centering (SDR, APR, etc.).
   * @type {string}
   */
  static MULTIPLIER_PERCENT = 'multiplierPercent';
}

export default ParameterFormat;
//endregion ParameterFormat