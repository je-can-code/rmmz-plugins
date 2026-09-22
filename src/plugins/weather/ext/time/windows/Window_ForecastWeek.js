//region Window_ForecastWeek
import ForecastWhen from './../core/ForecastWhen.js';
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
    return this.dayNameWidth() + this.dayNumberWidth();
  }

  /**
   * How wide the weekday column is.
   *
   * Measured from the longest weekday there is, so every date underneath starts at the same x
   * regardless of whether the day is a Monday or a Wednesday.
   * @returns {number}
   */
  dayNameWidth()
  {
    return this.textWidth('Wednesday') + (this.itemPadding() * 2);
  }

  /**
   * How wide the numeric date column is.
   * @returns {number}
   */
  dayNumberWidth()
  {
    return this.textWidth('12/30') + (this.itemPadding() * 2);
  }

  /**
   * How wide one sampled phase's column is.
   *
   * **Measured from what goes in it rather than from the window.** Splitting the full width three
   * ways puts a hundred-pixel icon-and-word in the middle of a four-hundred-pixel column, which
   * reads as three lonely things rather than as a table - and it pushes each heading so far from
   * the next column's contents that the eye stops connecting them.
   * @param {object} digest The week being drawn.
   * @returns {number}
   */
  cellWidth(digest)
  {
    const widest = this.widestLookWidth();
    const natural = widest + ImageManager.iconWidth + (this.itemPadding() * 3);
    const available = Math.floor((this.innerWidth - this.dateWidth()) / digest.phases.length);

    // never wider than the room actually available, so a narrow window still fits its columns.
    return Math.min(natural, available);
  }

  /**
   * How much room the longest weather name needs.
   *
   * Every name is measured rather than the longest being guessed at, because the names are
   * authored in the configuration and a new one longer than any of these would otherwise be the
   * one that overlaps its neighbour.
   * @returns {number}
   */
  widestLookWidth()
  {
    const config = J.WEATHER.Metadata.weatherConfig;
    const names = Object.keys(config.presets)
      .filter(name => name.startsWith('_') === false);

    return names.reduce((widest, name) => Math.max(widest, this.textWidth(name)), 0);
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
    this.drawText(this.dayName(day), 0, y, this.dayNameWidth(), 'left');
    this.drawText(this.dayNumber(day), this.dayNameWidth(), y, this.dayNumberWidth(), 'left');
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
  dayName(day)
  {
    // today is named rather than dated, because "is that this Tuesday or next" is the one
    // question a seven-day forecast must never make somebody ask.
    if (day.dayOffset === 0) return 'Today';

    return ForecastWhen.weekdayOf(day.startPhase);
  }

  /**
   * The date a row falls on, as figures.
   * @param {object} day The day being labelled.
   * @returns {string}
   */
  dayNumber(day)
  {
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