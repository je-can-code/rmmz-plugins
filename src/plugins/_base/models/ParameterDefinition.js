//region ParameterDefinition
import ParameterDisplayPolicy from './../core/ParameterDisplayPolicy.js';
import ParameterDisplaySentinel from './../core/ParameterDisplaySentinel.js';
import ParameterFormat from './../core/ParameterFormat.js';
import ParameterDefinitionBuilder from './ParameterDefinitionBuilder.js';
import SdpParameterBinding from './SdpParameterBinding.js';

/**
 * Immutable catalog entry for a battler parameter.
 */
class ParameterDefinition
{
  /**
   * @param {string} key The registry key for this parameter.
   * @param {string} group The display group this parameter belongs to.
   * @param {number} sortOrder The sort order within the group.
   * @param {function(): string} label Getter that returns the display label.
   * @param {function(): string[]} description Getter that returns the description lines.
   * @param {function(): number} iconIndex Getter that returns the icon index.
   * @param {function(): number} colorIndex Getter that returns the base color index.
   * @param {string} format The display format constant from ParameterFormat.
   * @param {string} displayPolicy The display policy constant from ParameterDisplayPolicy.
   * @param {function(Game_Battler): number} getValue Live-value resolver for a battler.
   * @param {SdpParameterBinding} sdpBinding The SDP panel binding for this parameter.
   */
  constructor(
    key,
    group,
    sortOrder,
    label,
    description,
    iconIndex,
    colorIndex,
    format,
    displayPolicy,
    getValue,
    sdpBinding)
  {
    this.key = key;
    this.group = group;
    this.sortOrder = sortOrder;
    // assign label on this instance for callers.
    this.label = label;
    this.description = description;
    this.iconIndex = iconIndex;
    // assign color index on this instance for callers.
    this.colorIndex = colorIndex;
    this.format = format;
    this.displayPolicy = displayPolicy;
    this.getValue = getValue;
    this.sdpBinding = sdpBinding;
  }

  /**
   * Resolves the live value for the given battler.
   * @param {Game_Battler} battler The battler driving this step.
   * @returns {number}
   */
  resolveValue(battler)
  {
    return this.getValue(battler);
  }

  /**
   * Pads a signed magnitude for styled numeric display, optionally reserving a sign column so
   * signed and unsigned rows align when drawn next to each other.
   * @param {number} num The rounded display magnitude.
   * @param {number} digits Minimum digit width after padding.
   * @param {boolean=} reserveSignColumn When true, zero uses a leading space so values align with signed rows.
   * @param {boolean=} showPlusForPositive When true, positive values render with a leading {@code +}.
   * @returns {string}
   */
  static padSignedMagnitude(num, digits, reserveSignColumn = false, showPlusForPositive = false)
  {
    const rounded = Math.round(num);
    const padded = Math.abs(rounded)
      .padZero(digits);

    if (rounded < 0)
    {
      return `-${padded}`;
    }

    if (showPlusForPositive && rounded > 0)
    {
      return `+${padded}`;
    }

    if (reserveSignColumn && rounded === 0)
    {
      return ` ${padded}`;
    }

    return padded;
  }

  /**
   * Transforms a raw battler value into the numeric magnitude shown in the UI.
   * Percent and regen formats are multiplied by 100; centered formats also subtract 100 for the delta.
   * @param {number} value The raw battler value.
   * @returns {number}
   */
  displayMagnitude(value)
  {
    let num = value;

    if (this.format === ParameterFormat.PERCENT
      || this.format === ParameterFormat.PERCENT_CENTERED
      || this.format === ParameterFormat.PERCENT_SUFFIX
      || this.format === ParameterFormat.MULTIPLIER_PERCENT
      || this.format === ParameterFormat.SCALED_POINTS
      || this.format === ParameterFormat.SCALED_OFFSET
      || this.format === ParameterFormat.REGEN_PER_SECOND)
    {
      // regen xparams are stored as fractions; native flat (JABS regen math) is value * 100.
      num *= 100;
    }

    if (this.format === ParameterFormat.PERCENT_CENTERED
      || this.format === ParameterFormat.SCALED_OFFSET)
    {
      num -= 100;
    }

    return num;
  }

