//region Window_DebugForecast
import ForecastTable from './../core/ForecastTable.js';
import SkyForecast from './../core/SkyForecast.js';

/**
 * Draws one day of the forecast.
 *
 * **Deliberately dumb.** Every decision about what a cell contains was already made in
 * {@link ForecastTable}, which is measured; this walks the grid it was handed and puts text on
 * the screen. If a question here needs answering with an `if`, it probably belongs up there.
 */
class Window_DebugForecast
  extends Window_Base
{
  /**
   * How tall one row of the grid is, in lines: the place's name and weather share the first, the
   * strength sits under it.
   * @type {number}
   */
  static LinesPerRow = 2;

  /**
   * How much of the window's width the leftmost column - the place names - takes.
   * @type {number}
   */
  static LabelShare = 0.18;

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
     * The day being drawn, as {@link ForecastTable} built it.
     * @type {?object}
     */
    this._j._forecast._table = null;
  }

  /**
   * Gets the day currently being drawn.
   * @returns {?object} The table.
   */
  table()
  {
    // hand back the day on screen.
    return this._j._forecast._table;
  }

  /**
   * Sets the day to draw, and draws it.
   * @param {object} newTable The day to show.
   */
  setTable(newTable)
  {
    // assign the day on screen.
    this._j._forecast._table = newTable;

    this.refresh();
  }

  /**
   * How wide the place-name column is.
   * @returns {number}
   */
  labelWidth()
  {
    return Math.floor(this.innerWidth * Window_DebugForecast.LabelShare);
  }

  /**
   * How wide one phase column is.
   * @returns {number}
   */
  columnWidth()
  {
    return Math.floor((this.innerWidth - this.labelWidth()) / ForecastTable.Columns);
  }

  /**
   * Redraws the whole day.
   */
  refresh()
  {
    this.contents.clear();

    const table = this.table();

    if (table === null) return;

    this.drawHeader(table);
    table.rows.forEach((row, index) => this.drawRow(row, index, table));
  }

  /**
   * Draws the date and the six phase names across the top.
   * @param {object} table The day being drawn.
   */
  drawHeader(table)
  {
    const { startPhase } = table;
    const date = `Day ${SkyForecast.dayOfMonthOf(startPhase)}, Month ${SkyForecast.monthOf(startPhase)}`;
    const season = SkyForecast.seasonNameOf(startPhase);

    this.drawText(`${date} - ${season}`, 0, 0, this.innerWidth, 'left');

    const y = this.lineHeight();

    for (let column = 0; column < ForecastTable.Columns; column++)
    {
      const x = this.labelWidth() + (column * this.columnWidth());

      this.changeTextColor(this.columnColor(column, table));
      this.drawText(Time_Snapshot.TimesOfDayName(column), x, y, this.columnWidth(), 'center');
    }

    this.resetTextColor();
  }

  /**
   * What colour a phase column's heading is drawn in.
   * @param {number} column The column being drawn.
   * @param {object} table The day being drawn.
   * @returns {string}
   */
  columnColor(column, table)
  {
    if (column === table.nowColumn) return ColorManager.powerUpColor();

    return ColorManager.systemColor();
  }

  /**
   * Draws one place and its whole day.
   * @param {object} row The place being drawn.
   * @param {number} index Which row this is, from the top.
   * @param {object} table The day being drawn.
   */
  drawRow(row, index, table)
  {
    const top = (2 + (index * Window_DebugForecast.LinesPerRow)) * this.lineHeight();

    this.changeTextColor(ColorManager.systemColor());
    this.drawText(row.name, 0, top, this.labelWidth(), 'left');
    this.resetTextColor();

    row.cells.forEach((cell, column) => this.drawCell(cell, column, top, table));
  }

  /**
   * Draws one phase of one place.
   * @param {?object} cell What would be drawn there, or null for nothing.
   * @param {number} column Which phase this is.
   * @param {number} top The y of the row being drawn.
   * @param {object} table The day being drawn.
   */
  drawCell(cell, column, top, table)
  {
    const x = this.labelWidth() + (column * this.columnWidth());
    const width = this.columnWidth();

    this.changeTextColor(this.cellColor(column, table));

    // nothing at all is a real answer rather than a gap - it is what a sheltered place reports.
    if (cell === null)
    {
      this.drawText('-', x, top, width, 'center');
      this.resetTextColor();

      return;
    }

    this.drawText(cell.preset, x, top, width, 'center');
    this.drawText(cell.intensity, x, top + this.lineHeight(), width, 'center');
    this.resetTextColor();
  }

  /**
   * What colour a cell is drawn in.
   * @param {number} column The column being drawn.
   * @param {object} table The day being drawn.
   * @returns {string}
   */
  cellColor(column, table)
  {
    if (column === table.nowColumn) return ColorManager.powerUpColor();

    return ColorManager.normalColor();
  }
}

export default Window_DebugForecast;
//endregion Window_DebugForecast