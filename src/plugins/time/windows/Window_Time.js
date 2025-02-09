//region Window_Time
/**
 * A window class for displaying the time.
 */
class Window_Time
  extends Window_Base
{
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
  };

  /**
   * Toggles the alternating colon boolean.
   */
  toggleAlternating()
  {
    this._alternating = !this._alternating;
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
    const colon1 = this._alternating
      ? ":"
      : " ";
    const colon2 = this._alternating
      ? " "
      : ":";
    const ampm = this.time.hours > 11
      ? "PM"
      : "AM";
    const lh = this.lineHeight();

    const seconds = this.time.seconds.padZero(2);
    const minutes = this.time.minutes.padZero(2);
    const hours = this.time.hours.padZero(2);
    const timeOfDayName = this.time.timeOfDayName;
    const timeOfDayIcon = this.time.timeOfDayIcon;
    const seasonName = this.time.seasonOfTheYearName;
    const seasonIcon = this.time.seasonOfTheYearIcon;

    const days = this.time.days.padZero(2);
    const months = this.time.months.padZero(2);
    const years = this.time.years.padZero(4);

    this.drawTextEx(`\\I[2784]${hours}${colon1}${minutes}${colon2}${seconds} \\}${ampm}`, 0, lh * 0, 200);
    this.drawTextEx(`\\I[${timeOfDayIcon}]${timeOfDayName}`, 0, lh * 1, 200);
    this.drawTextEx(`\\I[${seasonIcon}]${seasonName}`, 0, lh * 2, 200);
    this.drawTextEx(`${years}/${months}/${days}`, 0, lh * 3, 200);
  };
}

//endregion Window_Time