//region TimeMapper
import TimeConditional from './../_models/TimeConditional.js';
import Time_Snapshot from './../_models/Time_Snapshot.js';

/**
 * A class with several static mapping functions for parsing comments into {@link TimeConditional}s.
 * Registered and referenced by time/initialization, not in-file.
 */
// eslint-disable-next-line no-unused-vars
class TimeMapper
{
  constructor()
  {
    throw new Error("This is a static class.");
  }

  static minuteToConditional(comment, regex)
  {
    const [ , minutes ] = regex.exec(comment);
    const timeConditional = new TimeConditional();
    timeConditional.minutes = parseInt(minutes);
    return timeConditional;
  }

  static hourToConditional(comment, regex)
  {
    const [ , hours ] = regex.exec(comment);
    const timeConditional = new TimeConditional();
    timeConditional.hours = parseInt(hours);
    return timeConditional;
  }

  static dayToConditional(comment, regex)
  {
    const [ , days ] = regex.exec(comment);
    const timeConditional = new TimeConditional();
    timeConditional.days = parseInt(days);
    return timeConditional;
  }

  static monthToConditional(comment, regex)
  {
    const [ , months ] = regex.exec(comment);
    const timeConditional = new TimeConditional();
    timeConditional.months = parseInt(months);
    return timeConditional;
  }

  static yearToConditional(comment, regex)
  {
    const [ , years ] = regex.exec(comment);
    const timeConditional = new TimeConditional();
    timeConditional.years = parseInt(years);
    return timeConditional;
  }

  static timeOfDayToConditional(comment, regex)
  {
    const [ , timeOfDay ] = regex.exec(comment);
    const maybeStringTimeOfDay = parseInt(timeOfDay);
    const timeConditional = new TimeConditional();
    isNaN(maybeStringTimeOfDay) === false
      ? timeConditional.timeOfDay = maybeStringTimeOfDay
      : timeConditional.timeOfDay = Time_Snapshot.TimesOfDayId(timeOfDay);
    return timeConditional;
  }

  static seasonOfYearToConditional(comment, regex)
  {
    const [ , seasonOfYear ] = regex.exec(comment);
    const maybeStringSeasonOfYear = parseInt(seasonOfYear);
    const timeConditional = new TimeConditional();
    isNaN(maybeStringSeasonOfYear) === false
      ? timeConditional.seasonOfYear = maybeStringSeasonOfYear
      : timeConditional.seasonOfYear = Time_Snapshot.SeasonsId(seasonOfYear);
    return timeConditional;
  }

  static timeRangeToConditional(comment, regex)
  {
    const [ , startHour, startMinute, endHour, endMinute ] = regex.exec(comment);
    // NOTE: there should only be two digits per time range- hours and minutes- like a clock.
    const startTimeRange = [ parseInt(startHour), parseInt(startMinute) ];
    const endTimeRange = [ parseInt(endHour), parseInt(endMinute) ];
    const timeConditional = new TimeConditional();
    timeConditional.startRange = startTimeRange;
    timeConditional.endRange = endTimeRange;
    timeConditional.isTimeRange = true;
    return timeConditional;
  }

  static fullDateRangeToConditional(comment, regex)
  {
    const [ , startFullRangeRaw, endFullRangeRaw ] = regex.exec(comment);
    // seconds are not a part of the regex but still need to be entered.
    const startFullRange = [ 0, ...JSON.parse(startFullRangeRaw) ];
    const endFullRange = [ 59, ...JSON.parse(endFullRangeRaw) ];
    const timeConditional = new TimeConditional();
    timeConditional.startRange = startFullRange;
    timeConditional.endRange = endFullRange;
    timeConditional.isFullDateRange = true;
    return timeConditional;
  }

