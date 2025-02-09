//region Game_Time
/**
 * A class for controlling time.
 */
function Game_Time()
{
  // initialize all the properties of TIME.
  this.initMembers();

  // update the tone for the first time.
  this.updateCurrentTone();
}

Game_Time.prototype = {};
Game_Time.prototype.constructor = Game_Time;

//region statics
/**
 * A static representation of the tones for each time of day.
 */
Game_Time.toneOfDay = {
  Night: [ -100, -100, -30, 100 ],
  Dawn: [ -30, -15, 15, 64 ],
  Morning: [ 0, 0, 0, 0 ],
  Afternoon: [ 10, 10, 10, 10 ],
  Evening: [ 0, -30, -30, -30 ],
  Twilight: [ -68, -68, 0, 68 ],
};
//endregion statics

/**
 * Initializes the members of this class.
 */
Game_Time.prototype.initMembers = function()
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
};

//region properties
/**
 * Gets the current tick speed.
 * @returns {number}
 */
Game_Time.prototype.getTickSpeed = function()
{
  return this._tickFrames;
};

/**
 * Sets the new tick speed to (60 / multiplier) frames per second.
 *
 * The threshold for this multiplier is `0.1` to `10.0`.
 * @param {number} flowSpeedMultiplier The new multiplier for how fast a single tick is.
 */
Game_Time.prototype.setTickSpeed = function(flowSpeedMultiplier)
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
  this._tickFrames = newTickSpeed;
};

/**
 * Gets whether or not the time window is visibile on the map.
 * @returns {boolean}
 */
Game_Time.prototype.isMapWindowVisible = function()
{
  return this._visible;
};

/**
 * Gets whether or not time is actively flowing right now.
 * @returns {boolean}
 */
Game_Time.prototype.isActive = function()
{
  return this._active;
};

/**
 * Deactivates TIME. Time will stop flowing if it wasn't already stopped.
 */
Game_Time.prototype.deactivate = function()
{
  this._active = false;
};

/**
 * Activates TIME. Time will now start flowing if it wasn't already started.
 */
Game_Time.prototype.activate = function()
{
  this._active = true;
};

/**
 * Gets whether or not TIME is blocked from flowing.
 * @returns {boolean}
 */
Game_Time.prototype.isBlocked = function()
{
  return this._blocked;
};

/**
 * Blocks time and prevents it from flowing regardless of previous flow.
 */
Game_Time.prototype.block = function()
{
  this._blocked = true;
};

/**
 * Unblocks time and allows it to return to it's previous flow.
 */
Game_Time.prototype.unblock = function()
{
  this._blocked = false;
};

/**
 * Gets whether or not the screen tone is currently locked from changing.
 * @returns {boolean}
 */
Game_Time.prototype.isToneLocked = function()
{
  return this._toneLocked;
};

/**
 * Locks the screen's tone, preventing it from changing by this system.
 */
Game_Time.prototype.lockTone = function()
{
  this._toneLocked = true;
};

/**
 * Unlocks the screen's tone, allowing this system to regain control over it.
 */
Game_Time.prototype.unlockTone = function()
{
  this._toneLocked = false;
};

/**
 * Hides the time window on the map.
 */
Game_Time.prototype.hideMapWindow = function()
{
  this._visible = false;
};

/**
 * Shows the time window on the map.
 */
Game_Time.prototype.showMapWindow = function()
{
  this._visible = true;
};

/**
 * Toggles the map window visibility.
 */
Game_Time.prototype.toggleMapWindow = function()
{
  if (this._visible === true)
  {
    this._visible = false;
  }
  else if (this._visible === false)
  {
    this._visible = true;
  }
};

/**
 * Flags oneself for having been updated so HUD elements can update accordingly.
 */
Game_Time.prototype.flagForHudUpdate = function()
{
  if (this._hasBeenUpdated === undefined)
  {
    this._hasBeenUpdated = true;
    console.log('hasBeenUpdated property added.');
  }

  this._hasBeenUpdated = true;
};

/**
 * Acknowledges a HUD update.
 */
