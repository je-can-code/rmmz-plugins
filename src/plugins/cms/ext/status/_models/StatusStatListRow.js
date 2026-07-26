//region StatusStatListRow
/**
 * Represents a single selectable stat row for the Status stat list window.
 * Each row points at a registry parameter key and the display section it belongs to.
 */
class StatusStatListRow
{
  /**
   * The display section header this row belongs to (ex: "Core Parameters").
   * @type {string}
   */
  section = String.empty;

  /**
   * The registry key represented by this row.
   * @type {string}
   */
  parameterKey = String.empty;

  /**
   * Constructor.
   * @param {string} section The display section header.
   * @param {string} parameterKey The registry key this row represents.
   */
  constructor(section, parameterKey)
  {
    // assign the section this row belongs to for grouping.
    this.section = section;

    // assign the registry key this row represents.
    this.parameterKey = parameterKey;
  }
}

export default StatusStatListRow;
//endregion StatusStatListRow
