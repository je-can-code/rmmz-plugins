//region Window_ForecastToday
import ForecastWhen from './../core/ForecastWhen.js';

/**
 * How the sky over Raevula moves through a whole day.
 *
 * All six phases rather than only the ones still to come, because a view that shortens as the day
 * wears on is a different shape every time it is opened, and because what the morning did is
 * useful for reading what the evening will.
 */
class Window_ForecastToday
  extends Window_Base
{
  /**
   * Extends {@link Window_Base.initialize}.<br/>
   * @param {Rectangle} rect The bounds of this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    this.initMembers();
  }

  /**
   * Initialize all properties of this class.
   */
  initMembers()
  {
    /**
     * The shared root namespace for all of J's plugin data.
     */
    this._j ||= {};

    /**
     * A grouping of all properties associated with the forecast.
     */
    this._j._forecast ||= {};

    /**
     * The day being drawn, or null when none is.
     * @type {?object}
     */
    this._j._forecast._digest = null;
  }

  /**
   * Gets the day currently being drawn.
   * @returns {?object} The digest.
   */
  digest()
  {
    // hand back the day on screen.
    return this._j._forecast._digest;
  }

  /**
   * Sets the day to draw, and draws it.
   * @param {object} newDigest The day to show.
   */
  setDigest(newDigest)
  {
    // assign the day on screen.
    this._j._forecast._digest = newDigest;

    this.refresh();
  }

  /**
   * How tall one phase's row is.
   * @returns {number}
   */
  rowHeight()
  {
    return this.lineHeight();
  }

  /**
   * How wide the phase-name column is.
   * @returns {number}
   */
  phaseWidth()
  {
    return Math.floor(this.innerWidth * 0.3);
  }

  /**
   * Redraws the day.
   */
  refresh()
  {
    this.contents.clear();

    const digest = this.digest();

    if (digest === null) return;

    this.drawDate(digest);
    digest.entries.forEach((entry, index) => this.drawPhase(entry, index, digest));
  }

  /**
   * Draws which day this is.
   * @param {object} digest The day being drawn.
   */
  drawDate(digest)
  {
    const { startPhase } = digest;

    // `drawTextEx` because the line carries the season as J-TIME's own text code, so it arrives
    // with the icon and colour it has everywhere else rather than being spelled out again here.
    this.drawTextEx(ForecastWhen.dateLineOf(startPhase), 0, 0, this.innerWidth);
  }

  /**
   * Draws one phase of the day.
   * @param {object} entry The phase being drawn.
   * @param {number} index Which phase this is, from the top.
   * @param {object} digest The day being drawn.
   */
  drawPhase(entry, index, digest)
  {
    const y = this.lineHeight() + (index * this.rowHeight());
    const isNow = index === digest.nowColumn;

    this.changeTextColor(isNow
      ? ColorManager.powerUpColor()
      : ColorManager.systemColor());
    this.drawText(Time_Snapshot.TimesOfDayName(entry.phaseOfDay), 0, y, this.phaseWidth(), 'left');
    this.resetTextColor();

    this.drawSky(entry.sky, this.phaseWidth(), y, isNow);
  }

  /**
   * Draws what the sky is doing at one phase.
   * @param {?object} sky What the sky is, or null when the forecast does not reach.
   * @param {number} x Where to start drawing.
   * @param {number} y The top of the row.
   * @param {boolean} isNow Whether this is the phase happening now.
   */
  drawSky(sky, x, y, isNow)
  {
    const width = this.innerWidth - x;

    if (sky === null)
    {
      this.drawText('-', x, y, width, 'left');

      return;
    }

    const config = J.WEATHER.Metadata.weatherConfig;
    const iconIndex = WeatherIcons.indexFor(config, sky.preset);
    let textX = x;

    if (iconIndex !== WeatherIcons.None)
    {
      this.drawIcon(iconIndex, x, y);
      textX = x + ImageManager.iconWidth + this.itemPadding();
    }

    // one line rather than two: the strength belongs beside the look it describes, and the whole
    // ecosystem spells this pairing exactly one way.
    const words = WeatherLabel.words(config, sky.preset, sky.intensity);

    this.changeTextColor(isNow
      ? ColorManager.powerUpColor()
      : ColorManager.normalColor());
    this.drawText(words, textX, y, width, 'left');
    this.resetTextColor();
  }
}

export default Window_ForecastToday;
//endregion Window_ForecastToday