Game_Time.prototype.acknowledgeHudUpdate = function()
{
  if (this._hasBeenUpdated === undefined)
  {
    this._hasBeenUpdated = false;
    console.log('hasBeenUpdated property added.');
  }

  this._hasBeenUpdated = false;
};

/**
 * Gets whether or not TIME has been updated and thus the HUD should be updated.
 * @returns {boolean}
 */
Game_Time.prototype.needsHudUpdate = function()
{
  if (this._hasBeenUpdated === undefined)
  {
    this._hasBeenUpdated = false;
    console.log('hasBeenUpdated property added.');
  }

  return this._hasBeenUpdated;
};
//endregion properties

/**
 * Updates the time when the framecount aligns with the designated tick frame count.
 */
Game_Time.prototype.update = function()
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
};

/**
 * Determine if TIME can be updated.
 * @returns {boolean}
 */
Game_Time.prototype.canUpdateTime = function()
{
  // if the frame count is divisible cleanly by the flow of TIME, then its time to tick TIME.
  if (Graphics.frameCount % this.getTickSpeed() === 0) return true;

  // it is not time to update TIME.
  return false;
};

/**
 * Processes TIME updating.
 */
Game_Time.prototype.handleUpdateTime = function()
{
  // process time advancement.
  this.tickTime();

  // update the relevant variables- if applicable.
  this.updateVariables();

  // flag for HUD updates.
  this.flagForHudUpdate();
};

/**
 * Processes screen tone updating.
 */
Game_Time.prototype.handleUpdateTone = function()
{
  // disable the flag for tone change processing.
  this.setNeedsToneChange(false);

  // execute the tone change.
  this.processToneChange();
};

//region tone management
/**
 * Gets whether or not the screen's tone change is needed.
 * @returns {boolean}
 */
Game_Time.prototype.getNeedsToneChange = function()
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

  // if there is a tag on the map that specifies not to change the tone, then don't.
  if ($dataMap.meta["noToneChange"])
  {
    return false;
  }

  return this._needsToneChange;
};

/**
 * Sets whether or not the screen's tone change is needed.
 * @param {boolean} need Whether or not a tone change is needed.
 */
Game_Time.prototype.setNeedsToneChange = function(need = true)
{
  this._needsToneChange = need;
};

/**
 * Gets the current screen's tone.
 * @returns {[number, number, number, number]}
 */
Game_Time.prototype.getCurrentTone = function()
{
  return this._currentTone;
};

/**
 * Sets the current screen's tone.
 * @param {[number, number, number, number]} newTone The new tone to change to.
 */
Game_Time.prototype.setCurrentTone = function(newTone)
{
  this._currentTone = newTone;
};

/**
 * Updates the screen's tone based on the current time.
 */
Game_Time.prototype.updateCurrentTone = function()
{
  if (!this.canUpdateTone()) return;

  // if we reached this point, then grab the target tone
  const tone = this.translateHourToTone();
  if (!this.isSameTone(tone))
  {
    this.setCurrentTone(tone.clone());
    this.setNeedsToneChange(true);
  }
};

/**
 * Gets whether or not the screen's tone can be updated.
 * @returns {boolean}
 */
Game_Time.prototype.canUpdateTone = function()
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
};

/**
 * Determines the tone associated with the current hour of the day.
 * Tone is represented as whole numbers in an array: `[red, green, blue, grey]`.
 * For example: `[100, -50, 0, 0]`. `Grey` must be between 0 and 255, while the rest can
 * be between -255 and 255.
 * @returns {[number, number, number, number]}
 */
