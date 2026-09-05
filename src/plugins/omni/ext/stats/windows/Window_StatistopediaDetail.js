//region Window_StatistopediaDetail
import StatistopediaService from './../managers/StatistopediaService.js';

/**
 * The panel of labelled statistics for whichever section is currently selected.
 *
 * Every row it draws arrives finished from {@link StatistopediaService}: a label and a value, both
 * already strings. This window resolves nothing, computes nothing, and formats nothing- which is
 * what makes the numbers testable without standing a scene up.
 *
 * It is a command window rather than a plain one so that long sections scroll on their own, which
 * matters because the section list is expected to grow and no section should ever need a layout
 * decision made about it individually.
 */
class Window_StatistopediaDetail
  extends Window_Command
{
  /**
   * @constructor
   * @param {Rectangle} rect A rectangle that represents the shape of this window.
   */
  constructor(rect)
  {
    // perform original logic, which seeds this window's members and then builds its rows from them.
    super(rect);
  }

  /**
   * Implements {@link #initMembers}.<br/>
   * Seeds the section this panel is reporting on.
   *
   * The section has to be established here rather than in the constructor body, because the base
   * class finishes by refreshing- and refreshing is what calls {@link makeCommandList}. A field
   * assigned after `super()` returns would be assigned after the rows were already built against
   * nothing.
   */
  initMembers()
  {
    /**
     * The key of the section currently being reported.
     *
     * Seeded to the first section rather than to an empty string so the very first draw shows real
     * content; an empty key would build an empty panel that the player would see for one frame.
     * @type {string}
     */
    this._sectionKey = StatistopediaService.sections()
      .at(0).key;
  }

  /**
   * The key of the section currently being reported.
   * @returns {string}
   */
  sectionKey()
  {
    return this._sectionKey;
  }

  /**
   * Points this panel at a different section.
   * @param {string} sectionKey The key of the section to report on.
   */
  setSectionKey(sectionKey)
  {
    this._sectionKey = sectionKey;
  }

  /**
   * Implements {@link #makeCommandList}.<br/>
   * Builds one row per statistic in the active section.
   */
  makeCommandList()
  {
    const commands = this.buildCommands();

    commands.forEach(this.addBuiltCommand, this);
  }

  /**
   * Builds a command for every statistic in the active section.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    const activeSection = this.sectionKey();
    const rows = StatistopediaService.rowsFor(activeSection);

    return rows.map(this.buildCommand, this);
  }

  /**
   * Builds a single row: the name of the statistic on the left, its value on the right.
   * @param {{label: string, value: string}} row The row driving this step.
   * @returns {BuiltWindowCommand}
   */
  buildCommand(row)
  {
    const {
      label,
      value
    } = row;

    return new WindowCommandBuilder(label)
      .setSymbol(label)
      .setRightText(value)
      .build();
  }
}

export default Window_StatistopediaDetail;
//endregion Window_StatistopediaDetail