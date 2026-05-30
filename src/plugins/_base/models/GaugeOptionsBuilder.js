//region GaugeOptionsBuilder
import WindowGaugeOptions from './WindowGaugeOptions.js';

/**
 * A factory for generating {@link WindowGaugeOptions}.
 * Comes with sensible defaults.
 */
class GaugeOptionsBuilder
{
  //region properties
  /**
   * The color of the gauge's background.
   * @type {string}
   */
  #backColor = String.empty;

  /**
   * The color of the gauge's border.
   * @type {string}
   */
  #borderColor = 'rgba(255, 255, 255, 0.85)';

  /**
   * The left color gradient for the gauge.
   * Blends to the right color.
   * @type {string}
   */
  #leftColor = 'rgba(179, 89, 0, 1)';

  /**
   * The right color gradient for the gauge.
   * Blends from the left color.
   * @type {string}
   */
  #rightColor = 'rgba(255, 166, 77, 1)';

  /**
   * The thickness of the gauge's border.
   * @type {number}
   */
  #borderThickness = 2;

  /**
   * The gap between the gauge's border and the inner fill area.
   * @type {number}
   */
  #borderGap = 1;

  /**
   * The color of the segment dividers.
   * @type {string}
   */
  #dividerColor = 'rgba(255, 255, 255, 0.85)';

  /**
   * The number of visual segments.
   * @type {number}
   */
  #segments = 8;

  /**
   * The gap between visual segments in pixels.
   * @type {number}
   */
  #gap = 2;

  /**
   * The corner radius of the pill gauge in pixels.
   * @type {number}
   */
  #radius = 4;

  /**
   * The thickness of the radial gauge in pixels.
   * @type {number}
   */
  #thickness = 6;

  /**
   * The start angle of the radial gauge in radians.
   * @type {number}
   */
  #startAngle = (-Math.PI / 2);

  /**
   * The type of gauge to render.
   * @type {string}
   */
  #gaugeType = Window_Base.GAUGE_TYPES.Rectangle;

  //endregion properties

  /**
   * Builds the {@link WindowGaugeOptions}.
   * @returns {WindowGaugeOptions}
   */
  build()
  {
    return new WindowGaugeOptions(
      this.#gaugeType,
      this.#backColor,
      this.#leftColor,
      this.#rightColor,
      this.#borderColor,
      this.#borderThickness,
      this.#borderGap,
      this.#dividerColor,
      this.#segments,
      this.#gap,
      this.#radius,
      this.#thickness,
      this.#startAngle,
    );
  }

  //region setters
  /**
   * The type of gauge, from {@link Window_Base.GAUGE_TYPES}.
   * @param {string} type The gauge type.
   * @returns {GaugeOptionsBuilder}
   */
  gaugeType(type)
  {
    this.#gaugeType = type;
    return this;
  }

  /**
   * Sets the gauge's background color.
   * @param {string} color The color to set.
   * @returns {GaugeOptionsBuilder}
   */
  backColor(color)
  {
    this.#backColor = color;
    return this;
  }

  /**
   * Sets the left color gradient for the gauge.
   * @param {string} color The color to set.
   * @returns {GaugeOptionsBuilder}
   */
  leftGradientColor(color)
  {
    this.#leftColor = color;
    return this;
  }

  /**
   * Sets the right color gradient for the gauge.
   * @param {string} color The color to set.
   * @returns {GaugeOptionsBuilder}
   */
  rightGradientColor(color)
  {
    this.#rightColor = color;
    return this;
  }

  /**
   * Sets the gauge’s border color.
   * @param {string} color The outline color.
   * @returns {GaugeOptionsBuilder}
   */
  borderColor(color)
  {
    this.#borderColor = color;
    return this;
  }

  /**
   * Sets the border thickness in pixels (>=1).
   * @param {number} thickness The outline thickness.
   * @returns {GaugeOptionsBuilder}
   */
  borderThickness(thickness)
  {
    this.#borderThickness = thickness;
    return this;
  }

  /**
   * Sets the padding between outline and inner fill area (>=0).
   * @param {number} gap The padding.
   * @returns {GaugeOptionsBuilder}
   */
  borderGap(gap)
  {
    this.#borderGap = gap;
    return this;
  }

  /**
   * Sets the color for segment dividers (defaults to borderColor if omitted).
   * @param {string} color The divider color.
   * @returns {GaugeOptionsBuilder}
   */
  dividerColor(color)
  {
    this.#dividerColor = color;
    return this;
  }

  /**
   * Sets the number of visual segments (>=1).
   * @param {number} count The segment count.
   * @returns {GaugeOptionsBuilder}
   */
  segments(count)
  {
    this.#segments = count;
    return this;
  }

  /**
   * Sets the inter‑segment gap in pixels (>=0).
   * @param {number} px The gap width.
   * @returns {GaugeOptionsBuilder}
   */
  gap(px)
  {
    this.#gap = px;
    return this;
  }

  /**
   * Sets the visual corner radius for pill gauges.
   * @param {number} r The radius in pixels.
   * @returns {GaugeOptionsBuilder}
   */
  radius(r)
  {
    this.#radius = r;
    return this;
  }

  /**
   * Sets the ring thickness for radial gauges.
   * @param {number|null} t The thickness in pixels; null to derive automatically.
   * @returns {GaugeOptionsBuilder}
   */
  thickness(t)
  {
    this.#thickness = t;
    return this;
  }

  /**
   * Sets the start angle for radial gauges (radians).
   * @param {number} radians The start angle.
   * @returns {GaugeOptionsBuilder}
   */
  startAngle(radians)
  {
    this.#startAngle = radians;
    return this;
  }

  //endregion setters
}

export default GaugeOptionsBuilder;
//endregion GaugeOptionsBuilder