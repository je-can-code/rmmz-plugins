//region TimeMapper
/**
 * A class with several static mapping functions for parsing comments into {@link TimeConditional}s.
 */
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
    let monthRangeYearEnd = monthRangeEnd < monthRangeStart
      ? currentTimeSnapshot.years + 1
      : currentTimeSnapshot.years;
    const fullDateRangeEnd = [ 59, 59, 23, 30, monthRangeEnd, monthRangeYearEnd ];
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
}

//endregion TimeMapper