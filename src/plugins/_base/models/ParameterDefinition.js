//region ParameterDefinition
import ParameterFormat from './../core/ParameterFormat.js';
import ParameterDefinitionBuilder from './ParameterDefinitionBuilder.js';
import SdpParameterBinding from './SdpParameterBinding.js';

/**
 * Immutable catalog entry for a battler parameter.
 */
class ParameterDefinition
{
  /**
   * @param {string} key The key driving this step.
   * @param {string} group The group driving this step.
   * @param {number} sortOrder The sort order driving this step.
   * @param {function(): string} label The label driving this step.
   * @param {function(): string[]} description The description driving this step.
   * @param {function(): number} iconIndex The icon index driving this step.
   * @param {function(): number} colorIndex The color index driving this step.
   * @param {string} format The format driving this step.
   * @param {function(Game_Battler): number} getValue The get value driving this step.
   * @param {SdpParameterBinding} sdpBinding The sdp binding driving this step.
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
   * Formats a numeric value for UI display.
   * @param {number} value The value driving this step.
   * @param {boolean=} withPadding The with padding driving this step.
   * @returns {string}
   */
  prettyValue(value, withPadding = false)
  {
    let num = value;

    // when this.format  equals  ParameterFormat.PERCENT, take this branch.
    if (this.format === ParameterFormat.PERCENT
      || this.format === ParameterFormat.PERCENT_CENTERED
      || this.format === ParameterFormat.PERCENT_SUFFIX
      || this.format === ParameterFormat.MULTIPLIER_PERCENT)
    {
      num *= 100;
    }

    // when this.format  equals  ParameterFormat.PERCENT_CENTERED, take this branch.
    if (this.format === ParameterFormat.PERCENT_CENTERED)
    {
      num -= 100;
    }

    // when this.format  equals  ParameterFormat.REGEN_PER_SECOND, take this branch.
    if (this.format === ParameterFormat.REGEN_PER_SECOND)
    {
      const perSecond = (num / 5);
      const regenStr = Number.isInteger(perSecond)
        ? perSecond.toString()
        : perSecond.toFixed(1);

      // hand back `${regenStr}/s` to the caller.
      return `${regenStr}/s`;
    }

    // capture base for downstream policy in this routine.
    let base = Number.isInteger(num)
      ? num.toString()
      : num.toFixed(1);

    // when base.endsWith('.0'), take this branch.
    if (base.endsWith('.0'))
    {
      base = base.slice(0, base.length - 2);
    }

    // when withPadding  and  value, take this branch.
    if (withPadding && value)
    {
      if (this.format === ParameterFormat.FLAT_LARGE)
      {
        base = String(base)
          .padZero(6);
      }
      else if (this.format === ParameterFormat.FLAT)
      {
        base = String(base)
          .padZero(4);
      }
      else if (this.format === ParameterFormat.PERCENT_CENTERED
        || this.format === ParameterFormat.PERCENT_SUFFIX)
      {
        base = String(base)
          .padZero(3);
      }
    }

    // when this.format  equals  ParameterFormat.PERCENT_SUFFIX, take this branch.
    if (this.format === ParameterFormat.PERCENT_SUFFIX)
    {
      base = `${base}%`;
    }

    // hand back base to the caller.
    return base;
  }
}

ParameterDefinition.Builder = () => new ParameterDefinitionBuilder();

export default ParameterDefinition;
//endregion ParameterDefinition