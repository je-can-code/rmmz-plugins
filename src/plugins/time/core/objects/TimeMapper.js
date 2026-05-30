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
    // hand back time conditional to the caller.
    return timeConditional;
  }

  static hourToConditional(comment, regex)
  {
    const [ , hours ] = regex.exec(comment);
    const timeConditional = new TimeConditional();
    timeConditional.hours = parseInt(hours);
    // hand back time conditional to the caller.
    return timeConditional;
  }

  static dayToConditional(comment, regex)
  {
    const [ , days ] = regex.exec(comment);
    const timeConditional = new TimeConditional();
    timeConditional.days = parseInt(days);
    // hand back time conditional to the caller.
    return timeConditional;
  }

  static monthToConditional(comment, regex)
  {
    const [ , months ] = regex.exec(comment);
    const timeConditional = new TimeConditional();
    timeConditional.months = parseInt(months);
    // hand back time conditional to the caller.
    return timeConditional;
  }

  static yearToConditional(comment, regex)
  {
    const [ , years ] = regex.exec(comment);
    const timeConditional = new TimeConditional();
    timeConditional.years = parseInt(years);
    // hand back time conditional to the caller.
    return timeConditional;
  }

  static timeOfDayToConditional(comment, regex)
  {
    const [ , timeOfDay ] = regex.exec(comment);
    const maybeStringTimeOfDay = parseInt(timeOfDay);
    const timeConditional = new TimeConditional();
    // policy step inside time of day to conditional.
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
    // policy step inside season of year to conditional.
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
    // policy step inside time range to conditional.
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
    // policy step inside full date range to conditional.
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
    // capture minute range hour end for downstream policy in this routine.
    let minuteRangeHourEnd = startMinuteRange < endMinuteRange
      ? currentTimeSnapshot.hours
      : currentTimeSnapshot.hours + 1;
    // if we teetered over to the next day, then reset the hour to zero.
    if (minuteRangeHourEnd === 24)
    {
      minuteRangeHourEnd = 0;
    }
    const startMinuteRangeTimeRange = [ minuteRangeHourStart, parseInt(startMinuteRange) ];
    // capture end minute range time range for downstream policy in this routine.
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
    // policy step inside hour range to conditional.
    timeConditional.isTimeRange = true;
    return timeConditional;
  }

  static dayRangeToConditional(comment, regex)
  {
    const currentTimeSnapshot = $gameTime.currentTime();
    const [ , startDayRange, endDayRange ] = regex.exec(comment);
    const dayRangeStart = parseInt(startDayRange);
    // capture day range end for downstream policy in this routine.
    const dayRangeEnd = parseInt(endDayRange);
    // seconds, minutes, and hours are all defaulted to zero for start.
    const fullDateRangeStart = [ 0, 0, 0, dayRangeStart, currentTimeSnapshot.months, currentTimeSnapshot.years ];
    let dayRangeMonthEnd = dayRangeEnd < dayRangeStart
      ? currentTimeSnapshot.months + 1
      // policy step inside day range to conditional.
      : currentTimeSnapshot.months;
    let dayRangeYearEnd = currentTimeSnapshot.years;
    if (dayRangeMonthEnd === 13)
    {
      // policy step inside day range to conditional.
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
    // capture month range end for downstream policy in this routine.
    const monthRangeEnd = parseInt(endMonthRange);
    const fullDateRangeStart = [ 0, 0, 0, 1, monthRangeStart, currentTimeSnapshot.years ];
    const monthRangeYearEnd = monthRangeEnd < monthRangeStart
      // policy step inside month range to conditional.
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
    // capture full date range start for downstream policy in this routine.
    const fullDateRangeStart = [ 0, 0, 0, 1, 1, yearRangeStart ];
    const fullDateRangeEnd = [ 0, 0, 0, 1, 1, yearRangeEnd ];
    const timeConditional = new TimeConditional();
    // policy step inside year range to conditional.
    timeConditional.startRange = fullDateRangeStart;
    timeConditional.endRange = fullDateRangeEnd;
    timeConditional.isFullDateRange = true;
    return timeConditional;
  }
}

export default TimeMapper;
//endregion TimeMapper