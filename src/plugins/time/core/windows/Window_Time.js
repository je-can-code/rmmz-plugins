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
  static RowCount = 2;

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
    this.drawTime();
    this.drawTimePhase();
  };

  /**
   * How wide a line of this window's content is.
   * @returns {number}
   */
  contentWidth()
  {
    return 200;
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
   * Draws the clock.
   */
  drawTime()
  {
    const colon1 = this.isAlternating()
      ? ":"
      : " ";
    const colon2 = this.isAlternating()
      ? " "
      : ":";
    const ampm = this.time.hours > 11
      ? "PM"
      : "AM";

    const seconds = this.time.seconds.padZero(2);
    const minutes = this.time.minutes.padZero(2);
    const hours = this.time.hours.padZero(2);

    const clock = `\\I[2784]${hours}${colon1}${minutes}${colon2}${seconds} \\}${ampm}`;

    this.drawTextEx(clock, 0, this.contentLineY(0), this.contentWidth());
  }

  /**
   * Draws which part of the day it is.
   */
  drawTimePhase()
  {
    const {
      timeOfDayName,
      timeOfDayIcon
    } = this.time;

    this.drawTextEx(`\\I[${timeOfDayIcon}]${timeOfDayName}`, 0, this.contentLineY(1), this.contentWidth());
  }
}

export default Window_Time;
//endregion Window_Time