  /**
   * Whether this parameter reserves a sign column when padded on the status screen.
   * Rate-based display policies all use a sign column so values align visually.
   * @returns {boolean}
   */
  usesSignColumn()
  {
    return this.displayPolicy === ParameterDisplayPolicy.COST_RATE
      || this.displayPolicy === ParameterDisplayPolicy.DAMAGE_RATE
      || this.displayPolicy === ParameterDisplayPolicy.REWARD_RATE
      || this.displayPolicy === ParameterDisplayPolicy.SIGNED;
  }

  /**
   * Whether positive magnitudes should show a leading plus in the sign column.
   * Reward-rate and signed policies use the plus to make gains visually distinct.
   * @returns {boolean}
   */
  usesPlusOnPositive()
  {
    return this.displayPolicy === ParameterDisplayPolicy.COST_RATE
      || this.displayPolicy === ParameterDisplayPolicy.REWARD_RATE
      || this.displayPolicy === ParameterDisplayPolicy.SIGNED;
  }

  /**
   * Whether display magnitude should be clamped at {@code -100%} before formatting.
   * Clamping applies to any policy that uses a sign column.
   * @returns {boolean}
   */
  clampsDisplayAtMinus100()
  {
    return this.usesSignColumn();
  }

  /**
   * Clamps the UI magnitude according to this definition's display policy.
   * Rate-based policies cannot go below -100 (100% reduction = floor).
   * @param {number} num The unclamped display magnitude.
   * @returns {number}
   */
  clampDisplayMagnitude(num)
  {
    if (this.clampsDisplayAtMinus100())
    {
      return Math.max(num, -100);
    }

    return num;
  }

  /**
   * Resolves a fixed sentinel label when a rate hits its display floor (-100%).
   * Returns {@code null} when the value is above the floor and no sentinel applies.
   * @param {number} value The raw battler value to evaluate.
   * @returns {string|null}
   */
  resolveDisplaySentinel(value)
  {
    const num = this.displayMagnitude(value);

    // magnitude above the floor means no sentinel is needed.
    if (num > -100)
    {
      return null;
    }

    if (this.displayPolicy === ParameterDisplayPolicy.COST_RATE)
    {
      return ParameterDisplaySentinel.FREE;
    }

    if (this.displayPolicy === ParameterDisplayPolicy.DAMAGE_RATE)
    {
      return ParameterDisplaySentinel.IMMUNE;
    }

    if (this.displayPolicy === ParameterDisplayPolicy.REWARD_RATE
      || this.displayPolicy === ParameterDisplayPolicy.SIGNED)
    {
      return ParameterDisplaySentinel.NONE;
    }

    return null;
  }

  /**
   * Resolves the text color index for a live value on the status screen.
   * Sentinel states and rate-direction policies each map to distinct palette entries.
   * @param {number} value The raw battler value to evaluate.
   * @returns {number}
   */
  resolveDisplayColorIndex(value)
  {
    const sentinel = this.resolveDisplaySentinel(value);

    if (sentinel === ParameterDisplaySentinel.FREE)
    {
      return 3;
    }

    if (sentinel === ParameterDisplaySentinel.IMMUNE)
    {
      return 7;
    }

    if (sentinel === ParameterDisplaySentinel.NONE)
    {
      return 10;
    }

    const num = this.clampDisplayMagnitude(this.displayMagnitude(value));

    if (this.displayPolicy === ParameterDisplayPolicy.DAMAGE_RATE
      || this.displayPolicy === ParameterDisplayPolicy.COST_RATE)
    {
      // reductions (negative) are beneficial for these policies.
      if (num < 0)
      {
        return 3;
      }

      if (num > 0)
      {
        return 10;
      }

      return 0;
    }

    if (this.displayPolicy === ParameterDisplayPolicy.REWARD_RATE)
    {
      // gains (positive) are beneficial for reward policies.
      if (num > 0)
      {
        return 3;
      }

      if (num < 0)
      {
        return 10;
      }

      return 0;
    }

    return this.colorIndex();
  }

