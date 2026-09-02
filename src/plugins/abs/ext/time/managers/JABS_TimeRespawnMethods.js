//region JABS_TimeRespawnMethods
/**
 * This static class holds the calendar arithmetic behind the respawn methods this ship registers.
 *
 * Every method reduces to the same shape: at death, find the start of the next occurrence of some
 * calendar moment- strictly after now- and encode it as a comparable scalar. During sweeps, the
 * current time is encoded the same way and the two are compared. All of it reads the clock through
 * `$gameTime`, so both the artificial calendar and real-time mode resolve correctly.
 */
class JABS_TimeRespawnMethods
{
  /**
   * The first month of each season, keyed by season id.
   * Derived from {@link Game_Time.seasonOfYear}'s month groupings- winter's months are 12, 1, 2,
   * so in cyclic order the season begins in month 12.
   * @type {Map<number, number>}
   */
  static SEASON_START_MONTHS = new Map([ [ 0, 3 ], [ 1, 6 ], [ 2, 9 ], [ 3, 12 ] ]);

  /**
   * Encodes a snapshot into a single comparable scalar.
   *
   * The day radix is 31 rather than the artificial calendar's 30 on purpose: real-time mode
   * produces day 31, and a radix too small would fold the end of one month into the start of the
   * next. 31 keeps the encoding strictly monotonic for both calendars, which is all a due
   * comparison needs- this is an ordering, not an elapsed-time measure.
   * @param {Time_Snapshot} snapshot The snapshot to encode.
   * @returns {number} The comparable scalar for this moment.
   */
  static epochOf(snapshot)
  {
    // fold years down through months into a single day count.
    const totalDays = (((snapshot.years * 12) + (snapshot.months - 1)) * 31) + (snapshot.days - 1);

    // fold the day count down through the clock into seconds.
    return snapshot.seconds + (60 * (snapshot.minutes + (60 * (snapshot.hours + (24 * totalDays)))));
  }

  /**
   * Encodes the current moment into the same comparable scalar space as {@link epochOf}.
   * @returns {number} The comparable scalar for right now.
   */
  static currentEpoch()
  {
    // grab the current time snapshot.
    const now = $gameTime.currentTime();

    // encode it.
    return this.epochOf(now);
  }

  /**
   * Builds a snapshot of the given date at the given time of the clock.
   * @param {Time_Snapshot} snapshot The snapshot providing the date.
   * @param {number} hours The hour of the clock.
   * @param {number} minutes The minute of the clock.
   * @returns {Time_Snapshot} The same date, at the requested clock time.
   */
  static atClockTime(snapshot, hours, minutes)
  {
    // rebuild the snapshot with the clock replaced and the date kept.
    return $gameTime.toTimeSnapshot([ 0, minutes, hours, snapshot.days, snapshot.months, snapshot.years ]);
  }

  /**
   * Builds a snapshot the given number of whole days after the given snapshot, at the same clock.
   *
   * This is the one place the two calendars genuinely differ: the artificial calendar rolls over
   * every 30 days without exception, while real-time months are irregular and are delegated to
   * the real calendar via `Date`.
   * @param {Time_Snapshot} snapshot The snapshot to advance.
   * @param {number} count The number of days to advance by.
   * @returns {Time_Snapshot} The advanced snapshot.
   */
  static addDays(snapshot, count)
  {
    // real time delegates month irregularity to the real calendar.
    if (J.TIME.Metadata.UseRealTime)
    {
      // build the date, advanced; the Date constructor normalizes the overflow.
      const date = new Date(
        snapshot.years,
        snapshot.months - 1,
        snapshot.days + count,
        snapshot.hours,
        snapshot.minutes,
        snapshot.seconds);

      // rebuild the snapshot from the normalized date.
      return $gameTime.toTimeSnapshot([
        date.getSeconds(),
        date.getMinutes(),
        date.getHours(),
        date.getDate(),
        date.getMonth() + 1,
        date.getFullYear() ]);
    }

    // the artificial calendar is perfectly regular: 30-day months, 12-month years.
    let { days, months, years } = snapshot;
    days += count;

    // roll the overflow up through months and years.
    while (days > Game_Time.daysPerMonth)
    {
      days -= Game_Time.daysPerMonth;
      months += 1;

      // roll a month overflow into the next year.
      if (months > Game_Time.monthsPerYear)
      {
        months -= Game_Time.monthsPerYear;
        years += 1;
      }
    }

    // rebuild the snapshot with the advanced date and the same clock.
    return $gameTime.toTimeSnapshot([ snapshot.seconds, snapshot.minutes, snapshot.hours, days, months, years ]);
  }

