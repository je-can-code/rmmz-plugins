//region StateAfflictionMapLayoutConfig
/**
 * Layout tuning for the map affliction strip.
 */
class StateAfflictionMapLayoutConfig
{
  /**
   * Multiplier applied to the standard icon width and height at render time.
   * @type {number}
   */
  iconScale = 0.5;

  /**
   * Gauge bar height in pixels.
   * @type {number}
   */
  gaugeHeight = 3;

  /**
   * Gap in pixels between the hp gauge bottom and the affliction icon row.
   * @type {number}
   */
  gapBelowHpBar = 2;

  /**
   * Vertical gap in pixels between negative and positive affliction rows.
   * @type {number}
   */
  rowGap = 4;

  /**
   * Maximum number of affliction slots rendered per row on the map.
   * @type {number}
   */
  maxSlots = 8;

  /**
   * Horizontal distance between map slots.
   * @type {number}
   */
  slotPitch = 18;

  /**
   * Builds layout config from J-ABS metadata.
   * @returns {StateAfflictionMapLayoutConfig}
   */
  static fromMetadata()
  {
    const config = new StateAfflictionMapLayoutConfig();

    config.iconScale = J.ABS.Metadata.mapAfflictionIconScale;
    config.gaugeHeight = J.ABS.Metadata.mapAfflictionGaugeHeight;
    config.gapBelowHpBar = J.ABS.Metadata.mapAfflictionGapBelowHpBar;
    config.maxSlots = J.ABS.Metadata.mapAfflictionMaxSlots;

    return config;
  }

  /**
   * Scaled icon width for map slots.
   * @returns {number}
   */
  iconWidth()
  {
    return Math.floor(ImageManager.iconWidth * this.iconScale);
  }

  /**
   * Scaled icon height for map slots.
   * @returns {number}
   */
  iconHeight()
  {
    return Math.floor(ImageManager.iconHeight * this.iconScale);
  }

  /**
   * Vertical distance from one affliction row to the next.
   * @returns {number}
   */
  rowPitchY()
  {
    return this.iconHeight() + this.gaugeHeight + 1 + this.rowGap;
  }
}

export default StateAfflictionMapLayoutConfig;
//endregion StateAfflictionMapLayoutConfig
