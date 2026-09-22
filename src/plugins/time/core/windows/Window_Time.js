//region Window_Time
/**
 * A window class for displaying the time.
 */
class Window_Time
  extends Window_Base
{
  /**
   * How many rows of content this window draws.
   *
   * Declared so the scene can size the window without building it first, and so an extension
   * adding a row has one number to raise rather than a height to recalculate.
   * @type {number}
   */
  static RowCount = 1;

  /**
   * How wide a row of this window's content is.
   *
   * Declared for the same reason as {@link Window_Time.RowCount}: the scene sizes the window from
   * it before any window exists to measure text with, and an extension whose line runs longer has
   * one number to raise.
   * @type {number}
   */
  static ContentWidth = 200;

  /**
   * @constructor
   * @param {Rectangle} rect The shape representing this window.
   */
  constructor(rect)
  {
    // perform original logic.
    super(rect);

    // set the opacity of the window as 100% transparent.
    this.opacity = 0;

    // identify the background for this window.
    this.generateBackground();

    // initialize all members for this window.
    this.initMembers();

    // initialize the window with a refresh.
    this.refresh();
  };

  /**
   * Renders the background of the time window with what will look like a standard "dimmed" window gradient.
   */
  generateBackground()
  {
    const c1 = ColorManager.dimColor1();
    const c2 = ColorManager.dimColor2();
    const x = -4;
    const y = -4;
    const w = this.contentsBack.width + 8;
    const h = this.contentsBack.height + 8;
    this.contentsBack.gradientFillRect(x, y, w, h, c1, c2, true);
    this.contentsBack.strokeRect(x, y, w, h, c1);
  };

  /**
   * Initializes all members of this class.
   */
  initMembers()
  {
    /**
     * The TIME rendered by this window.
     * @type {Time_Snapshot}
     */
    this.time = null;

    /**
     * The boolean managing the alternating colon for this window.
     * @type {boolean}
     */
    this._alternating = false;
  }

  //region properties
  /**
   * Gets the alternating.
   * @returns {boolean} The alternating.
   */
  isAlternating()
  {
    // hand back the alternating.
    return this._alternating;
  }

  /**
   * Sets the alternating.
   * @param {boolean} newAlternating The new alternating.
   */
  setAlternating(newAlternating)
  {
    // assign the alternating.
    this._alternating = newAlternating;
  }
  //endregion properties

  ;

  /**
   * Toggles the alternating colon boolean.
   */
  toggleAlternating()
  {
    this.setAlternating(!this.isAlternating());
  }

  /**
   * Updates the frames and refreshes the window's contents once every half second.
   */
  update()
  {
    // perform original logic.
    super.update();

    // check if the TIME window can be updated.
    if (this.canUpdate())
    {
      // toggle the colons!
      this.toggleAlternating();

      // process window refresh.
      this.refresh();

      // acknowledge the TIME update.
      $gameTime.acknowledgeHudUpdate();
    }
  };

  /**
   * Determine if the window can be updated.
   * @returns {boolean}
   */
  canUpdate()
  {
    // cannot process TIME update if it is inactive or blocked.
    if (!$gameTime.isActive() || $gameTime.isBlocked()) return false;

    // cannot process TIME update if time hasn't ticked.
    if ($gameTime.needsHudUpdate() === false) return false;

    // TIME should be processed.
    return true;
  }

  /**
   * Refreshes the window by clearing it and redrawing everything.
   */
  refresh()
  {
    this.time = $gameTime.currentTime();
    this.redrawContent();
  };

  /**
   * Clears and redraws the contents of the window.
   */
  redrawContent()
  {
    this.contents.clear();
    this.drawContent();
  }

  /**
   * Implements {@link #drawContent}.<br/>
   * Renders the TIME into the window.
   */
  drawContent()
  {
    this.drawTimeAndPhase();
  };

  /**
   * How wide a line of this window's content is.
   * @returns {number}
   */
  contentWidth()
  {
    return Window_Time.ContentWidth;
  }

  /**
   * Where a given row of content sits.
   *
   * Rows are numbered rather than positioned, so anything extending this window puts its line
   * *after* the ones already there without having to know how tall they were.
   * @param {number} row Which row, counting from zero.
   * @returns {number}
   */
  contentLineY(row)
  {
    return this.lineHeight() * row;
  }

  /**
   * Draws the clock and the part of the day it falls in, together.
   *
   * One line, because they are the same fact at two zoom levels - "00:50" and "Moontide" both
   * answer when it is, and a reader who wants one is already looking at the other.
   */
  drawTimeAndPhase()
  {
    const line = `${this.timeText()} ${this.timePhaseText()}`;

    this.drawTextEx(line, 0, this.contentLineY(0), this.contentWidth());
  }

  /**
   * The clock, as text codes.
   *
   * **No seconds.** The alternating colon already says the clock is running, and spelling out a
   * figure that changes faster than anybody reads it costs four characters on the window's
   * longest line - which is the line that decides how wide the whole thing has to be.
   * @returns {string}
   */
  timeText()
  {
    const colon = this.isAlternating()
      ? ":"
      : " ";
    const ampm = this.time.hours > 11
      ? "PM"
      : "AM";

    const minutes = this.time.minutes.padZero(2);
    const hours = this.time.hours.padZero(2);

    // authored rather than fixed, because the other rows take their icons from data and this one
    // silently becomes whatever happens to sit at its index once the icon sheet is moved.
    const icon = J.TIME.Metadata.ClockIcon;

    return `\\I[${icon}]${hours}${colon}${minutes} \\}${ampm}`;
  }

  /**
   * Which part of the day it is, as text codes.
   * @returns {string}
   */
  timePhaseText()
  {
    const {
      timeOfDayName,
      timeOfDayIcon
    } = this.time;

    return `\\I[${timeOfDayIcon}]${timeOfDayName}`;
  }
}

export default Window_Time;
//endregion Window_Time