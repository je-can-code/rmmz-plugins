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
   * @param {string} key
   * @param {string} group
   * @param {number} sortOrder
   * @param {function(): string} label
   * @param {function(): string[]} description
   * @param {function(): number} iconIndex
   * @param {function(): number} colorIndex
   * @param {string} format
   * @param {string} displayPolicy
   * @param {function(Game_Battler): number} getValue
   * @param {SdpParameterBinding} sdpBinding
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
    this.label = label;
    this.description = description;
    this.iconIndex = iconIndex;
    this.colorIndex = colorIndex;
    this.format = format;
    this.displayPolicy = displayPolicy;
    this.getValue = getValue;
    this.sdpBinding = sdpBinding;
  }

  /**
   * Resolves the live value for the given battler.
   * @param {Game_Battler} battler
   * @returns {number}
   */
  resolveValue(battler)
  {
    return this.getValue(battler);
  }

  /**
   * Pads a signed magnitude for styled numeric display.
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
   * @param {number} value
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
   * @returns {boolean}
   */
  clampsDisplayAtMinus100()
  {
    return this.usesSignColumn();
  }

  /**
   * Clamps the UI magnitude according to this definition's display policy.
   * @param {number} num
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
   * Resolves a fixed sentinel label when a rate hits its display floor.
   * @param {number} value
   * @returns {string|null}
   */
  resolveDisplaySentinel(value)
  {
    const num = this.displayMagnitude(value);

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
   * @param {number} value
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
   * Formats a numeric value for UI display.
   * @param {number} value
   * @param {boolean=} withPadding
   * @returns {string}
   */
  prettyValue(value, withPadding = false)
  {
    const sentinel = this.resolveDisplaySentinel(value);

    if (sentinel)
    {
      return sentinel;
    }

    const num = this.clampDisplayMagnitude(this.displayMagnitude(value));

    if (this.format === ParameterFormat.REGEN_PER_SECOND)
    {
      const perSecond = (num / 5);

      // always one decimal so 4/s and 0.0/s read consistently on the status grid.
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
   * @param {string} base The un-padded display string.
   * @param {number} num The transformed numeric magnitude used for padding.
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