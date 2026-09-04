//region Window_DpsFrame
/**
 * A HUD window rendering each battle member's damage output as a small table.
 *
 * One row per battle member, three columns:
 *   Now   - the rolling rate across the last few seconds of combat.
 *   Fight - the rate across the encounter in progress.
 *   Last  - the rate across the encounter before it.
 *
 * Every row is measured against the same encounter clock, which is what makes a low number mean
 * something. A member who spent the fight dead or idling divides their small damage by the whole
 * fight and reads low; give each of them their own active-time denominator and everyone looks
 * competent over whatever slice of the fight they turned up for.
 *
 * This window draws numbers and nothing else. Every figure on it is asked of the tracker over in
 * J-ABS-Dps, which is where the measuring lives.
 */
class Window_DpsFrame
  extends Window_Base
{
  /**
   * Width in pixels of the leading column holding battler names.
   * @type {number}
   */
  static NAME_COLUMN_WIDTH = 120;

  /**
   * Width in pixels of each of the three numeric columns.
   * @type {number}
   */
  static VALUE_COLUMN_WIDTH = 70;

  /**
   * Font size adjustment for every row on this frame (negative = smaller).
   *
   * The table is a reference read at a glance beside the action, not something to be studied, and a
   * smaller face keeps four columns inside a window that does not dominate the screen.
   * @type {number}
   */
  static ROW_FONT_DELTA = -8;

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle describing this window's dimensions.
   */
  constructor(rect)
  {
    super(rect);

    // apply plugin opacity before the first paint.
    this.configure();

    this.refresh();
  }

  /**
   * One-time window setup: plugin-driven windowskin frame opacity.
   */
  configure()
  {
    // fade only the plated window chrome, not the numbers drawn on it.
    this.opacity = J.HUD.EXT.DPS.Metadata.windowOpacity;
  }

  /**
   * Keeps backdrop opacity on the plugin parameter instead of $gameSystem.windowOpacity().
   * MZ calls this every frame from {@link Window_Base#updateBackOpacity}.
   */
  updateBackOpacity()
  {
    this.backOpacity = J.HUD.EXT.DPS.Metadata.windowOpacity;
  }

  /**
   * Updates this window each frame.
   *
   * Repainting every frame is the point of the thing- the rolling rate is meant to move while the
   * fighting is happening, and a refresh triggered by events would only ever show it after.
   */
  update()
  {
    // perform original logic (cursor blink, tone animation, etc.).
    super.update();

    // repaint the table so the rolling rate moves in real time.
    this.refresh();
  }

  /**
   * Refreshes the window contents, hiding the frame when the HUD is not being shown.
   */
  refresh()
  {
    this.contents.clear();

    // the readout is opt-in; a dev instrument left on screen in a real session is a bug.
    if (J.HUD.EXT.DPS.Metadata.enabled === false)
    {
      this.hide();
      return;
    }

    // whatever hides the rest of the HUD hides this too- cutscenes, menus, and the like.
    if (!$hudManager.canShowHud())
    {
      this.hide();
      return;
    }

    this.show();
    this.drawHeaderRow();
    this.drawMemberRows();
  }

  /**
   * Draws the column headings above the member rows.
   */
  drawHeaderRow()
  {
    // the name column has no heading; the names beneath it are self-evidently names.
    this.drawRow(String.empty, 'Now', 'Fight', 'Last', 0);
  }

  /**
   * Draws one row per current battle member, in party order.
   */
  drawMemberRows()
  {
    const members = $gameParty.battleMembers();
    const tracker = $jabsEngine.dpsTracker();

    members.forEach((member, index) => this.drawMemberRow(member, tracker, index));
  }

  /**
   * Draws a single battle member's row of rates.
   * @param {Game_Actor} member The battle member this row describes.
   * @param {JabsDpsTracker} tracker The tracker holding the measurements.
   * @param {number} index The zero-based position of this member in the party.
   */
  drawMemberRow(member, tracker, index)
  {
    const uuid = member.getUuid();

    const now = Window_DpsFrame.formatRate(tracker.rollingDpsBy(uuid));
    const fight = Window_DpsFrame.formatRate(tracker.currentDpsBy(uuid));
    const last = Window_DpsFrame.formatRate(tracker.previousDpsBy(uuid));

    // the header occupies the first row, so members begin one row down.
    const rowIndex = index + 1;

    this.drawRow(member.name(), now, fight, last, rowIndex);
  }

  /**
   * Draws one row of the table, name on the left and three values right-aligned after it.
   * @param {string} label The text for the leading name column.
   * @param {string} first The text for the first value column.
   * @param {string} second The text for the second value column.
   * @param {string} third The text for the third value column.
   * @param {number} rowIndex The zero-based row this content belongs on.
   */
  drawRow(label, first, second, third, rowIndex)
  {
    const y = rowIndex * this.lineHeight();
    const nameWidth = Window_DpsFrame.NAME_COLUMN_WIDTH;
    const valueWidth = Window_DpsFrame.VALUE_COLUMN_WIDTH;

    this.modFontSize(Window_DpsFrame.ROW_FONT_DELTA);

    this.drawText(label, 0, y, nameWidth, 'left');
    this.drawText(first, nameWidth, y, valueWidth, 'right');
    this.drawText(second, nameWidth + valueWidth, y, valueWidth, 'right');
    this.drawText(third, nameWidth + (valueWidth * 2), y, valueWidth, 'right');

    this.resetFontSettings();
  }

  /**
   * Renders a rate as the whole number that goes in a cell.
   *
   * Fractions of a point per second are below the resolution of any decision this table informs,
   * and a column of decimals is harder to compare at a glance than a column of integers.
   * @param {number} rate The rate to render.
   * @returns {string}
   */
  static formatRate(rate)
  {
    return Math.round(rate)
      .toString();
  }
}

export default Window_DpsFrame;
//endregion Window_DpsFrame