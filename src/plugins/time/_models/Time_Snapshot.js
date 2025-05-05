//region Time_Snapshot
/**
 * A class representing a snapshot in time of a moment.
 */
class Time_Snapshot
{
  /**
   * @constructor
   * @param {number} seconds The seconds of the current time.
   * @param {number} minutes The minutes of the current time.
   * @param {number} hours The hours of the current time.
   * @param {number} days The days of the current time.
   * @param {number} months The months of the current time.
   * @param {number} years The years of the current time.
   * @param {number} timeOfDayId The id of the time of day.
   * @param {number} seasonOfYearId The id of the season of the year.
   */
  constructor(seconds, minutes, hours, days, months, years, timeOfDayId, seasonOfYearId)
  {
    /**
     * The seconds of the current time.
     * @type {number}
     */
    this.seconds = seconds;

    /**
     * The minutes of the current time.
     * @type {number}
     */
    this.minutes = minutes;

    /**
     * The hours of the current time.
     * @type {number}
     */
    this.hours = hours;

    /**
     * The days of the current time.
     * @type {number}
     */
    this.days = days;

    /**
     * The months of the current time.
     * @type {number}
     */
    this.months = months;

    /**
     * The years of the current time.
     * @type {number}
     */
    this.years = years;

    /**
     * The id of the time of day.
     * @type {number}
     */
    this._timeOfDayId = timeOfDayId;

    /**
     * The id of the season of the year.
     * @type {number}
     */
    this._seasonOfYearId = seasonOfYearId;
  };

  //region statics
  /**
   * Translates the numeric season of the year into it's proper name.
   * @param {number} seasonId The numeric representation of the season of the year.
   * @returns {string}
   */
  static SeasonsName(seasonId)
  {
    switch (seasonId)
    {
      case 0:
        return "Spring";
      case 1:
        return "Summer";
      case 2:
        return "Autumn";
      case 3:
        return "Winter";
      default:
        console.error(`${seasonId} is not a valid season id.`);
        return null;
    }
  };

  /**
   * Translates the numeric season of the year into it's icon index.
   * @param {number} seasonId The numeric representation of the season of the year.
   * @returns {string}
   */
  static SeasonsIconIndex(seasonId)
  {
    switch (seasonId)
    {
      case 0:
        return 887;
      case 1:
        return 888;
      case 2:
        return 889;
      case 3:
        return 890;
      default:
        return `${seasonId} is not a valid season id.`;
    }
  };

  /**
   * Translates the name of the season into its id.
   * @param {string} seasonName The name of the season.
   * @returns {number}
   */
  static SeasonsId(seasonName)
  {
    switch (seasonName.toLowerCase())
    {
      case "spring":
        return 0;
      case "summer":
        return 1;
      case "autumn":
      case "fall":
        return 2;
      case "winter":
        return 3;
      default:
        console.error(`${seasonName} is not a valid season name.`);
        return -1;
    }
  }

  /**
   * Translates the numeric time of the day into it's proper name.
   * @param {number} timeOfDayId The numeric representation of the time of the day.
   * @returns {string}
   */
  static TimesOfDayName(timeOfDayId)
  {
    switch (timeOfDayId)
    {
      case 0:
        return "Night";     // midnight-4am aka 0-4
      case 1:
        return "Dawn";      // 4am-8am aka 4-8
      case 2:
        return "Morning";   // 8am-noon aka 8-12
      case 3:
        return "Afternoon"; // noon-4pm aka 12-16
      case 4:
        return "Evening";   // 4pm-8pm aka 16-20
      case 5:
        return "Twilight";  // 8pm-midnight aka 20-2359
      default:
        console.error(`${timeOfDayId} is not a valid time of day id.`);
        return null;
    }
  };

  /**
   * Translates the numeric time of the day into it's icon index.
   * @param {number} timeOfDayId The numeric representation of the time of the day.
   * @returns {string}
   */
  static TimesOfDayIcon(timeOfDayId)
  {
    switch (timeOfDayId)
    {
      case 0:
        return 2256;  // midnight-4am
      case 1:
        return 2260;  // 4am-8am
      case 2:
        return 2261;  // 8am-noon
      case 3:
        return 2261;  // noon-4pm
      case 4:
        return 2257;  // 4pm-8pm
      case 5:
        return 2256;  // 8pm-midnight
      default:
        return `${timeOfDayId} is not a valid time of day id.`;
    }
  };

  /**
   * Translates the name of a time of the day into its id.
   * @param {string} timeOfDayString The name of the time of the day.
   * @returns {number}
   */
  static TimesOfDayId(timeOfDayString)
  {
    switch (timeOfDayString.toLowerCase())
    {
      case "night":
        return 0;     // midnight-4am
      case "dawn":
        return 1;      // 4am-8am
      case "morning":
        return 2;   // 8am-noon
      case "afternoon":
        return 3; // noon-4pm
      case "evening":
        return 4;   // 4pm-8pm
      case "twilight":
        return 5;  // 8pm-midnight
      default:
        console.error(`${timeOfDayString} is not a valid time of day name.`);
        return -1;
    }
  }

  //endregion statics

  /**
   * Gets the name of the current season of the year.
   * @type {string}
   */
  get seasonOfTheYearName()
  {
    return Time_Snapshot.SeasonsName(this._seasonOfYearId);
  };

