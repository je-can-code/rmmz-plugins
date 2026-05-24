//region StatusParameter
/**
 * The content of a single parameter being drawn in a window.
 */
class StatusParameter
{
  /**
   * The numeric value for the parameter.
   * For sp/ex parameters, this may be a decimal.
   * @type {number}
   */
  value = 0.0;

  /**
   * The "long" parameter id for this parameter.
   * @type {number}
   */
  longParamId = 0;

  /**
   * The `name` of this parameter.
   * @type {string}
   */
  name = String.empty;

  /**
   * The `iconIndex` of this parameter.
   * @type {number}
   */
  iconIndex = 0;

  /**
   * The `colorIndex` of this parameter.
   * @type {number}
   */
  colorIndex = 0;

  /**
   * Constructor.
   * @param {number} value The value of the parameter.
   * @param {number} longParamId The long parameter id this value represents.
   */
  constructor(value, longParamId)
  {
    // assign the raw numeric value of the parameter.
    this.value = value;

    // assign the long param id that describes how this value should be displayed.
    this.longParamId = longParamId;

    // refresh the derived display data for this parameter.
    this.refresh();
  }

  /**
   * Initialize the properties based on the provided
   */
  refresh()
  {
    this.name = TextManager.longParam(this.longParamId);
    this.iconIndex = IconManager.longParam(this.longParamId);
    this.colorIndex = ColorManager.longParam(this.longParamId);
  }

  /**
   * Get the pretty value of this parameter.
   * @param {boolean=} withPadding True if you want zero-padding, false otherwise; defaults to false.
   * @returns {string}
   */
  prettyValue(withPadding = false)
  {
    // start with a working numeric copy of the value.
    let num = this.value;

    // define which long param ids should be scaled to whole-number percent space.
    const multiplyBy100Ids = [
      8, 9, 10, 11, 12, 13, 14, 15, 16, 17,   // ex-params
      18, 19, 20, 21, 22, 23, 24, 25, 26, 27, // s-params
      28, 29,                                 // crit params
    ];

    // scale to percent space when applicable.
    if (multiplyBy100Ids.includes(this.longParamId))
    {
      num *= 100;
    }

    // the s-params look nicer centered around 0 instead of 100.
    const minus100Ids = [ 18, 19, 20, 21, 22, 23, 24, 25, 26, 27 ];
    if (minus100Ids.includes(this.longParamId))
    {
      num -= 100;
    }

    // handle regen values as per-second rate (engine’s native 1/5s tick assumed).
    const regenIds = [ 15, 16, 17 ];
    if (regenIds.includes(this.longParamId))
    {
      // compute the per-second rate.
      const perSecond = (num / 5);

      // if not an integer, show one decimal place; else show whole.
      const regenStr = Number.isInteger(perSecond)
        ? perSecond.toString()
        : perSecond.toFixed(1);

      // return the decorated regen string.
      return `${regenStr}/s`;
    }

    // turn numeric into a base string, trimming ".0" trailing decimals.
    let base = Number.isInteger(num)
      ? num.toString()
      : num.toFixed(1);
    if (base.endsWith('.0'))
    {
      base = base.slice(0, base.length - 2);
    }

    // apply optional left-padding on the base string before suffixes.
    if (withPadding && this.value)
    {
      // note: padding widths grouped by visual scale of the stat block.
      const pad6 = [ 0, 1 ];                           // MHP, MMP
      const pad4 = [ 2, 3, 4, 5, 6, 7, 19, 28, 29, 30 ]; // b-params, GRD, crits, MTP
      const pad3 = [ 13, 14, 18, 20, 21, 22, 23, 24, 25, 26, 27 ]; // CNT, MRF, most s-params

      if (pad6.includes(this.longParamId))
      {
        base = String(base)
          .padZero(6);
      }
      else if (pad4.includes(this.longParamId))
      {
        base = String(base)
          .padZero(4);
      }
      else if (pad3.includes(this.longParamId))
      {
        base = String(base)
          .padZero(3);
      }
    }

    // add a percent sign for the appropriate groups.
    const percentIds = [
      9, 13, 14,                 // EVA, CNT, MRF
      20, 21, 22, 23, 24, 25, 26, 27, // selected s-params
      28, 29,                    // crit params
    ];
    if (percentIds.includes(this.longParamId))
    {
      base = `${base}%`;
    }

    // return the final formatted value.
    return base;
  }
}

export default StatusParameter;
//endregion StatusParameter