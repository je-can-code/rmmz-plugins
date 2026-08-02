//region Game_Time
import Time_Snapshot from './Time_Snapshot.js';
import TimeToneResolver from '../managers/TimeToneResolver.js';

/**
 * A class for controlling time.
 */
class Game_Time
{
  /**
   * Constructor.
   */
  constructor()
  {
    // initialize all the properties of TIME.
    this.initMembers();

    // update the tone for the first time.
    this.updateCurrentTone();
  }

  //region statics
  /**
   * How many of each unit fit inside the unit above it, which is the point at which the smaller
   * unit resets and hands one of itself up the chain.
   *
   * Seconds, minutes and hours are zero-based and reset once they *reach* their limit; days and
   * months are one-based and only reset once they *pass* it. That asymmetry is why the rollover
   * helper takes a zero-based flag rather than assuming one convention for everything.
   * @type {number}
   */
  static secondsPerMinute = 60;

  static minutesPerHour = 60;

  static hoursPerDay = 24;

  static daysPerMonth = 30;

  static monthsPerYear = 12;
  //endregion statics

  /**
   * Initializes the members of this class.
   */
  initMembers()
  {
    /**
     * The number of frames that must pass before we execute a tick.
     * @type {number}
     */
    this._tickFrames ??= J.TIME.Metadata.FramesPerTick;

    /**
     * The number of seconds per tick.
     * @type {number}
     */
    this._secondsPerTick ??= J.TIME.Metadata.SecondsPerIncrement;

    /**
     * The number of minutes per tick.
     * @type {number}
     */
    this._minutesPerTick ??= J.TIME.Metadata.MinutesPerIncrement;

    /**
     * The number of hours per tick.
     * @type {number}
     */
    this._hoursPerTick ??= J.TIME.Metadata.HoursPerIncrement;

    /**
     * The number of days per tick.
     * @type {number}
     */
    this._daysPerTick ??= J.TIME.Metadata.DaysPerIncrement;

    /**
     * The number of months per tick.
     * @type {number}
     */
    this._monthsPerTick ??= J.TIME.Metadata.MonthsPerIncrement;

    /**
     * The number of years per tick.
     * @type {number}
     */
    this._yearsPerTick ??= J.TIME.Metadata.YearsPerIncrement;

    /**
     * The current second.
     * @type {number}
     */
    this._seconds ??= J.TIME.Metadata.StartingSecond;

    /**
     * The current minute.
     * @type {number}
     */
    this._minutes ??= J.TIME.Metadata.StartingMinute;

    /**
     * The current hour.
     * @type {number}
     */
    this._hours ??= J.TIME.Metadata.StartingHour;

    /**
     * The current day (number).
     * @type {number}
     */
    this._days ??= J.TIME.Metadata.StartingDay;

    /**
     * The current month (number).
     * @type {number}
     */
    this._months ??= J.TIME.Metadata.StartingMonth;

    /**
     * The current year.
     * @type {number}
     */
    this._years ??= J.TIME.Metadata.StartingYear;

    /**
     * Whether or not the screen's tone needs to be changed based on the time.
     * @type {boolean}
     */
    this._needsToneChange = false;

    /**
     * The current tone of the screen.
     * @type {[number, number, number, number]}
     */
    this._currentTone = [];

    /**
     * Whether or not the tone is able to be changed.
     * @type {boolean}
     */
    this._toneLocked ??= !J.TIME.Metadata.ChangeToneByTime;

    /**
     * Whether or not the time window is visible on the map.
     * @type {boolean}
     */
    this._visible ??= J.TIME.Metadata.StartVisible;

    /**
     * Whether or not time is currently flowing.
     * @type {boolean}
     */
    this._active ??= J.TIME.Metadata.StartActivated;

    /**
     * Whether or not time is blocked from flowing for some predetermined reason.
     * This is typically used for manually stopping artificial time with with
     * plugin commands.
     * @type {boolean}
     */
    this._blocked ??= false;

    /**
     * Whether or not this has been updated. This is primarily for HUD elements keeping in-sync with TIME.
     * @type {boolean}
     */
    this._hasBeenUpdated ??= false;
  }

  //region properties
  /**
   * Gets the has been updated.
   * @returns {boolean} The hasBeenUpdated.
   */
  hasBeenUpdated()
  {
    // hand back the has been updated.
    return this._hasBeenUpdated;
  }

