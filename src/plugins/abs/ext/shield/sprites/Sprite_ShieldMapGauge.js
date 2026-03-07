//region Sprite_ShieldMapGauge
/**
 * An implementation of the {@link Sprite_MapGauge} that renders shields.
 */
class Sprite_ShieldMapGauge
  extends Sprite_MapGauge
{
  /**
   * Constructor.
   * @param {number} bitmapWidth The width of the bitmap.
   * @param {number} bitmapHeight The height of the bitmap.
   * @param {number} gaugeHeight The actual visual gauge height.
   */
  constructor(bitmapWidth, bitmapHeight, gaugeHeight)
  {
    // perform original logic.
    super(bitmapWidth, bitmapHeight, gaugeHeight);
  }

  /**
   * Determines if this gauge can be updated.
   * @returns {boolean} True if the gauge can be updated, false otherwise.
   */
  canUpdateShieldGauge()
  {
    // if there is no battler, then we cannot update the shield gauge.
    if (!this.getBattler()) return false;

    // update the gauge.
    return true;
  }

  /**
   * Gets the current value for this gauge.
   * For shield gauges: returns the total current shield across all active shield states.
   * For all other types: defers to the base implementation.
   * @returns {number}
   */
  currentValue()
  {
    // grab the battler.
    const battler = this.getBattler();

    // if no battler is bound yet, report 0 so the gauge can still render its back track.
    if (!battler)
    {
      // return no shield value.
      return NaN;
    }

    // grab the current shield value.
    const currentShieldValue = battler.currentShieldValue();

    // check if the shield value is 0.
    if (currentShieldValue === 0)
    {
      // return no shield value.
      return NaN;
    }

    // return the shield value.
    return currentShieldValue;
  }

  /**
   * Gets the max value for this gauge.
   * For shield gauges: returns the HP reference (mhp) so shield scale matches HP gauge.
   * For all other types: defers to the base implementation.
   * @returns {number}
   */
  currentMaxValue()
  {
    // grab the battler.
    const battler = this.getBattler();

    // if no battler is bound, report 0 to avoid NaN math.
    if (!battler)
    {
      // return no shield cap.
      return NaN;
    }

    // grab the shield cap value.
    const capShieldValue = battler.currentShieldCap();

    // check if the shield cap is 0.
    if (capShieldValue === 0)
    {
      // return no shield cap.
      return NaN;
    }

    // return the shield cap value.
    return capShieldValue;
  }

  /**
   * Overrides {@link #gaugeColor1}.<br/>
   * Returns the shield gauge color gradient 1.
   * @returns {string}
   */
  gaugeColor1()
  {
    return ColorManager.shieldGauge1();
  }

  /**
   * Overrides {@link #gaugeColor2}.<br/>
   * Returns the shield gauge color gradient 2.
   * @returns {string}
   */
  gaugeColor2()
  {
    return ColorManager.shieldGauge2();
  }

  /**
   * Explicitly return an empty label for shield map gauges.
   * This isn’t strictly required once gaugeX() is 0, but adds clarity.
   * @returns {string}
   */
  label()
  {
    return '';
  }
}

//endregion Sprite_ShieldMapGauge