  /**
   * Schedules a duration measured on the game clock: come back N in-game minutes from now.
   *
   * This is the duration sibling of core's playtime "seconds"- same statement, different clock.
   * The duration cannot simply be added to the epoch scalar, because that scalar is an ordering
   * with phantom day-31 gaps at artificial month boundaries; instead the minutes fold through
   * real calendar arithmetic into a target moment, which then encodes exactly.
   * @param {string} param The number of in-game minutes to wait.
   * @returns {number|null} The due scalar, or null for a non-positive or non-numeric duration.
   */
  static scheduleGameMinutes(param)
  {
    // translate the raw parameter into a number of minutes.
    const minutes = parseInt(param);

    // zero or garbage minutes is a declaration that means nothing.
    if (!Number.isFinite(minutes) || minutes <= 0) return null;

    // fold the duration into the clock, carrying overflow up through hours into whole days.
    const now = $gameTime.currentTime();
    const totalMinutes = now.minutes + minutes;
    const targetMinute = totalMinutes % 60;
    const totalHours = now.hours + Math.floor(totalMinutes / 60);
    const targetHour = totalHours % 24;
    const dayCount = Math.floor(totalHours / 24);

    // build today's date at the carried clock, then let the calendar carry the whole days.
    const todayAtClock = $gameTime.toTimeSnapshot([
      now.seconds,
      targetMinute,
      targetHour,
      now.days,
      now.months,
      now.years ]);
    const target = this.addDays(todayAtClock, dayCount);

    // that is the moment.
    return this.epochOf(target);
  }

  /**
   * Schedules the next occurrence of a clock time, expressed as an HMM/HHMM number like 830 or 1430.
   *
   * This is the primitive every appointment on the clock reduces to, and "next" is meant strictly:
   * a moment already underway is not one a battler can wait for, so asking for 8:30 at exactly 8:30
   * schedules tomorrow's.
   * @param {string} param The clock time as an HHMM number.
   * @returns {number|null} The due scalar, or null for an invalid clock time.
   */
  static scheduleNextClockTime(param)
  {
    // translate the parameter into a number.
    const clockValue = parseInt(param);

    // garbage or negative clock values schedule nothing.
    if (!Number.isFinite(clockValue) || clockValue < 0) return null;

    // split the number into its hour and minute halves.
    const hours = Math.floor(clockValue / 100);
    const minutes = clockValue % 100;

    // a clock time that isn't on the clock schedules nothing.
    if (hours > 23 || minutes > 59) return null;

    // build today's occurrence of that moment.
    const now = $gameTime.currentTime();
    const todaysOccurrence = this.atClockTime(now, hours, minutes);

    // if today's occurrence is still ahead of us, that is the next one.
    if (this.epochOf(todaysOccurrence) > this.epochOf(now)) return this.epochOf(todaysOccurrence);

    // otherwise the next occurrence is tomorrow's.
    const tomorrowsOccurrence = this.addDays(todaysOccurrence, 1);
    return this.epochOf(tomorrowsOccurrence);
  }