  /**
   * Sets the has been updated.
   * @param {boolean} newHasBeenUpdated The new hasBeenUpdated.
   */
  setHasBeenUpdated(newHasBeenUpdated)
  {
    // assign the has been updated.
    this._hasBeenUpdated = newHasBeenUpdated;
  }

  /**
   * Gets the visible.
   * @returns {*} The visible.
   */
  isVisible()
  {
    // hand back the visible.
    return this._visible;
  }

  /**
   * Sets the visible.
   * @param {boolean} newVisible The new visible.
   */
  setVisible(newVisible)
  {
    // assign the visible.
    this._visible = newVisible;
  }

  /**
   * Gets the tick frames.
   * @returns {number} The tickFrames.
   */
  tickFrames()
  {
    // hand back the tick frames.
    return this._tickFrames;
  }

  /**
   * Sets the tick frames.
   * @param {number} newTickFrames The new tickFrames.
   */
  setTickFrames(newTickFrames)
  {
    // assign the tick frames.
    this._tickFrames = newTickFrames;
  }

  /**
   * Gets the hours.
   * @returns {*} The hours.
   */
  hours()
  {
    // hand back the hours.
    return this._hours;
  }

  /**
   * Sets the hours.
   * @param {*} newHours The new hours.
   */
  setHours(newHours)
  {
    // assign the hours.
    this._hours = newHours;
  }

  /**
   * Gets the months.
   * @returns {*} The months.
   */
  months()
  {
    // hand back the months.
    return this._months;
  }

  /**
   * Sets the months.
   * @param {*} newMonths The new months.
   */
  setMonths(newMonths)
  {
    // assign the months.
    this._months = newMonths;
  }

  /**
   * Gets the seconds.
   * @returns {number} The seconds.
   */
  seconds()
  {
    // hand back the seconds.
    return this._seconds;
  }

  /**
   * Sets the seconds.
   * @param {number} newSeconds The new seconds.
   */
  setSeconds(newSeconds)
  {
    // assign the seconds.
    this._seconds = newSeconds;
  }

  /**
   * Gets the minutes.
   * @returns {number} The minutes.
   */
  minutes()
  {
    // hand back the minutes.
    return this._minutes;
  }

  /**
   * Sets the minutes.
   * @param {number} newMinutes The new minutes.
   */
  setMinutes(newMinutes)
  {
    // assign the minutes.
    this._minutes = newMinutes;
  }

  /**
   * Gets the days.
   * @returns {*} The days.
   */
  days()
  {
    // hand back the days.
    return this._days;
  }

  /**
   * Sets the days.
   * @param {*} newDays The new days.
   */
  setDays(newDays)
  {
    // assign the days.
    this._days = newDays;
  }

  /**
   * Gets the years.
   * @returns {*} The years.
   */
  years()
  {
    // hand back the years.
    return this._years;
  }

  /**
   * Sets the years.
   * @param {*} newYears The new years.
   */
  setYears(newYears)
  {
    // assign the years.
    this._years = newYears;
  }

  /**
   * Gets the minutes per tick.
   * @returns {*} The minutesPerTick.
   */
  minutesPerTick()
  {
    // hand back the minutes per tick.
    return this._minutesPerTick;
  }

  /**
   * Gets the hours per tick.
   * @returns {*} The hoursPerTick.
   */
  hoursPerTick()
  {
    // hand back the hours per tick.
    return this._hoursPerTick;
  }

  /**
   * Gets the days per tick.
   * @returns {*} The daysPerTick.
   */
  daysPerTick()
  {
    // hand back the days per tick.
    return this._daysPerTick;
  }

  /**
   * Gets the months per tick.
   * @returns {*} The monthsPerTick.
   */
  monthsPerTick()
  {
    // hand back the months per tick.
    return this._monthsPerTick;
  }

  /**
   * Gets the years per tick.
   * @returns {*} The yearsPerTick.
   */
  yearsPerTick()
  {
    // hand back the years per tick.
    return this._yearsPerTick;
  }
  //endregion properties

  /**
   * Gets the current tick speed.
   * @returns {number}
   */
  getTickSpeed()
  {

    return this.tickFrames();
  }