Game_Time.prototype.translateHourToTone = function()
{
  const hours = J.TIME.Metadata.UseRealTime
    ? new Date().getHours()
    : this._hours;
  let tone = [ 0, 0, 0, 0 ];
  switch (hours)
  {
    case  0: // night
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Twilight, Game_Time.toneOfDay.Night, 0.25);
      break;
    case  1: // night
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Twilight, Game_Time.toneOfDay.Night, 0.50);
      break;
    case  2: // night
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Twilight, Game_Time.toneOfDay.Night, 0.75);
      break;
    case  3: // night
      tone = Game_Time.toneOfDay.Night;
      break;
    case  4: // dawn
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Night, Game_Time.toneOfDay.Dawn, 0.25);
      break;
    case  5: // dawn
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Night, Game_Time.toneOfDay.Dawn, 0.50);
      break;
    case  6: // dawn
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Night, Game_Time.toneOfDay.Dawn, 0.75);
      break;
    case  7: // dawn
      tone = Game_Time.toneOfDay.Dawn;
      break;
    case  8: // morning
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Dawn, Game_Time.toneOfDay.Morning, 0.25);
      break;
    case  9: // morning
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Dawn, Game_Time.toneOfDay.Morning, 0.50);
      break;
    case 10: // morning
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Dawn, Game_Time.toneOfDay.Morning, 0.75);
      break;
    case 11: // morning
      tone = Game_Time.toneOfDay.Morning;
      break;
    case 12: // afternoon
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Morning, Game_Time.toneOfDay.Afternoon, 0.25);
      break;
    case 13: // afternoon
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Morning, Game_Time.toneOfDay.Afternoon, 0.50);
      break;
    case 14: // afternoon
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Morning, Game_Time.toneOfDay.Afternoon, 0.75);
      break;
    case 15: // afternoon
      tone = Game_Time.toneOfDay.Afternoon;
      break;
    case 16: // evening
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Afternoon, Game_Time.toneOfDay.Evening, 0.25);
      break;
    case 17: // evening
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Afternoon, Game_Time.toneOfDay.Evening, 0.50);
      break;
    case 18: // evening
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Afternoon, Game_Time.toneOfDay.Evening, 0.75);
      break;
    case 19: // evening
      tone = Game_Time.toneOfDay.Evening;
      break;
    case 20: // twilight
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Evening, Game_Time.toneOfDay.Twilight, 0.25);
      break;
    case 21: // twilight
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Evening, Game_Time.toneOfDay.Twilight, 0.50);
      break;
    case 22: // twilight
      tone = this.toneBetweenTones(Game_Time.toneOfDay.Evening, Game_Time.toneOfDay.Twilight, 0.75);
      break;
    case 23: // twilight
      tone = Game_Time.toneOfDay.Twilight;
      break;
  }

  return tone;
};

/**
 * Calculates the tone that is a percentage of the way between two tones.
 *
 * Order is important here, as we are calculating a percent of the way from
 * the first tone to the second tone.
 * @param {[number, number, number, number]} tone1 The starting tone.
 * @param {[number, number, number, number]} tone2 The next tone.
 * @param {number} rate The decimal rate of which we are transitioning to.
 * @returns {[number, number, number, number]}
 */
Game_Time.prototype.toneBetweenTones = function(tone1, tone2, rate)
{
  const diff = (a, b) => a > b
    ? a - b
    : b - a;
  const newTone = [];
  tone1.forEach((color1, index) =>
  {
    const color2 = tone2[index];
    const diffToNext = diff(color1, color2);
    const partial = Math.round(diffToNext * rate);
    const newRgbValue = color2 > color1
      ? color1 + partial
      : color1 - partial;
    newTone.push(newRgbValue);
  });

  return newTone;
};

/**
 * Compares the current tone with a target tone to see if they are the same.
 * @param {[number, number, number, number]} targetTone
 * @returns {boolean}
 */
Game_Time.prototype.isSameTone = function(targetTone)
{
  if (this._currentTone.length < 4) return false;

  // individually compare each of the RGBA elements with the new tone's elements.
  if (this._currentTone[0] !== targetTone[0]) return false;
  if (this._currentTone[1] !== targetTone[1]) return false;
  if (this._currentTone[2] !== targetTone[2]) return false;
  if (this._currentTone[3] !== targetTone[3]) return false;

  return true;
};

/**
 * Processes the screen's tone change.
 * @param {boolean} skip If true, then there will be no transition time. Defaults to false.
 */
Game_Time.prototype.processToneChange = function(skip = false)
{
  if (skip)
  {
    $gameScreen.startTint(this._currentTone, 1);
  }
  else
  {
    $gameScreen.startTint(this._currentTone, 300);
  }
};
//endregion tone management

