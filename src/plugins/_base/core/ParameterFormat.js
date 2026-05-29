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
   * Ex/sp value shown as a whole-number score (×100, no % suffix).
   * Used for HIT-style params that scale into the hundreds/thousands.
   * @type {string}
   */
  static SCALED_POINTS = 'scaledPoints';

  /**
   * S-param value shown as a centered whole-number score (×100 − 100, no % suffix).
   * Used for GRD-style params where 1.0 is the neutral baseline.
   * @type {string}
   */
  static SCALED_OFFSET = 'scaledOffset';

  /**
   * Multiplier shown in percent space without centering (GDR, DOR, shield rates, etc.).
   * Raw {@code 0} is neutral; tag bonuses arrive as signed factors (e.g. {@code 0.25} → {@code +025%}).
   * @type {string}
   */
  static MULTIPLIER_PERCENT = 'multiplierPercent';
}

export default ParameterFormat;
//endregion ParameterFormat