  /**
   * Schedules the start of the next occurrence of a time of day, strictly after now.
   * Dying during the morning schedules tomorrow's morning, not the one already underway.
   *
   * A phase of the day is just a clock time wearing a name, so this resolves the name to the hour
   * that phase begins on and hands the rest to {@link scheduleNextClockTime}.
   * @param {string} param The name of the time of day, like "morning".
   * @returns {number|null} The due scalar, or null for an unrecognized time of day.
   */
  static scheduleTimeOfDay(param)
  {
    // translate the name into the time of day id.
    const timeOfDayId = Time_Snapshot.TimesOfDayId(param);

    // an unrecognized name schedules nothing.
    if (timeOfDayId === -1) return null;

    // determine what hour that time of day begins at.
    const startHour = $gameTime.startOfTimeOfDay(timeOfDayId);

    // phases begin on the hour, so the clock time is that hour with no minutes beside it.
    const clockTime = String(startHour * 100);

    // the start of the next such phase is the next occurrence of that clock time.
    return this.scheduleNextClockTime(clockTime);
  }

  /**
   * Schedules midnight of the next occurrence of a day of the week, strictly after today.
   * Dying on a monday schedules the following monday.
   * @param {string} param The name of the day of the week, like "monday".
   * @returns {number|null} The due scalar, or null for an unrecognized day of the week.
   */
  static scheduleDayOfWeek(param)
  {
    // translate the name into the day of week id.
    const dayOfWeekId = Time_Snapshot.DaysOfWeekId(param);

    // an unrecognized name schedules nothing.
    if (dayOfWeekId === -1) return null;

    // start the search at midnight tomorrow, which keeps "strictly after today" honest.
    const now = $gameTime.currentTime();
    const todayAtMidnight = this.atClockTime(now, 0, 0);
    let candidate = this.addDays(todayAtMidnight, 1);

    // walk forward until the weekday matches; a week is only ever seven days long.
    while (candidate.dayOfWeekId() !== dayOfWeekId)
    {
      candidate = this.addDays(candidate, 1);
    }

    // that is the moment.
    return this.epochOf(candidate);
  }

  /**
   * Schedules the start of the next occurrence of a given month, strictly after now.
   * @param {number} month The month number, 1-12.
   * @returns {number|null} The due scalar, or null for an invalid month.
   */
  static scheduleMonthStart(month)
  {
    // a month that isn't on the calendar schedules nothing.
    if (!Number.isFinite(month) || month < 1 || month > Game_Time.monthsPerYear) return null;

    // build this year's occurrence of that month's first midnight.
    const now = $gameTime.currentTime();
    const thisYearsOccurrence = $gameTime.toTimeSnapshot([ 0, 0, 0, 1, month, now.years ]);

    // if this year's occurrence is still ahead of us, that is the next one.
    if (this.epochOf(thisYearsOccurrence) > this.epochOf(now)) return this.epochOf(thisYearsOccurrence);

    // otherwise the next occurrence is next year's.
    const nextYearsOccurrence = $gameTime.toTimeSnapshot([ 0, 0, 0, 1, month, now.years + 1 ]);
    return this.epochOf(nextYearsOccurrence);
  }

  /**
   * Schedules the start of the next occurrence of a season, strictly after now.
   * Dying mid-winter schedules the coming month-12 winter, the next time the season begins.
   * @param {string} param The name of the season, like "winter".
   * @returns {number|null} The due scalar, or null for an unrecognized season.
   */
  static scheduleSeason(param)
  {
    // translate the name into the season id.
    const seasonId = Time_Snapshot.SeasonsId(param);

    // an unrecognized name schedules nothing.
    if (seasonId === -1) return null;

    // seasons begin at the start of their first month.
    const startMonth = this.SEASON_START_MONTHS.get(seasonId);

    // that month's next start is the season's next start.
    return this.scheduleMonthStart(startMonth);
  }

  /**
   * Determines whether a scheduled calendar moment has passed.
   * @param {number} due The due scalar produced by one of the schedulers above.
   * @returns {boolean}
   */
  static isDue(due)
  {
    return this.currentEpoch() >= due;
  }
}