  /**
   * Sets the new tick speed to (60 / multiplier) frames per second.
   *
   * The threshold for this multiplier is `0.1` to `10.0`.
   * @param {number} flowSpeedMultiplier The new multiplier for how fast a single tick is.
   */
  setTickSpeed(flowSpeedMultiplier)
  {

    // localize the variable.
    let flow = flowSpeedMultiplier;

    // if the user is trying to speed it up to more than 10x, then lock it at 10x.
    if (flow > 10)
    {
      flow = 10;
    }
    // if the user is trying to reduce the speed to less than 0.1x, then lock it at 0.1x.
    else if (flow < 0.1)
    {
      flow = 0.1;
    }

    const newTickSpeed = Math.ceil(60 / flow);
    this.setTickFrames(newTickSpeed);
  }

  /**
   * Gets whether or not the time window is visibile on the map.
   * @returns {boolean}
   */
  isMapWindowVisible()
  {

    return this.isVisible();
  }

  /**
   * Gets whether or not time is actively flowing right now.
   * @returns {boolean}
   */
  isActive()
  {

    return this._active;
  }

  /**
   * Deactivates TIME. Time will stop flowing if it wasn't already stopped.
   */
  deactivate()
  {

    // store  active on the instance for later reads.
    this._active = false;
  }

  /**
   * Activates TIME. Time will now start flowing if it wasn't already started.
   */
  activate()
  {

    // store  active on the instance for later reads.
    this._active = true;
  }

  /**
   * Gets whether or not TIME is blocked from flowing.
   * @returns {boolean}
   */
  isBlocked()
  {

    return this._blocked;
  }

  /**
   * Blocks time and prevents it from flowing regardless of previous flow.
   */
  block()
  {

    // store  blocked on the instance for later reads.
    this._blocked = true;
  }

  /**
   * Unblocks time and allows it to return to it's previous flow.
   */
  unblock()
  {

    // store  blocked on the instance for later reads.
    this._blocked = false;
  }

  /**
   * Gets whether or not the screen tone is currently locked from changing.
   * @returns {boolean}
   */
  isToneLocked()
  {

    return this._toneLocked;
  }

  /**
   * Locks the screen's tone, preventing it from changing by this system.
   */
  lockTone()
  {

    // store  tone locked on the instance for later reads.
    this._toneLocked = true;
  }

  /**
   * Unlocks the screen's tone, allowing this system to regain control over it.
   */
  unlockTone()
  {

    // store  tone locked on the instance for later reads.
    this._toneLocked = false;
  }

  /**
   * Hides the time window on the map.
   */
  hideMapWindow()
  {

    // store  visible on the instance for later reads.
    this.setVisible(false);
  }

  /**
   * Shows the time window on the map.
   */
  showMapWindow()
  {

    // store  visible on the instance for later reads.
    this.setVisible(true);
  }

  /**
   * Toggles the map window visibility.
   */
  toggleMapWindow()
  {
    // visibility is always a boolean, so flipping it needs no third case for "neither".
    this.setVisible(!this.isVisible());
  }

  /**
   * Flags oneself for having been updated so HUD elements can update accordingly.
   */
  flagForHudUpdate()
  {
    // store  has been updated on the instance for later reads.
    this.setHasBeenUpdated(true);
  }

  /**
   * Acknowledges a HUD update.
   */
  acknowledgeHudUpdate()
  {
    // store  has been updated on the instance for later reads.
    this.setHasBeenUpdated(false);
  }

  /**
   * Gets whether or not TIME has been updated and thus the HUD should be updated.
   * @returns {boolean}
   */
  needsHudUpdate()
  {
    return this.hasBeenUpdated();
  }

  /**
   * Updates the time when the framecount aligns with the designated tick frame count.
   */
  update()
  {

    // check if we can update TIME.
    if (this.canUpdateTime())
    {
      // process the TIME update.
      this.handleUpdateTime();
    }

    // check if we need to process a tone change.
    if (this.getNeedsToneChange())
    {
      // process the tone update.
      this.handleUpdateTone();
    }
  }

  /**
   * Determine if TIME can be updated.
   * @returns {boolean}
   */
  canUpdateTime()
  {

    // if the frame count is divisible cleanly by the flow of TIME, then its time to tick TIME.
    if (Graphics.frameCount % this.getTickSpeed() === 0) return true;

    // it is not time to update TIME.
    return false;
  }

  /**
   * Processes TIME updating.
   */
  handleUpdateTime()
  {

    // process time advancement.
    this.tickTime();

    // update the relevant variables- if applicable.
    this.updateVariables();

    // flag for HUD updates.
    this.flagForHudUpdate();
  }

