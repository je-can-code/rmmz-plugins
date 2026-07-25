//region WindowGaugeOptions
import GaugeOptionsBuilder from './GaugeOptionsBuilder.js';

/**
 * The options for a gauge that shows up in the window.
 */
class WindowGaugeOptions
{
  /**
   * A factory for generating {@link WindowGaugeOptions}.
   * @returns {GaugeOptionsBuilder}
   * @constructor
   */
  static Builder = () => new GaugeOptionsBuilder();

  //region properties
  /**
   * The type of gauge to render.
   * @type {string}
   */
  gaugeType = String.empty;

  /**
   * The color of the gauge's background.
   * @type {string}
   */
  backColor = String.empty;

  /**
   * The left color gradient for the gauge.
   * @type {string}
   */
  leftGradientColor = String.empty;

  /**
   * The right color gradient for the gauge.
   * @type {string}
   */
  rightGradientColor = String.empty;

  /**
   * The color of the gauge's border.
   * @type {string}
   */
  borderColor = String.empty;

  /**
   * The thickness of the gauge's border.
   * @type {number}
   */
  borderThickness = 0;

  /**
   * The gap between the gauge's border and the inner fill area.
   * @type {number}
   */
  borderGap = 0;

  /**
   * The color of the segment dividers.
   * @type {string}
   */
  dividerColor = String.empty;

  /**
   * The number of visual segments.
   * @type {number}
   */
  segments = 1;

  /**
   * The gap between visual segments in pixels.
   * @type {number}
   */
  gap = 0;

  /**
   * The corner radius of the pill gauge in pixels.
   * @type {number}
   */
  radius = 0;

  /**
   * The thickness of the radial gauge in pixels.
   * @type {number}
   */
  thickness = 1;

  /**
   * The start angle of the radial gauge in radians.
   * @type {number}
   */
  startAngle = 0;

  //endregion properties

  /**
   * Constructor.
   */
  constructor(
    gaugeType,
    backColor,
    leftGradientColor,
    rightGradientColor,
    borderColor,
    borderThickness,
    borderGap,
    dividerColor,
    segments,
    gap,
    radius,
    thickness,
    startAngle
  )
  {
    this.gaugeType = gaugeType;
    this.backColor = backColor;
    this.leftGradientColor = leftGradientColor;
    // assign right gradient color on this instance for callers.
    this.rightGradientColor = rightGradientColor;
    this.borderColor = borderColor;
    this.borderThickness = borderThickness;
    // assign border gap on this instance for callers.
    this.borderGap = borderGap;
    this.dividerColor = dividerColor;
    this.segments = segments;
    // assign gap on this instance for callers.
    this.gap = gap;
    this.radius = radius;
    this.thickness = thickness;
    this.startAngle = startAngle;
  }
}


export default WindowGaugeOptions;
//endregion WindowGaugeOptions