  static minuteRangeToConditional(comment, regex)
  {
    const currentTimeSnapshot = $gameTime.currentTime();
    const [ , startMinuteRange, endMinuteRange ] = regex.exec(comment);
    const minuteRangeHourStart = currentTimeSnapshot.hours;
    let minuteRangeHourEnd = startMinuteRange < endMinuteRange
      ? currentTimeSnapshot.hours
      : currentTimeSnapshot.hours + 1;
    // if we teetered over to the next day, then reset the hour to zero.
    if (minuteRangeHourEnd === 24)
    {
      minuteRangeHourEnd = 0;
    }
    const startMinuteRangeTimeRange = [ minuteRangeHourStart, parseInt(startMinuteRange) ];
    const endMinuteRangeTimeRange = [ minuteRangeHourEnd, parseInt(endMinuteRange) ];
    const timeConditional = new TimeConditional();
    timeConditional.startRange = startMinuteRangeTimeRange;
    timeConditional.endRange = endMinuteRangeTimeRange;
    timeConditional.isTimeRange = true;
    return timeConditional;
  }

  static hourRangeToConditional(comment, regex)
  {
    const [ , startHourRange, endHourRange ] = regex.exec(comment);
    const startHourRangeTimeRange = [ parseInt(startHourRange), 0 ];
    const endHourRangeTimeRange = [ parseInt(endHourRange), 0 ];
    // construct time conditional for the next step in this routine.
    const timeConditional = new TimeConditional();
    timeConditional.startRange = startHourRangeTimeRange;
    timeConditional.endRange = endHourRangeTimeRange;
    timeConditional.isTimeRange = true;
    return timeConditional;
  }

  static dayRangeToConditional(comment, regex)
  {
    const currentTimeSnapshot = $gameTime.currentTime();
    const [ , startDayRange, endDayRange ] = regex.exec(comment);
    const dayRangeStart = parseInt(startDayRange);
    const dayRangeEnd = parseInt(endDayRange);
    // seconds, minutes, and hours are all defaulted to zero for start.
    const fullDateRangeStart = [ 0, 0, 0, dayRangeStart, currentTimeSnapshot.months, currentTimeSnapshot.years ];
    let dayRangeMonthEnd = dayRangeEnd < dayRangeStart
      ? currentTimeSnapshot.months + 1
      : currentTimeSnapshot.months;
    let dayRangeYearEnd = currentTimeSnapshot.years;
    if (dayRangeMonthEnd === 13)
    {
      dayRangeMonthEnd = 1;
      dayRangeYearEnd += 1;
    }
    const fullDateRangeEnd = [ 59, 59, 23, dayRangeEnd, dayRangeMonthEnd, dayRangeYearEnd ];
    const timeConditional = new TimeConditional();
    timeConditional.startRange = fullDateRangeStart;
    timeConditional.endRange = fullDateRangeEnd;
    timeConditional.isFullDateRange = true;
    return timeConditional;
  }

  static monthRangeToConditional(comment, regex)
  {
    const currentTimeSnapshot = $gameTime.currentTime();
    const [ , startMonthRange, endMonthRange ] = regex.exec(comment);
    const monthRangeStart = parseInt(startMonthRange);
    const monthRangeEnd = parseInt(endMonthRange);
    const fullDateRangeStart = [ 0, 0, 0, 1, monthRangeStart, currentTimeSnapshot.years ];
    const monthRangeYearEnd = monthRangeEnd < monthRangeStart
      ? currentTimeSnapshot.years + 1
      : currentTimeSnapshot.years;
    const fullDateRangeEnd = [ 59, 59, 23, 30, monthRangeEnd, monthRangeYearEnd ];
    // construct time conditional for the next step in this routine.
    const timeConditional = new TimeConditional();
    timeConditional.startRange = fullDateRangeStart;
    timeConditional.endRange = fullDateRangeEnd;
    timeConditional.isFullDateRange = true;
    return timeConditional;
  }