  /**
   * Processes screen tone updating.
   */
  handleUpdateTone()
  {

    // disable the flag for tone change processing.
    this.setNeedsToneChange(false);

    // execute the tone change.
    this.processToneChange();
  }

  /**
   * Gets whether or not the screen's tone change is needed.
   * @returns {boolean}
   */
  getNeedsToneChange()
  {

    if (!J.TIME.Metadata.ChangeToneByTime)
    {
      return false;
    }

    // if we don't have a map to inspect, don't try to interpret it.
    if (!$dataMap || !$dataMap.meta)
    {
      console.warn("no datamap to inspect.");
      return false;
    }

    // note that a map tagged to opt out of tone changes is deliberately NOT short-circuited here.
    // suppressing the change outright used to leave the previous map's tone painted on the screen,
    // so walking into a cave at midnight kept the cave midnight-blue. the opt-out is handled where
    // the target tone is chosen instead- see targetTone- so that such a map resolves to a neutral
    // tone and this pipeline goes on to actually apply it.
    return this._needsToneChange;
  }

  /**
   * Sets whether or not the screen's tone change is needed.
   * @param {boolean} need Whether or not a tone change is needed.
   */
  setNeedsToneChange(need = true)
  {

    // store  needs tone change on the instance for later reads.
    this._needsToneChange = need;
  }

  /**
   * Gets the current screen's tone.
   * @returns {[number, number, number, number]}
   */
  getCurrentTone()
  {

    return this._currentTone;
  }

  /**
   * Sets the current screen's tone.
   * @param {[number, number, number, number]} newTone The new tone to change to.
   */
  setCurrentTone(newTone)
  {

    // store  current tone on the instance for later reads.
    this._currentTone = newTone;
  }

  /**
   * Updates the screen's tone based on the current time.
   */
  updateCurrentTone()
  {

    if (!this.canUpdateTone()) return;

    // if we reached this point, then grab the target tone
    const tone = this.targetTone();
    if (!this.isSameTone(tone))
    {
      this.setCurrentTone(tone.clone());
      this.setNeedsToneChange(true);
    }
  }

  /**
   * Determines the tone the screen ought to be showing right now.
   *
   * Normally that is whatever the hour of the day calls for, but a map can opt out of the day/night
   * cycle entirely with a `noToneChange` tag- an interior, a cave, anywhere the sky is not visible.
   * Such a map resolves to a neutral tone rather than to no answer at all, because the screen tint
   * is global state that outlives a map change: nothing in the engine clears it on transfer, so
   * declining to answer leaves the previous map's tone painted over the new one.
   * @returns {[number, number, number, number]}
   */
  targetTone()
  {
    // a map that sits outside the day/night cycle wants no tint of ours, which is a neutral tone.
    if (this.isToneSuppressedByMap()) return [ 0, 0, 0, 0 ];

    // everywhere else takes the tone belonging to the current hour.
    return this.translateHourToTone();
  }

  /**
   * Determines whether the active map has opted out of the day/night tone cycle.
   * @returns {boolean}
   */
  isToneSuppressedByMap()
  {
    // with no map loaded there is nothing opting out of anything.
    if (!$dataMap || !$dataMap.meta) return false;

    // the tag's mere presence is the opt-in; RMMZ hands back `true` for a bare `<noToneChange>`.
    return Boolean($dataMap.meta["noToneChange"]);
  }

  /**
   * Gets whether or not the screen's tone can be updated.
   * @returns {boolean}
   */
  canUpdateTone()
  {

    // if the user decided they never want to update tones, then don't force them.
    if (!J.TIME.Metadata.ChangeToneByTime)
    {
      return false;
    }

    // if the tone is locked for control reasons, then don't update it.
    if (this.isToneLocked())
    {
      return false;
    }

    return true;
  }

  /**
   * Determines the tone associated with the current hour of the day.
   * Tone is represented as whole numbers in an array: `[red, green, blue, grey]`.
   * For example: `[100, -50, 0, 0]`. `Grey` must be between 0 and 255, while the rest can
   * be between -255 and 255.
   * @returns {[number, number, number, number]}
   */
  translateHourToTone()
  {
    // real time reads the wall clock, artificial time reads the counter this class maintains.
    // sourcing the hour is this class's business; turning it into a colour is not.
    const hours = J.TIME.Metadata.UseRealTime
      ? new Date().getHours()
      : this.hours();

    return TimeToneResolver.toneOfHour(hours);
  }