  /**
   * Gets the icon index of the current season of the year.
   * @type {number}
   */
  get seasonOfTheYearIcon()
  {
    return Time_Snapshot.SeasonsIconIndex(this._seasonOfYearId);
  };

  /**
   * Gets the name of the current time of the day.
   * @type {string}
   */
  get timeOfDayName()
  {
    return Time_Snapshot.TimesOfDayName(this._timeOfDayId);
  };

  /**
   * Gets the icon index of the current time of the day.
   * @type {number}
   */
  get timeOfDayIcon()
  {
    return Time_Snapshot.TimesOfDayIcon(this._timeOfDayId);
  };

  /**
   * Determines if this {@link Time_Snapshot} is effectively the same as the provided snapshot.<br/>
   * "Effectively the same" translates to "all time properties are the same from seconds to years" as the target.
   * @param {Time_Snapshot} snapshot The target snapshot to compare equality against.
   * @returns {boolean} True if this snapshot is effectively the same, false otherwise.
   */
  equals(snapshot)
  {
    // if any of the properties don't match, then it isn't equal to the target.
    if (this.years !== snapshot.years) return false;
    if (this.months !== snapshot.months) return false;
    if (this.days !== snapshot.days) return false;
    if (this.hours !== snapshot.hours) return false;
    if (this.minutes !== snapshot.minutes) return false;
    if (this.seconds !== snapshot.seconds) return false;

    // it must be equal!
    return true;
  }

  /**
   * Determines if this {@link Time_Snapshot} is after the provided snapshot.
   * @param {Time_Snapshot} snapshot The target snapshot to see if this snapshot is after.
   * @returns {boolean} True if this snapshot is after the target, false otherwise.
   */
  isAfter(snapshot)
  {
    // NOTE: for using Date objects, the months value is the index, but we use it as the literal month value.
    const thisDate = new Date(this.years, this.months - 1, this.days, this.hours, this.minutes, this.seconds);
    const targetDate = new Date(
      snapshot.years,
      snapshot.months - 1,
      snapshot.days,
      snapshot.hours,
      snapshot.minutes,
      snapshot.seconds);

    return thisDate > targetDate;
  }

  /**
   * Determines if this {@link Time_Snapshot} is before the provided snapshot.
   * @param {Time_Snapshot} snapshot The target snapshot to see if this snapshot is before.
   * @returns {boolean} True if this snapshot is before the target, false otherwise.
   */
  isBefore(snapshot)
  {
    // NOTE: for using Date objects, the months value is the index, but we use it as the literal month value.
    const thisDate = new Date(this.years, this.months - 1, this.days, this.hours, this.minutes, this.seconds);
    const targetDate = new Date(
      snapshot.years,
      snapshot.months - 1,
      snapshot.days,
      snapshot.hours,
      snapshot.minutes,
      snapshot.seconds);

    return thisDate < targetDate;
  }

  /**
   * Determines of this {@link Time_Snapshot} is between the two provided snapshots.
   * @param {Time_Snapshot} start The starting snapshot to check betweenness against.
   * @param {Time_Snapshot} end The ending snapshot to check betweenness against.
   * @param {boolean} [startInclusive=false] Whether or not to include the start time as "between"; defaults to false.
   * @param {boolean} [endInclusive=false] Whether or not to include the end time as "between"; defaults to false.
   */
  isBetweenSnapshots(start, end, startInclusive = false, endInclusive = false)
  {
    // check if this snapshot is after the start.
    const isAfterStart = this.isAfter(start) || (startInclusive && this.equals(start));

    // if this snapshot isn't after the start, then it is not between.
    if (!isAfterStart) return false;

    // check if this snapshot is before the end.
    const isBeforeEnd = this.isBefore(end) || (endInclusive && this.equals(end));

    // if this snapshot isn't before the end, then it is not between.
    if (!isBeforeEnd) return false;

    // this snapshot is between the start and end!
    return true;
  }

  /**
   * Determines whether or not this {@link Time_Snapshot} is between the given start and end {@link Date}s.
   * @param {Date} start The start date.
   * @param {Date} end The end date.
   * @param {boolean} [startInclusive=false] Whether or not to include the start time as "between"; defaults to false.
   * @param {boolean} [endInclusive=false] Whether or not to include the end time as "between"; defaults to false.
   */
  isBetweenDates(start, end, startInclusive = false, endInclusive = false)
  {
    const startTimeSnapshot = this.#dateToSnapshot(start);
    const endTimeSnapshot = this.#dateToSnapshot(end);

    return this.isBetweenSnapshots(startTimeSnapshot, endTimeSnapshot, startInclusive, endInclusive);
  }

  /**
   * Maps a {@link Date} to a {@link Time_Snapshot}.
   * @param {Date} date The date to map to a {@link Time_Snapshot}.
   * @returns {Time_Snapshot} The mapped snapshot.
   */
  #dateToSnapshot(date)
  {
    const dateTimeOfDay = $gameTime.timeOfDay(date.getHours());
    const seasonOfYear = $gameTime.seasonOfYear(date.getMonth() + 1);
    return new Time_Snapshot(
      date.getSeconds(),
      date.getMinutes(),
      date.getHours(),
      date.getDate(),
      date.getMonth() + 1,
      date.getFullYear(),
      dateTimeOfDay,
      seasonOfYear)
  }
}

//endregion Time_Snapshot