  static yearRangeToConditional(comment, regex)
  {
    const [ , startYearRange, endYearRange ] = regex.exec(comment);
    const yearRangeStart = parseInt(startYearRange);
    const yearRangeEnd = parseInt(endYearRange);
    const fullDateRangeStart = [ 0, 0, 0, 1, 1, yearRangeStart ];
    const fullDateRangeEnd = [ 0, 0, 0, 1, 1, yearRangeEnd ];
    const timeConditional = new TimeConditional();
    timeConditional.startRange = fullDateRangeStart;
    timeConditional.endRange = fullDateRangeEnd;
    timeConditional.isFullDateRange = true;
    return timeConditional;
  }

  /**
   * The kinds of time conditional a comment can declare, in the order they are tested.
   *
   * Order is load-bearing rather than cosmetic. Several of these tags are prefixes of one another
   * once their captures are stripped, so the first entry whose pattern matches wins and a kind
   * moved up the list can shadow one below it.
   *
   * A kind names itself once and is tested against both regex families, because the whole-event
   * tags and the choice-branch tags parse identically and differ only in which comment carries
   * them. That is also the extension contract: **a kind's key must match entries named
   * `<Key>Page` and `<Key>Choice` in {@link J.TIME.RegExp}**, and a plugin adding a time
   * conditional of its own registers its regexes under that naming and pushes one entry here,
   * rather than this list growing a hardcoded pair per tag.
   * @type {{key: string, map: function(string, RegExp): TimeConditional}[]}
   */
  static ConditionalKinds = [
    { key: 'Minute', map: TimeMapper.minuteToConditional },
    { key: 'Hour', map: TimeMapper.hourToConditional },
    { key: 'Day', map: TimeMapper.dayToConditional },
    { key: 'Month', map: TimeMapper.monthToConditional },
    { key: 'Year', map: TimeMapper.yearToConditional },
    { key: 'TimeOfDay', map: TimeMapper.timeOfDayToConditional },
    { key: 'SeasonOfYear', map: TimeMapper.seasonOfYearToConditional },
    { key: 'TimeRange', map: TimeMapper.timeRangeToConditional },
    { key: 'FullDateRange', map: TimeMapper.fullDateRangeToConditional },
    { key: 'MinuteRange', map: TimeMapper.minuteRangeToConditional },
    { key: 'HourRange', map: TimeMapper.hourRangeToConditional },
    { key: 'DayRange', map: TimeMapper.dayRangeToConditional },
    { key: 'MonthRange', map: TimeMapper.monthRangeToConditional },
    { key: 'YearRange', map: TimeMapper.yearRangeToConditional },
  ];

  /**
   * The regex families a conditional kind is looked up under, in the order they are tested.
   *
   * Whole-event tags are tested ahead of choice-branch tags, matching the order these were
   * originally written in.
   * @type {string[]}
   */
  static ConditionalFamilies = [ 'Page', 'Choice' ];

  /**
   * Parses a comment into the {@link TimeConditional} it declares.
   *
   * The regex table is read here rather than captured when this class is defined, because the
   * table is populated during plugin bootstrap and a kind may be registered by an extension after
   * that. Reading it per call is also what lets a plugin add a conditional at any point without
   * this class knowing it happened.
   * @param {string} comment The comment to parse.
   * @returns {TimeConditional|null} The conditional declared, or null when the comment declares
   * none. Null is meaningful here: the caller distinguishes an unparsed tag from a parsed one and
   * reports it, which an empty conditional would hide.
   */
  static toConditional(comment)
  {
    // walk families before kinds, so every whole-event tag is tested ahead of every choice tag.
    for (const family of TimeMapper.ConditionalFamilies)
    {
      for (const kind of TimeMapper.ConditionalKinds)
      {
        const regex = J.TIME.RegExp[`${kind.key}${family}`];

        // the first pattern to match owns the comment; see ConditionalKinds on why order matters.
        if (regex.test(comment)) return kind.map(comment, regex);
      }
    }

    return null;
  }
}

export default TimeMapper;
//endregion TimeMapper