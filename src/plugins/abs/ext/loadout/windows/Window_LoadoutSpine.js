//region Window_LoadoutSpine
import LoadoutSlotCatalog from './../_models/LoadoutSlotCatalog.js';

/**
 * The column of slot labels running between the party members' slot columns.
 *
 * The slot itself is shared- both members have an offhand, both have a dodge- so naming it once
 * between them says what a row means without claiming it belongs to either side. Repeating the label
 * in both columns would say the same thing twice and take the space the assignments need.
 *
 * Rows here line up with the slot columns by construction, since all three read their ordering from
 * the same catalog.
 */
class Window_LoadoutSpine
  extends Window_Base
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that defines this window's shape.
   */
  constructor(rect)
  {
    // perform original logic.
    super(rect);

    // initialize our custom members.
    this.initMembers();
  }

  /**
   * Initializes all custom members of this window.
   */
  initMembers()
  {
    /**
     * How tall a row is in the slot columns either side.
     * @type {number}
     */
    this._rowHeight = 0;
  }

  //region properties
  /**
   * Gets how tall a row is.
   * @returns {number} The rowHeight.
   */
  rowHeight()
  {
    // hand back the row height.
    return this._rowHeight;
  }

  /**
   * Adopts the row height of the slot columns either side, so labels sit beside the rows they name.
   *
   * Selectable windows add padding to their line height that a plain window does not, so deriving
   * this independently would drift by that difference on every row and compound down the list. The
   * columns own the arithmetic; this window follows it.
   * @param {number} newRowHeight The new rowHeight.
   */
  setRowHeight(newRowHeight)
  {
    // assign the row height.
    this._rowHeight = newRowHeight;

    // rows are the only thing this window positions against, so redraw once it is known.
    this.refresh();
  }

  //endregion properties

  /**
   * Renders one label per slot.
   */
  refresh()
  {
    // wipe whatever was previously rendered.
    this.contents.clear();

    // there is nothing meaningful to place until the columns have shared their row height.
    if (this.rowHeight() === 0) return;

    // labels are chrome describing the row rather than content, so they render in the system color.
    this.changeTextColor(ColorManager.systemColor());

    // render each slot's label at the row it belongs to.
    LoadoutSlotCatalog.slotKeys()
      .forEach((slotKey, index) => this.drawSlotLabel(slotKey, index));

    // leave the color as we found it for anything else drawing into these contents.
    this.resetTextColor();
  }

  /**
   * Renders a single slot's label.
   * @param {string} slotKey The key of the slot being labelled.
   * @param {number} index The row the slot occupies.
   */
  drawSlotLabel(slotKey, index)
  {
    // rows are the same height here as in the columns either side, so they line up.
    const y = index * this.rowHeight();

    // the label may carry icon escapes, which only drawTextEx renders- and that has no alignment,
    // so the width is measured first and the offset worked out by hand.
    const label = LoadoutSlotCatalog.describeInput(slotKey);
    const { width } = this.textSizeEx(label);

    // center the label between the two columns it separates.
    const x = Math.max(0, Math.floor((this.innerWidth - width) / 2));

    // render it, nudged down so the text sits centered within the taller selectable row.
    const offset = Math.max(0, Math.floor((this.rowHeight() - this.lineHeight()) / 2));

    this.drawTextEx(label, x, y + offset, this.innerWidth);
  }
}

export default Window_LoadoutSpine;
//endregion Window_LoadoutSpine