  /**
   * Compares the current tone with a target tone to see if they are the same.
   * @param {[number, number, number, number]} targetTone The tone being compared against.
   * @returns {boolean}
   */
  isSameTone(targetTone)
  {
    return TimeToneResolver.isSameTone(this.getCurrentTone(), targetTone);
  }

  /**
   * Processes the screen's tone change.
   * @param {boolean} skip If true, then there will be no transition time. Defaults to false.
   */
  processToneChange(skip = false)
  {

    if (skip)
    {
      $gameScreen.startTint(this.getCurrentTone(), 1);
    }
    else
    {
      $gameScreen.startTint(this.getCurrentTone(), 300);
    }
  }

  /**
   * Gets a snapshot of the current time.
   * @returns {Time_Snapshot}
   */
  currentTime()
  {

    // return the snapshot.
    return this.getTimeSnapshot();
  }

  /**
   * Gets the {@link Time_Snapshot} based on mode of time configured.
   * @returns {Time_Snapshot}
   */
  getTimeSnapshot()
  {

    // check if we're using real or artificial time.
    if (J.TIME.Metadata.UseRealTime)
    {
      // render a realtime snapshot.
      return this.determineRealTime();
    }
    // we're using artificial time.
    else
    {
      // render the artificial snapshot.
      return this.determineArtificialTime();
    }
  }

  /**
   * Builds a snapshot of the time designated by the array of numbers.
   * @param {[number, number, number, number, number, number]} fromArray The six-length array of numbers
   * @returns {Time_Snapshot}
   */
  toTimeSnapshot(fromArray)
  {

    const [ seconds, minutes, hours, days, months, years ] = fromArray;
    const timeOfDayId = this.timeOfDay(hours);
    const seasonOfYearId = this.seasonOfYear(months);
    return new Time_Snapshot(
      seconds,
      minutes,
      hours,
      days,
      months,
      years,
      timeOfDayId,
      seasonOfYearId);
  }

  /**
   * Assigns the current time to the designated variables.
   */
  updateVariables()
  {

    // if they haven't chosen to use variable assignment, then don't do that.
    if (!J.TIME.Metadata.UseVariableAssignment) return;

    // grab the current time's snapshot.
    const timeSnapshot = this.getTimeSnapshot();

    // also update the variables with the current time snapshot.
    this.updateVariablesBySnapshot(timeSnapshot);
  }

  /**
   * Update the variables for TIME based on a {@link Time_Snapshot}.
   * @param {Time_Snapshot} timeSnapshot The snapshot of TIME to update variables with.
   */
  updateVariablesBySnapshot(timeSnapshot)
  {

    // if they haven't chosen to use variable assignment, then don't do that.
    if (!J.TIME.Metadata.UseVariableAssignment) return;

    // assign all them values to their variables.
    $gameVariables.setValue(J.TIME.Metadata.SecondsVariable, timeSnapshot.seconds);
    $gameVariables.setValue(J.TIME.Metadata.MinutesVariable, timeSnapshot.minutes);
    $gameVariables.setValue(J.TIME.Metadata.HoursVariable, timeSnapshot.hours);
    $gameVariables.setValue(J.TIME.Metadata.DaysVariable, timeSnapshot.days);
    $gameVariables.setValue(J.TIME.Metadata.MonthsVariable, timeSnapshot.months);
    $gameVariables.setValue(J.TIME.Metadata.YearsVariable, timeSnapshot.years);
    $gameVariables.setValue(J.TIME.Metadata.TimeOfDayIdVariable, timeSnapshot._timeOfDayId);
    $gameVariables.setValue(J.TIME.Metadata.TimeOfDayNameVariable, timeSnapshot.timeOfDayName);
    $gameVariables.setValue(J.TIME.Metadata.SeasonOfYearIdVariable, timeSnapshot._seasonOfYearId);
    $gameVariables.setValue(J.TIME.Metadata.SeasonOfYearNameVariable, timeSnapshot.seasonOfTheYearName);
  }

  /**
   * Gets a snapshot of the current time that is artificial.
   * @returns {Time_Snapshot}
   */
  determineArtificialTime()
  {

    const timeOfDayId = this.timeOfDay(this.hours());
    const seasonOfYearId = this.seasonOfYear(this.months());
    return new Time_Snapshot(
      this.seconds(),
      this.minutes(),
      this.hours(),
      this.days(),
      this.months(),
      this.years(),
      timeOfDayId,
      seasonOfYearId);
  }