//region time management
/**
 * Gets a snapshot of the current time.
 * @returns {Time_Snapshot}
 */
Game_Time.prototype.currentTime = function()
{
  // return the snapshot.
  return this.getTimeSnapshot();
};

/**
 * Gets the {@link Time_Snapshot} based on mode of time configured.
 * @returns {Time_Snapshot}
 */
Game_Time.prototype.getTimeSnapshot = function()
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
};

/**
 * Builds a snapshot of the time designated by the array of numbers.
 * @param {[number, number, number, number, number, number]} fromArray The six-length array of numbers
 * @returns {Time_Snapshot}
 */
Game_Time.prototype.toTimeSnapshot = function(fromArray)
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
};

/**
 * Assigns the current time to the designated variables.
 */
Game_Time.prototype.updateVariables = function()
{
  // if they haven't chosen to use variable assignment, then don't do that.
  if (!J.TIME.Metadata.UseVariableAssignment) return;

  // grab the current time's snapshot.
  const timeSnapshot = this.getTimeSnapshot();

  // also update the variables with the current time snapshot.
  this.updateVariablesBySnapshot(timeSnapshot);
};

/**
 * Update the variables for TIME based on a {@link Time_Snapshot}.
 * @param {Time_Snapshot} timeSnapshot The snapshot of TIME to update variables with.
 */
Game_Time.prototype.updateVariablesBySnapshot = function(timeSnapshot)
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
};

/**
 * Gets a snapshot of the current time that is artificial.
 * @returns {Time_Snapshot}
 */
Game_Time.prototype.determineArtificialTime = function()
{
  const timeOfDayId = this.timeOfDay(this._hours);
  const seasonOfYearId = this.seasonOfYear(this._months);
  return new Time_Snapshot(
    this._seconds,
    this._minutes,
    this._hours,
    this._days,
    this._months,
    this._years,
    timeOfDayId,
    seasonOfYearId);
};

/**
 * Gets a snapshot of the current time in the real world.
 * @returns {Time_Snapshot}
 */
Game_Time.prototype.determineRealTime = function()
{
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
};

/**
 * Translates the current hour into the time of the day id.
 * @returns {number}
 */
Game_Time.prototype.timeOfDay = function(hours)
{
  switch (true)
  {
    case (hours <= 3):
      return 0;
    case (hours > 3 && hours <= 7):
      return 1;
    case (hours > 7 && hours <= 11):
      return 2;
    case (hours > 11 && hours <= 15):
      return 3;
    case (hours > 15 && hours <= 19):
      return 4;
    case (hours > 19):
      return 5;
    default:
      return -1;
  }
};

/**
 * Determines when the (hour) start of a given time of day is.
 * @param {number} timeOfDayId The id of the time of day.
 * @returns
 */
Game_Time.prototype.startOfTimeOfDay = function(timeOfDayId)
{
  return (timeOfDayId * 4);
};

/**
 * Translates the current month into the season of the year id.
 * @returns {number}
 */
Game_Time.prototype.seasonOfYear = function(months)
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
};

/**
 * Sets the time to a fixed point.
 * @param {number} seconds The new second.
 * @param {number} minutes The new minute.
 * @param {number} hours The new hour.
 * @param {number} days The new day.
 * @param {number} months The new month.
 * @param {number} years The new year.
 */
Game_Time.prototype.setTime = function(seconds, minutes, hours, days, months, years)
{
  // don't actually set time if using real time, it'll just get reset in 0.5 seconds.
  if (J.TIME.Metadata.UseRealTime) return;

  this._seconds = seconds;
  this._minutes = minutes;
  this._hours = hours;
  this._days = days;
  this._months = months;
  this._years = years;
};

/**
 * Fast forwards to the next instance of a specific time of day.
 *
 * If the current time of day IS the target time of day, it will instead skip
 * to the following day's time of day.
 * @param {number} targetTimeOfDayId The target time of day's id.
 */
