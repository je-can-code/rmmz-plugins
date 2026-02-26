//region StatusStatListRow
/**
 * Represents a single selectable stat row for the Status stat list window.
 * Each row points at a specific long parameter id and the display section it belongs to.
 */
class StatusStatListRow
{
  /**
   * The display section header this row belongs to (ex: "Core Parameters").
   * @type {string}
   */
  section = String.empty;

  /**
   * The long parameter id represented by this row.
   * @type {number}
   */
  longParamId = 0;

  /**
   * Constructor.
   * @param {string} section The display section header.
   * @param {number} longParamId The long parameter id represented by this row.
   */
  constructor(section, longParamId)
  {
    // assign the section this row belongs to for grouping.
    this.section = section;

    // assign the long parameter id this row represents.
    this.longParamId = longParamId;
  }
}

//endregion StatusStatListRow