  /**
   * Gets a snapshot of the current time in the real world.
   * @returns {Time_Snapshot}
   */
  determineRealTime()
  {

    // construct date for the next step in this routine.
    const date = new Date();
    const seconds = date.getSeconds();
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const days = date.getDate();
    const months = date.getMonth() + 1; //? returns 0-11 for some reason instead of 1-12.
    const years = date.getFullYear();
    const timeOfDayId = this.timeOfDay(hours);
    const seasonOfYearId = this.seasonOfYear(months);
    return new Time_Snapshot(seconds, minutes, hours, days, months, years, timeOfDayId, seasonOfYearId);
  }

  /**
   * Translates the current hour into the time of the day id.
   * @returns {number}
   */
  timeOfDay(hours)
  {
    // the phases the tone fades between and the time-of-day ids surfaced to events are the same six
    // buckets, so they are resolved in one place rather than defined twice and left to drift.
    return TimeToneResolver.phaseOfHour(hours);
  }

  /**
   * Determines when the (hour) start of a given time of day is.
   * @param {number} timeOfDayId The id of the time of day.
   * @returns
   */
  startOfTimeOfDay(timeOfDayId)
  {
    return TimeToneResolver.startOfPhase(timeOfDayId);
  }

  /**
   * Translates the current month into the season of the year id.
   * @returns {number}
   */
  seasonOfYear(months)
  {

    const springMonths = [ 3, 4, 5 ];
    const summerMonths = [ 6, 7, 8 ];
    const autumnMonths = [ 9, 10, 11 ];
    const winterMonths = [ 1, 2, 12 ];
    switch (true)
    {
      case (springMonths.includes(months)):
        return 0;
      case (summerMonths.includes(months)):
        return 1;
      case (autumnMonths.includes(months)):
        return 2;
      case (winterMonths.includes(months)):
        return 3;
      default:
        return -1;
    }
  }

  /**
   * Sets the time to a fixed point.
   * @param {number} seconds The new second.
   * @param {number} minutes The new minute.
   * @param {number} hours The new hour.
   * @param {number} days The new day.
   * @param {number} months The new month.
   * @param {number} years The new year.
   */
  setTime(seconds, minutes, hours, days, months, years)
  {

    // don't actually set time if using real time, it'll just get reset in 0.5 seconds.
    if (J.TIME.Metadata.UseRealTime) return;

    // store  seconds on the instance for later reads.
    this.setSeconds(seconds);
    this.setMinutes(minutes);
    this.setHours(hours);
    this.setDays(days);
    this.setMonths(months);
    this.setYears(years);
  }

  /**
   * Fast forwards to the next instance of a specific time of day.
   *
   * If the current time of day IS the target time of day, it will instead skip
   * to the following day's time of day.
   * @param {number} targetTimeOfDayId The target time of day's id.
   */
  jumpToTimeOfDay(targetTimeOfDayId)
  {

    const currentTimeOfDay = this.timeOfDay(this.hours());
    let timeUntilTargetTimeOfDay;

    if (currentTimeOfDay >= targetTimeOfDayId)
    {
      const timeToEndOfDay = 24 - this.hours();
      const startingHourTargetTimeOfday = this.startOfTimeOfDay(targetTimeOfDayId);
      timeUntilTargetTimeOfDay = timeToEndOfDay + startingHourTargetTimeOfday
    }
    else
    {
      const startingHourTargetTimeOfday = this.startOfTimeOfDay(targetTimeOfDayId);
      timeUntilTargetTimeOfDay = startingHourTargetTimeOfday - this.hours();
    }

    this.addHours(timeUntilTargetTimeOfDay);
    this.setSeconds(0);
    this.setMinutes(0);
  }

  /**
   * Executes the progression of time automatically. Adds the default amount of seconds
   * to the current time with every tick. This function was designed to emulate the ticking
   * of the second hand, but if the defaults are changed, it can tick multiple seconds or
   * even multiple minutes per tick.
   */
  tickTime()
  {

    this.addSeconds();
  }

