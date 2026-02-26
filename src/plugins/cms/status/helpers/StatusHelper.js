//region J.CMS_S.Helpers
/**
 * Text and number formatting helpers.
 */
class StatusHelper
{
  /**
   * Formats a numeric percent (e.g., 25 -> "+25%" when signed).
   * @param {number} percent The percent value.
   * @param {boolean} signed Whether to prefix a plus when positive.
   * @returns {string}
   */
  static toPercentString(percent, signed)
  {
    // choose either whole number or one decimal place.
    const base = Number.isInteger(percent)
      ? `${percent}`
      : percent.toFixed(1);

    // prefix a plus sign when signed and non‑negative.
    const sign = (signed && percent >= 0)
      ? '+'
      : String.empty;

    // return the formatted percent string.
    return `${sign}${base}%`;
  }

  /**
   * Converts a rate like 1.20 into a signed percentage delta string like "+20%".
   * @param {number} rate The multiplier rate.
   * @returns {string}
   */
  static toRateString(rate)
  {
    // convert a multiplier into a delta percent relative to 1.0.
    const delta = (rate - 1.0) * 100;

    // delegate to the percent string formatter with a leading sign.
    return this.toPercentString(delta, true);
  }
}
//endregion J.CMS_S.Helpers