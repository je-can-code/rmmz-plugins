//region Window_ForecastWeek
import SkyForecast from './../core/SkyForecast.js';

/**
 * The week ahead over Raevula, at the distance a week is actually read from.
 *
 * Three readings a day rather than six, and **no strength at all**. At this zoom the useful
 * question is whether a day is wet or clear; a second mark per cell saying how wet turns a screen
 * somebody glances at into one they have to study, and the day view is right there for anybody who
 * wants the detail.
 */
class Window_ForecastWeek
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
     * The week being drawn, or null when none is.
     * @type {?object}
     */
    this._j._forecast._digest = null;
  }

  /**
   * Gets the week currently being drawn.
   * @returns {?object} The digest.
   */
  digest()
  {
    // hand back the week on screen.
    return this._j._forecast._digest;
  }

  /**
   * Sets the week to draw, and draws it.
   * @param {object} newDigest The week to show.
   */
  setDigest(newDigest)
  {
    // assign the week on screen.
    this._j._forecast._digest = newDigest;

    this.refresh();
  }

  /**
   * How wide the date column is.
   * @returns {number}
   */
  dateWidth()
  {
    return Math.floor(this.innerWidth * 0.28);
  }

  /**
   * How wide one sampled phase's column is.
   * @param {object} digest The week being drawn.
   * @returns {number}
   */
  cellWidth(digest)
  {
    return Math.floor((this.innerWidth - this.dateWidth()) / digest.phases.length);
  }

  /**
   * Redraws the week.
   */
  refresh()
  {
    this.contents.clear();

    const digest = this.digest();

    if (digest === null) return;

    this.drawColumnHeadings(digest);
    digest.days.forEach((day, index) => this.drawDay(day, index, digest));
  }

  /**
   * Draws which phases the columns are sampling.
   * @param {object} digest The week being drawn.
   */
  drawColumnHeadings(digest)
  {
    this.changeTextColor(ColorManager.systemColor());

    digest.phases.forEach((phaseOfDay, column) =>
    {
      const x = this.dateWidth() + (column * this.cellWidth(digest));

      this.drawText(Time_Snapshot.TimesOfDayName(phaseOfDay), x, 0, this.cellWidth(digest), 'center');
    });

    this.resetTextColor();
  }

  /**
   * Draws one day of the week.
   * @param {object} day The day being drawn.
   * @param {number} index Which day this is, from the top.
   * @param {object} digest The week being drawn.
   */
  drawDay(day, index, digest)
  {
    const y = this.lineHeight() * (index + 1);

    this.changeTextColor(index === 0
      ? ColorManager.powerUpColor()
      : ColorManager.systemColor());
    this.drawText(this.dateLabel(day), 0, y, this.dateWidth(), 'left');
    this.resetTextColor();

    day.cells.forEach((preset, column) =>
    {
      const x = this.dateWidth() + (column * this.cellWidth(digest));

      this.drawCell(preset, x, y, this.cellWidth(digest));
    });
  }

  /**
   * What a day is called in the leftmost column.
   * @param {object} day The day being labelled.
   * @returns {string}
   */
  dateLabel(day)
  {
    if (day.dayOffset === 0) return 'Today';

    const month = SkyForecast.monthOf(day.startPhase);
    const date = SkyForecast.dayOfMonthOf(day.startPhase);

    return `${month}/${date}`;
  }

  /**
   * Draws one sampled phase of one day.
   * @param {?string} preset The look, or null when the forecast does not reach.
   * @param {number} x Where the cell starts.
   * @param {number} y The top of the row.
   * @param {number} width How wide the cell is.
   */
  drawCell(preset, x, y, width)
  {
    if (preset === null)
    {
      this.drawText('-', x, y, width, 'center');

      return;
    }

    const config = J.WEATHER.Metadata.weatherConfig;
    const iconIndex = WeatherIcons.indexFor(config, preset);

    // a look without artwork yet draws its own name, so the week is readable from the first day
    // rather than being a row of blanks until everything is drawn.
    if (iconIndex === WeatherIcons.None)
    {
      this.drawText(preset, x, y, width, 'center');

      return;
    }

    // the name rides alongside the picture rather than replacing it. A column of bare icons asks
    // the reader to have learned fifteen of them, and a week is exactly the screen somebody opens
    // before they have. No strength here - this is the glanceable view.
    const words = WeatherLabel.words(config, preset, String.empty);
    const textWidth = width - ImageManager.iconWidth - this.itemPadding();

    this.drawIcon(iconIndex, x, y);
    this.drawText(words, x + ImageManager.iconWidth + this.itemPadding(), y, textWidth, 'left');
  }
}

export default Window_ForecastWeek;
//endregion Window_ForecastWeek