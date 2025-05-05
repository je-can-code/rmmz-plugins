/* NOTE: the file is prefixed with an underscore explicitly because the build script I use concats files in order of
  which they are found alphabetically in their folders. This class is being extended by the Window_DiaLog class, and
  so it must be ordered to be found ahead of that.
*/

//region Window_MapLog
/**
 * A base window that manages standard log management in a command window.<br/>
 * The default {@link Window_MapLog} is used for the action log.
 */
class Window_MapLog
  extends Window_Command
{
  /**
   * The height of one row; 16.
   * @type {number}
   * @static
   */
  static rowHeight = 16;

  /**
   * The in-window tracking of how long before we reduce opacity for inactivity.
   * @type {number}
   */
  inactivityTimer = 300;

  /**
   * The duration of which the inactivity timer will be refreshed to.
   * @type {number}
   */
  defaultInactivityDuration = J.LOG.Metadata.InactivityTimerDuration;

  /**
   * The underlying data source that logs are derived from.
   * @type {MapLogManager}
   */
  logManager = null;

  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle that represents this window.
   * @param {MapLogManager} logManager the manager that this window leverages to get logs from.
   */
  constructor(rect, logManager)
  {
    super(rect);

    // bind this log manager.
    this.logManager = logManager;
  }

  /**
   * Sets the default inactivity max duration. Changing this will change how long
   * the logs remain visible.
   * @param {number} duration The new duration for how long logs remain visible.
   */
  setDefaultInactivityDuration(duration)
  {
    this.defaultInactivityDuration = duration;
  }

  /**
   * Extends {@link #initialize}.<br/>
   * Initialize this class, but with our things, too.
   * @param {Rectangle} rect The rectangle representing the shape of this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    // run our one-time setup and configuration.
    this.configure();
  }

  /**
   * Performs the one-time setup and configuration per instantiation.
   */
  configure()
  {
    // make the window's background opacity transparent.
    this.opacity = 0;

    // fix the arrows presence to be false by default.
    this.downArrowVisible = false;
    this.upArrowVisible = false;
  }

  //region overwrites
  /**
   * Extends {@link #isScrollEnabled}.<br>
   * Also requires the this window to not be hidden for scrolling to be enabled.
   * @returns {boolean}
   * @extends
   */
  isScrollEnabled()
  {
    if (this.logManager.isHidden()) return false;

    return super.isScrollEnabled();
  }

  /**
   * Overrides {@link #updateArrows}
   * Forces the arrows that appear in scrollable windows to not be visible.
   * @override
   */
  updateArrows()
  {
  }

  /**
   * Extends {@link #smoothScrollTo}.<br>
   * Also refreshes the timer to prevent this window from going invisible
   * while scrolling around through the logs.
   * @param {number} x The x coordinate to scroll to.
   * @param {number} y The y coordinate to scroll to.
   * @extends
   */
  smoothScrollTo(x, y)
  {
    // perform original logic.
    super.smoothScrollTo(x, y);

    // validate there are commands in this window, first.
    if (this.hasCommands())
    {
      // forces the window to show if scrolling through it.
      this.showWindow();
    }
  }

  /**
   * Overrides {@link #itemHeight}.<br>
   * Reduces the item height further to allow for more rows to be visible at once
   * within a smaller window.
   * @returns {number} The adjusted height of each row.
   * @override
   */
  itemHeight()
  {
    return Window_MapLog.rowHeight;
  }

  /**
   * Overrides {@link #drawBackgroundRect}.<br>
   * Prevents the rendering of the backdrop of each line in the window.
   * @param {Rectangle} _ The rectangle to draw the background for.
   * @override
   */
  drawBackgroundRect(_)
  {
  }

  /**
   * Extends {@link #itemRectWithPadding}.<br>
   * Shifts the rect slightly to the left to give a cleaner look.
   * @param {number} index The index of the item in the window.
   * @returns {Rectangle}
   * @override
   */
  itemRectWithPadding(index)
  {
    const rect = super.itemRectWithPadding(index);
    rect.x -= 16;
    return rect;
  }

  /**
   * Overrides {@link #drawIcon}.<br>
   * Reduces the size of the icons being drawn in the log window.
   * @param {number} iconIndex The index of the icon to draw.
   * @param {number} x The x coordinate to draw the icon at.
   * @param {number} y The y coordinate to draw the icon at.
   * @override
   */
  drawIcon(iconIndex, x, y)
  {
    // just copy-paste of the icon drawing variable math.
    const bitmap = ImageManager.loadSystem("IconSet");
    const pw = ImageManager.iconWidth;
    const ph = ImageManager.iconHeight;
    const sx = (iconIndex % 16) * pw;
    const sy = Math.floor(iconIndex / 16) * ph;

    // the last two parameters reduce the size of the icon to a smaller size.
    // this allows the icons to not look so clumsy in the log.
    this.contents.blt(bitmap, sx, sy, pw, ph, x, y, 16, 16);
  }

  /**
   * Extends {@link #processDrawIcon}.<br>
   * Accommodates the other icon-related adjustments by manually shifting the
   * {@link textState} around before and after executing the super method execution.
   *
   * The goal of these shifts are to center the now-smaller icon inline with the text.
   * @param {number} iconIndex The index of the icon to draw.
   * @param {rm.types.TextState} textState The rolling state of the text being drawn.
   * @extends
   */
  processDrawIcon(iconIndex, textState)
  {
    // before drawing the icon, draw it a bit lower since its smaller.
    textState.y += 8;

    // draw the icon.
    super.processDrawIcon(iconIndex, textState);

    // move the text state back up to where it was before.
    textState.y -= 8;

    // because we didn't draw a full-sized icon, we move the textState.x back a bit.
    textState.x -= 16;
  }

  //endregion overwrites

  /**
   * Update this window's drawing and the like.
   */
  update()
  {
    // process original update logic.
    super.update();

    // update our log data.
    this.updateMapLog();
  }

  /**
   * Perform the update logic that maintains this window.
   */
  updateMapLog()
  {
    // manage the incoming logging.
    this.updateLogging();

    // manage the visibility of this window.
    this.updateVisibility();
  }

  //region update logging
  /**
   * The update of the logging.
   * The processing of incoming messages, and updating the contents of this window
   * occur thanks to this function.
   */
  updateLogging()
  {
    // check if we have a need to update.
    if (this.shouldUpdate())
    {
      // process the logs.
      this.processNewLogs();

      // acknowledge the new logs.
      this.logManager.acknowledgeProcessing();
    }
  }

  /**
   * Determines whether or not this window should update.
   * @returns {boolean} True if we need to redraw the contents, false otherwise.
   */
  shouldUpdate()
  {
    // check if we have a new log.
    return this.logManager.needsProcessing();
  }

  /**
   * Process all new logs.
   */
  processNewLogs()
  {
    // perform any logic for when a new log is added.
    this.onLogChange();

    // refreshing will redraw based on the updated list.
    this.refresh();
  }

  /**
   * Processes effects whenever a change in the logs occurs.
   * Occurs before the window is refreshed.
   * Open for extension.
   */
  onLogChange()
  {
    this.showWindow();
  }

  /**
   * Draws all items in the log.
   */
  makeCommandList()
  {
    // empty the current list.
    this.clearCommandList();

    // grab all the listings available.
    const commands = this.buildCommands();

    // add all the built commands into the list.
    commands.forEach(this.addBuiltCommand, this);

    // after drawing all the logs, scroll to the bottom.
    this.smoothScrollDown(this.commandList().length);
  }

  /**
   * Builds all commands for this action log window.
   * @returns {BuiltWindowCommand[]}
   */
  buildCommands()
  {
    // do nothing if the log manager is not yet set.
    if (!this.logManager) return [];

    // iterate over each log and build a command for them.
    // return the built commands.
    return this.logManager.getLogs()
      .map((log, index) =>
      {
        // add the message as a "command" into the log window.
        return new WindowCommandBuilder(`\\FS[14]${log.message()}`)
          .setSymbol(`log-${index}`)
          .setEnabled(true)
          .build();
      });
  }

  //endregion update logging

  //region update visibility
  /**
   * Updates the visibility of the window.
   * Uses an inactivity timer to countdown and eventually reduce opacity once
   * a certain threshold is reached.
   */
  updateVisibility()
  {
    // if the text log is flagged as hidden, then don't show it.
    if (this.logManager.isHidden() || $gameMessage.isBusy())
    {
      // hide the window.
      this.hideWindow();

      // stop processing.
      return;
    }

    // decrement the timer.
    this.decrementInactivityTimer();

    // first priority check is if the timer is at or below 1 second remaining.
    if (this.inactivityTimer <= 60)
    {
      // it is, so lets fade the window accordingly.
      this.handleWindowFade();
    }

    // second priority check, if the player is interfering with the window.
    else if (this.playerInterference())
    {
      // drastically reduce visibility of the this log window while the player is overlapped.
      this.handlePlayerInterference();
    }
    // otherwise, it must be regular visibility processing.
    else
    {
      // handle opacity based on the time remaining on the inactivity timer.
      this.handleNonInterferenceOpacity(this.inactivityTimer);
    }
  }

  /**
   * Determines whether or not the player is in the way (or near it) of this window.
   * @returns {boolean} True if the player is in the way, false otherwise.
   */
  playerInterference()
  {
    // identify where on the screen the player is.
    const playerX = $gamePlayer.screenX();
    const playerY = $gamePlayer.screenY();

    // check if the player is to the right of this window's origin X
    // check if the player is below this window's origin Y.
    const xInterference = (playerX > this.x) && playerX < (this.x + this.width);
    const yInterference = (playerY > this.y) && playerY < (this.y + this.height);

    // return what we deduced.
    return (xInterference) && (yInterference);
  }

  /**
   * Manages opacity for the window while the player is interfering with the visibility.
   */
  handlePlayerInterference()
  {
    // if we are above 64, rapidly decrement by -15 until we get below 64.
    if (this.contentsOpacity > 64)
    {
      this.contentsOpacity -= 15;
    }// if we are below 64, increment by +1 until we get to 64.
    else if (this.contentsOpacity < 64) this.contentsOpacity += 1;
  }

  /**
   * Reverts the opacity changes associated with the player getting in the way.
   */
  handleNonInterferenceOpacity(currentDuration)
  {
    // ensure the window is visible for the current duration.
    this.showWindow();

    this.setInactivityTimer(currentDuration);
  }

  /**
   * Decrements the inactivity timer, by 1 by default.
   */
  decrementInactivityTimer(amount = 1)
  {
    // decrement the timer.
    this.inactivityTimer -= amount;
  }

  /**
   * Sets the duration of the inactivity timer.
   * @param {number} duration The duration to set the inactivity timer to; 300 by default.
   */
  setInactivityTimer(duration = this.defaultInactivityDuration)
  {
    this.inactivityTimer = duration;
  }

  /**
   * Fades this window out based on the inactivity timer.
   */
  handleWindowFade()
  {
    // do nothing if we are where we want to be already.
    if (this.isHidden()) return;

    // check if this is the "other" of every other frame.
    if (this.inactivityTimer % 2 === 0)
    {
      // reduce opacity if it is.
      this.fadeContentsOpacityTick();
    }
    // otherwise, check if the timer is simply 0.
    else if (this.inactivityTimer === 0)
    {
      // and hide the window if it is.
      this.hideWindow();
    }
  }

  fadeContentsOpacityTick()
  {
    // reduce opacity if it is.
    this.contentsOpacity -= 12;
  }

  /**
   * Determines whether or not this window is already hidden.
   * @returns {boolean}
   */
  isHidden()
  {
    // check if we're currently invisible.
    if (this.contentsOpacity !== 0)
    {
      // we must be invisible to be hidden.
      return false;
    }

    // check if we're out of time.
    if (this.inactivityTimer === 0)
    {
      // we must be out of time to be hidden.
      return false;
    }

    // we're hidden!
    return true;
  }

  /**
   * Hides this window entirely.
   */
  hideWindow()
  {
    // force the timer to 0.
    this.setInactivityTimer(0);

    // hide the contents.
    this.contentsOpacity = 0;
  }

  /**
   * Shows this window.
   * Refreshes the inactivity timer to 5 seconds.
   * Typically used after the log window was hidden.
   */
  showWindow()
  {
    // if the text log is flagged as hidden, then we shouldn't show it again.
    if (this.logManager.isHidden()) return;

    // refresh the timer back to 5 seconds.
    this.setInactivityTimer(this.defaultInactivityDuration);

    // refresh the opacity so the logs can be seen again.
    this.contentsOpacity = 255;
  }

  //endregion update visibility
}

//endregion Window_MapLog