/**
 * Register every calendar method with core's respawn registry. Each shares the single epoch-based
 * due check, because every scheduler above encodes into the same scalar space.
 *
 * The `next-` prefix is load-bearing rather than decorative. Every method carrying it answers the
 * same question - "when does this moment come around again, strictly after now" - and every method
 * without it is a plain duration. An author reading a tag in an event comment can therefore tell
 * which kind they are looking at without leaving the file, which is the whole reason the prefix
 * exists: the one method that used to break the pattern was misread by the person who wrote it.
 */
JABS_RespawnManager.registerMethod('game-minutes', {
  /**
   * Schedules a duration measured in in-game minutes.
   * @param {string} param The number of in-game minutes, like 30.
   * @returns {number|null}
   */
  schedule: param => JABS_TimeRespawnMethods.scheduleGameMinutes(param),

  /**
   * Determines whether the scheduled calendar moment has passed.
   * @param {number} due The due scalar for the scheduled moment.
   * @returns {boolean}
   */
  isDue: due => JABS_TimeRespawnMethods.isDue(due),
});

JABS_RespawnManager.registerMethod('next-time', {
  /**
   * Schedules the next occurrence of an HHMM clock time.
   * @param {string} param The clock time as an HHMM number, like 830.
   * @returns {number|null}
   */
  schedule: param => JABS_TimeRespawnMethods.scheduleNextClockTime(param),

  /**
   * Determines whether the scheduled calendar moment has passed.
   * @param {number} due The due scalar for the scheduled moment.
   * @returns {boolean}
   */
  isDue: due => JABS_TimeRespawnMethods.isDue(due),
});

JABS_RespawnManager.registerMethod('next-time-of-day', {
  /**
   * Schedules the start of the next occurrence of a time of day.
   * @param {string} param The name of the time of day, like "morning".
   * @returns {number|null}
   */
  schedule: param => JABS_TimeRespawnMethods.scheduleTimeOfDay(param),

  /**
   * Determines whether the scheduled calendar moment has passed.
   * @param {number} due The due scalar for the scheduled moment.
   * @returns {boolean}
   */
  isDue: due => JABS_TimeRespawnMethods.isDue(due),
});

JABS_RespawnManager.registerMethod('next-day-of-week', {
  /**
   * Schedules midnight of the next occurrence of a day of the week.
   * @param {string} param The name of the day of the week, like "monday".
   * @returns {number|null}
   */
  schedule: param => JABS_TimeRespawnMethods.scheduleDayOfWeek(param),

  /**
   * Determines whether the scheduled calendar moment has passed.
   * @param {number} due The due scalar for the scheduled moment.
   * @returns {boolean}
   */
  isDue: due => JABS_TimeRespawnMethods.isDue(due),
});

JABS_RespawnManager.registerMethod('next-month', {
  /**
   * Schedules the start of the next occurrence of a month.
   * @param {string} param The month number, 1-12.
   * @returns {number|null}
   */
  schedule: param => JABS_TimeRespawnMethods.scheduleMonthStart(parseInt(param)),

  /**
   * Determines whether the scheduled calendar moment has passed.
   * @param {number} due The due scalar for the scheduled moment.
   * @returns {boolean}
   */
  isDue: due => JABS_TimeRespawnMethods.isDue(due),
});

JABS_RespawnManager.registerMethod('next-season', {
  /**
   * Schedules the start of the next occurrence of a season.
   * @param {string} param The name of the season, like "winter".
   * @returns {number|null}
   */
  schedule: param => JABS_TimeRespawnMethods.scheduleSeason(param),

  /**
   * Determines whether the scheduled calendar moment has passed.
   * @param {number} due The due scalar for the scheduled moment.
   * @returns {boolean}
   */
  isDue: due => JABS_TimeRespawnMethods.isDue(due),
});

export default JABS_TimeRespawnMethods;
//endregion JABS_TimeRespawnMethods