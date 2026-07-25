//region AffiliationDisplay
import ParameterDefinition from './../models/ParameterDefinition.js';

/**
 * Formats affiliation rates for CMS status and Monsterpedia elementalistics.
 */
class AffiliationDisplay
{
  /**
   * Digit width for styled affiliation deltas ({@code +0200%}, {@code -0050%}).
   * @type {number}
   */
  static padDigits = 4;

  /**
   * Mask template for unknown affiliation deltas — keeps column width stable while scouting.
   * @type {string}
   */
  static maskTemplate = '+0000%';

  /**
   * Formats an affiliation rate as a relative delta or special label.
   * Shared by CMS status affiliations and Monsterpedia elementalistics.
   * @param {number} ratePercent The effective rate on a 0–100+ scale (positive magnitude).
   * @param {{ absorbed?: boolean, immune?: boolean }} flags Display modifiers.
   * @returns {{ value: string, colorIndex: number }|null} Null when the rate is unmodified baseline.
   */
  static formatDelta(ratePercent, flags = {})
  {
    const absorbed = flags.absorbed === true;
    const immune = flags.immune === true;

    if (absorbed)
    {
      const magnitude = Math.round(ratePercent);
      const diff = magnitude - 100;

      if (diff === 0)
      {
        return {
          value: 'ABSORB',
          colorIndex: 5,
        };
      }

      return {
        value: `ABSORB (${ParameterDefinition.padSignedMagnitude(diff, AffiliationDisplay.padDigits, true, true)}%)`,
        colorIndex: 5,
      };
    }

    if (immune || ratePercent <= 0)
    {
      return {
        value: 'IMMUNE',
        colorIndex: 7,
      };
    }

    const diff = Math.round(ratePercent) - 100;

    if (diff === 0)
    {
      return null;
    }

    if (diff <= -100)
    {
      return {
        value: 'IMMUNE',
        colorIndex: 7,
      };
    }

    let colorIndex = 0;

    if (diff > 0)
    {
      colorIndex = 10;
    }
    else
    {
      colorIndex = 3;
    }

    return {
      value: `${ParameterDefinition.padSignedMagnitude(diff, AffiliationDisplay.padDigits, true, true)}%`,
      colorIndex,
    };
  }

  /**
   * Resolves affiliation display text, using {@code 000%} when the rate matches baseline.
   * @param {number} ratePercent The effective rate on a 0–100+ scale (positive magnitude).
   * @param {{ absorbed?: boolean, immune?: boolean }} flags Display modifiers.
   * @returns {{ value: string, colorIndex: number }}
   */
  static resolveDisplay(ratePercent, flags = {})
  {
    const formatted = AffiliationDisplay.formatDelta(ratePercent, flags);

    if (formatted)
    {
      return formatted;
    }

    return {
      value: `${ParameterDefinition.padSignedMagnitude(0, AffiliationDisplay.padDigits, true, true)}%`,
      colorIndex: 0,
    };
  }
}

export default AffiliationDisplay;
//endregion AffiliationDisplay