  /**
   * Formats a numeric value for UI display, applying sentinel labels, regen formatting,
   * padding, and percent suffixes as dictated by the format and display policy.
   * @param {number} value The raw battler value to format.
   * @param {boolean=} withPadding True to apply zero-padding for styled stat columns; defaults to false.
   * @param {Game_Battler=} actor The battler whose tick cadence resolves REGEN_PER_SECOND's
   * conversion. Optional so `_base` stays decoupled from J-ABS; when omitted (or J-ABS isn't
   * loaded), falls back to a neutral 1 tick/sec assumption rather than crashing.
   * @returns {string}
   */
  prettyValue(value, withPadding = false, actor = null)
  {
    const sentinel = this.resolveDisplaySentinel(value);

    // sentinel strings (FREE, IMMUNE, NONE) replace the numeric display entirely.
    if (sentinel)
    {
      return sentinel;
    }

    const num = this.clampDisplayMagnitude(this.displayMagnitude(value));

    if (this.format === ParameterFormat.REGEN_PER_SECOND)
    {
      // num is a per-tick amount (see JABS_Battler#calculatedRegen)- convert to per-second using
      // this actor's actual resolved tick interval rather than assuming a fixed tick count, so the
      // preview stays accurate regardless of tick speed modifiers from gear/passives/states.
      const ticksPerSecond = (actor && actor.getNaturalRegenTickInterval)
        ? (60 / actor.getNaturalRegenTickInterval())
        : 1;
      const perSecond = num * ticksPerSecond;

      // always one decimal so 4.0/s and 0.0/s read consistently on the status grid.
      return `${perSecond.toFixed(1)}/s`;
    }

    let base = Number.isInteger(num)
      ? num.toString()
      : num.toFixed(1);

    if (base.endsWith('.0'))
    {
      base = base.slice(0, base.length - 2);
    }

    if (withPadding)
    {
      base = this.applyPaddedDisplay(base, num);
    }

    if (this.format === ParameterFormat.PERCENT_SUFFIX
      || this.format === ParameterFormat.PERCENT_CENTERED
      || this.format === ParameterFormat.MULTIPLIER_PERCENT
      || this.format === ParameterFormat.PERCENT)
    {
      base = `${base}%`;
    }

    return base;
  }

  /**
   * Applies zero-padding rules for styled stat values on the status screen.
   * Each format family has its own digit width and sign-column rules.
   * @param {string} base The un-padded display string.
   * @param {number} num The transformed numeric magnitude used for padding decisions.
   * @returns {string}
   */
  applyPaddedDisplay(base, num)
  {
    if (this.format === ParameterFormat.FLAT_LARGE)
    {
      return String(base)
        .padZero(6);
    }

    if (this.format === ParameterFormat.FLAT
      || this.format === ParameterFormat.SCALED_POINTS
      || this.format === ParameterFormat.SCALED_OFFSET)
    {
      return ParameterDefinition.padSignedMagnitude(num, 4, false, false);
    }

    if (this.format === ParameterFormat.PERCENT_CENTERED)
    {
      return ParameterDefinition.padSignedMagnitude(
        num,
        3,
        this.usesSignColumn(),
        this.usesPlusOnPositive()
      );
    }

    if (this.format === ParameterFormat.PERCENT
      || this.format === ParameterFormat.PERCENT_SUFFIX
      || this.format === ParameterFormat.MULTIPLIER_PERCENT)
    {
      if (this.usesSignColumn())
      {
        return ParameterDefinition.padSignedMagnitude(
          num,
          3,
          true,
          this.usesPlusOnPositive()
        );
      }

      return Math.abs(Math.round(num))
        .padZero(3);
    }

    return base;
  }
}

ParameterDefinition.Builder = () => new ParameterDefinitionBuilder();

export default ParameterDefinition;
//endregion ParameterDefinition