Game_Time.prototype.jumpToTimeOfDay = function(targetTimeOfDayId)
{
  const currentTimeOfDay = this.timeOfDay(this._hours);
  let timeUntilTargetTimeOfDay = 0;

  if (currentTimeOfDay >= targetTimeOfDayId)
  {
    const timeToEndOfDay = 24 - this._hours;
    const startingHourTargetTimeOfday = this.startOfTimeOfDay(targetTimeOfDayId);
    timeUntilTargetTimeOfDay = timeToEndOfDay + startingHourTargetTimeOfday
  }
  else
  {
    const startingHourTargetTimeOfday = this.startOfTimeOfDay(targetTimeOfDayId);
    timeUntilTargetTimeOfDay = startingHourTargetTimeOfday - this._hours;
  }

  this.addHours(timeUntilTargetTimeOfDay);
  this._seconds = 0;
  this._minutes = 0;
};

/**
 * Executes the progression of time automatically. Adds the default amount of seconds
 * to the current time with every tick. This function was designed to emulate the ticking
 * of the second hand, but if the defaults are changed, it can tick multiple seconds or
 * even multiple minutes per tick.
 */
Game_Time.prototype.tickTime = function()
{
  this.addSeconds();
};
//endregion time management

//region add time
/**
 * Ticks the second counter up by a designated amount.
 * @param {number} seconds The number of seconds to tick.
 */
Game_Time.prototype.addSeconds = function(seconds = this._secondsPerTick)
{
  // check how many seconds we have when adding the tick amount.
  let potentialSeconds = this._seconds + seconds;

  // if we have greater than or equal to 60...
  if (potentialSeconds >= 60)
  {
    // ...keep adding minutes until we're below 60 seconds.
    while (potentialSeconds >= 60)
    {
      this.addMinutes(this._minutesPerTick);
      potentialSeconds -= 60;
    }

    // and reassign the seconds.
    this._seconds = potentialSeconds;
    // if we don't have more than 60, just add the seconds on.
  }
  else
  {
    this._seconds += seconds;
  }
};

/**
 * Ticks the minute counter up by a designated amount.
 * @param {number} minutes The number of minutes to tick.
 */
Game_Time.prototype.addMinutes = function(minutes = this._minutesPerTick)
{
  this.updateCurrentTone();
  let potentialMinutes = this._minutes + minutes;
  if (potentialMinutes >= 60)
  {
    while (potentialMinutes >= 60)
    {
      this.addHours(this._hoursPerDay);
      potentialMinutes -= 60;
    }

    this._minutes = potentialMinutes;
  }
  else
  {
    this._minutes += minutes;
  }
};

/**
 * Ticks the hour counter up by a designated amount.
 * @param {number} hours The number of hours to tick.
 */
Game_Time.prototype.addHours = function(hours = this._hoursPerTick)
{
  let potentialHours = this._hours + hours;
  if (potentialHours >= 24)
  {
    while (potentialHours >= 24)
    {
      this.addDays(this._daysPerTick);
      potentialHours -= 24;
    }

    this._hours = potentialHours;
  }
  else
  {
    this._hours += hours;
  }
};

/**
 * Ticks the days counter up by a designated amount.
 * @param {number} days The number of days to tick.
 */
Game_Time.prototype.addDays = function(days = this._daysPerTick)
{
  let potentialDays = this._days + days;
  if (potentialDays > 30)
  {
    while (potentialDays > 30)
    {
      this.addMonths(this._monthsPerTick);
      potentialDays -= 30;
    }

    this._days = potentialDays;
  }
  else
  {
    this._days += days;
  }
};

/**
 * Ticks the months counter up by a designated amount.
 * @param {number} months The number of months to tick.
 */
Game_Time.prototype.addMonths = function(months = this._monthsPerTick)
{
  let potentialMonths = this._months + months;
  if (potentialMonths > 12)
  {
    while (potentialMonths > 12)
    {
      this.addYears(this._yearsPerTick);
      potentialMonths -= 12;
    }

    this._months = potentialMonths;
  }
  else
  {
    this._months += months;
  }
};

/**
 * Ticks the years counter up by a designated amount.
 * @param {number} years The number of years to tick.
 */
Game_Time.prototype.addYears = function(years = this._yearsPerTick)
{
  this._years += years;
};
//endregion add time

//endregion Game_Time