  /**
   * Ticks the second counter up by a designated amount.
   * @param {number} seconds The number of seconds to tick.
   */
  addSeconds(seconds = this._secondsPerTick)
  {
    // seconds reset on reaching 60 and hand a tick's worth of minutes upward.
    this.advanceUnit(
      seconds,
      Game_Time.secondsPerMinute,
      true,
      () => this.seconds(),
      newSeconds => this.setSeconds(newSeconds),
      () => this.addMinutes(this.minutesPerTick()));
  }

  /**
   * Advances a single unit of the clock, spilling any excess up into the unit above it.
   *
   * Every unit from seconds through months shares this shape: land on a new value, and while that
   * value has outgrown its own range, shed one full unit of itself and bump the next unit up. What
   * gets bumped is a *tick's worth* of the larger unit rather than exactly one of it, which is what
   * lets a configuration advance several minutes per minute of overflow.
   *
   * Note that overflow is the only direction handled. Handing a negative amount to a unit that does
   * not overflow simply writes the negative result through, since there is no borrowing counterpart.
   * @param {number} amount How much of this unit to add.
   * @param {number} limit How many of this unit fit inside the unit above it.
   * @param {boolean} isZeroBased True when the unit counts from 0 and resets on reaching the limit,
   * false when it counts from 1 and only resets after passing the limit.
   * @param {function(): number} read Reads this unit's current value.
   * @param {function(number): void} write Writes this unit's new value.
   * @param {function(): void} carry Advances the unit above this one by a tick's worth.
   */
  advanceUnit(amount, limit, isZeroBased, read, write, carry)
  {
    // zero-based units are spent the moment they reach their limit; one-based units get to sit on it.
    const hasOverflowed = value => (isZeroBased
      ? value >= limit
      : value > limit);

    // where this unit lands before any spilling is accounted for.
    let potential = read() + amount;

    // a value still inside its own range is just an assignment, and nothing above it moves.
    if (!hasOverflowed(potential))
    {
      write(potential);

      return;
    }

    // otherwise shed one full unit at a time upward until what remains fits back in range.
    while (hasOverflowed(potential))
    {
      carry();
      potential -= limit;
    }

    write(potential);
  }

  /**
   * Ticks the minute counter up by a designated amount.
   * @param {number} minutes The number of minutes to tick.
   */
  addMinutes(minutes = this._minutesPerTick)
  {
    // minutes are the finest granularity at which the screen's tone visibly shifts, so this is where
    // the tone gets re-evaluated rather than on every single second.
    this.updateCurrentTone();

    // minutes reset on reaching 60 and hand a tick's worth of hours upward.
    this.advanceUnit(
      minutes,
      Game_Time.minutesPerHour,
      true,
      () => this.minutes(),
      newMinutes => this.setMinutes(newMinutes),
      () => this.addHours(this.hoursPerTick()));
  }

  /**
   * Ticks the hour counter up by a designated amount.
   * @param {number} hours The number of hours to tick.
   */
  addHours(hours = this._hoursPerTick)
  {
    // hours reset on reaching 24 and hand a tick's worth of days upward.
    this.advanceUnit(
      hours,
      Game_Time.hoursPerDay,
      true,
      () => this.hours(),
      newHours => this.setHours(newHours),
      () => this.addDays(this.daysPerTick()));
  }

  /**
   * Ticks the days counter up by a designated amount.
   * @param {number} days The number of days to tick.
   */
  addDays(days = this._daysPerTick)
  {
    // days count from 1, so the 30th is still a valid day and only the 31st spills into a new month.
    this.advanceUnit(
      days,
      Game_Time.daysPerMonth,
      false,
      () => this.days(),
      newDays => this.setDays(newDays),
      () => this.addMonths(this.monthsPerTick()));
  }

  /**
   * Ticks the months counter up by a designated amount.
   * @param {number} months The number of months to tick.
   */
  addMonths(months = this._monthsPerTick)
  {
    // months count from 1, so the 12th is still a valid month and only the 13th spills into a new year.
    this.advanceUnit(
      months,
      Game_Time.monthsPerYear,
      false,
      () => this.months(),
      newMonths => this.setMonths(newMonths),
      () => this.addYears(this.yearsPerTick()));
  }

  /**
   * Ticks the years counter up by a designated amount.
   * @param {number} years The number of years to tick.
   */
  addYears(years = this._yearsPerTick)
  {

    this.setYears(this.years() + years);
  }
}

SerializableRegistry.register(Game_Time);

export default Game_Time;
//endregion Game_Time