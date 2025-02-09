//region Game_Event
/**
 * Extends {@link meetsConditions}.<br/>
 * Also includes the custom conditions that relate to time.
 * @param {any} page
 * @returns {boolean}
 */
J.TIME.Aliased.Game_Event.set('meetsConditions', Game_Event.prototype.meetsConditions);
Game_Event.prototype.meetsConditions = function(page)
{
  // check original conditions.
  const metOtherPageConditions = J.TIME.Aliased.Game_Event.get('meetsConditions')
    .call(this, page);

  // if other conditions aren't met, then TIME conditions don't override that.
  if (!metOtherPageConditions) return false;

  // grab the list of valid comments.
  const commentCommandList = Game_Event.getValidCommentCommandsFromPage(page);

  // there aren't any comments on this event at all.
  if (commentCommandList.length === 0) return true;

  // gather all conditional comments from the comment commands of this event.
  const timeConditionals = Game_Event.toTimeConditionals(commentCommandList);

  // if there are none, then this event is fine to proceed!
  if (timeConditionals.length === 0) return true;

  // determine if all the TIME conditionals are satisfied.
  return timeConditionals.every(Game_Event.timeConditionalMet, this);
};

/**
 * Filters the comment commands to only TIME conditionals- should any exist in the collection.
 * @param {rm.types.EventCommand[]} commentCommandList The comment commands to potentially convert to conditionals.
 * @returns {TimeConditional[]}
 */
Game_Event.toTimeConditionals = function(commentCommandList)
{
  // gather all TIME comments from the comment commands of this event.
  const timeCommentComands = commentCommandList
    .filter(Game_Event.filterCommentCommandsByEventTimeConditional, this);

  // if there are no TIME conditionals available for parsing, don't bother.
  if (timeCommentComands.length === 0) return [];

  // map all the TIME conditionals from the parsed regex.
  return timeCommentComands.map(Game_Event.toTimeConditional, this);
};

/**
 * A filter function for only including comment event commands relevant to TIME.
 * @param {rm.types.EventCommand} command The command being evaluated.
 * @returns {boolean}
 */
Game_Event.filterCommentCommandsByEventTimeConditional = function(command)
{
  // identify the actual comment being evaluated.
  const [ comment, ] = command.parameters;

  // in case the command isn't even valid for comment-validation.
  if (!comment) return false;

  // extract the types of regex we will be considering.
  const {
    MinutePage,
    HourPage,
    DayPage,
    MonthPage,
    YearPage,
    TimeOfDayPage,
    SeasonOfYearPage,
    TimeRangePage,
    MinuteRangePage,
    HourRangePage,
    DayRangePage,
    MonthRangePage,
    YearRangePage,
    FullDateRangePage,
  } = J.TIME.RegExp;
  return [
    MinutePage,
    HourPage,
    DayPage,
    MonthPage,
    YearPage,
    TimeOfDayPage,
    SeasonOfYearPage,
    TimeRangePage,
    MinuteRangePage,
    HourRangePage,
    DayRangePage,
    MonthRangePage,
    YearRangePage,
    FullDateRangePage, ].some(regex => regex.test(comment));
};

/**
 * A filter function for only including comment event commands relevant to TIME.
 * @param {rm.types.EventCommand} command The command being evaluated.
 * @returns {boolean}
 */
Game_Event.filterCommentCommandsByChoiceTimeConditional = function(command)
{
  // identify the actual comment being evaluated.
  const [ comment, ] = command.parameters;

  // in case the command isn't even valid for comment-validation.
  if (!comment) return false;

  // extract the types of regex we will be considering.
  const {
    MinuteChoice,
    HourChoice,
    DayChoice,
    MonthChoice,
    YearChoice,
    TimeOfDayChoice,
    SeasonOfYearChoice,
    TimeRangeChoice,
    MinuteRangeChoice,
    HourRangeChoice,
    DayRangeChoice,
    MonthRangeChoice,
    YearRangeChoice,
    FullDateRangeChoice,
  } = J.TIME.RegExp;
  return [
    MinuteChoice,
    HourChoice,
    DayChoice,
    MonthChoice,
    YearChoice,
    TimeOfDayChoice,
    SeasonOfYearChoice,
    TimeRangeChoice,
    MinuteRangeChoice,
    HourRangeChoice,
    DayRangeChoice,
    MonthRangeChoice,
    YearRangeChoice,
    FullDateRangeChoice, ].some(regex => regex.test(comment));
};

/**
 * Converts a known comment event command into a conditional for TIME control.
 * @param {rm.types.EventCommand} commentCommand The comment command to parse into a conditional.
 * @returns {TimeConditional}
 */
Game_Event.toTimeConditional = function(commentCommand)
{
  // shorthand the comment into a variable.
  const [ comment, ] = commentCommand.parameters;

  // use a switch block to identify which RegExp should be used to populate the conditional.
  switch (true)
  {
    //region events
    // FOR WHOLE EVENTS:
    case J.TIME.RegExp.MinutePage.test(comment):
      return TimeMapper.minuteToConditional(comment, J.TIME.RegExp.MinutePage);
    case J.TIME.RegExp.HourPage.test(comment):
      return TimeMapper.hourToConditional(comment, J.TIME.RegExp.HourPage);
    case J.TIME.RegExp.DayPage.test(comment):
      return TimeMapper.dayToConditional(comment, J.TIME.RegExp.DayPage);
    case J.TIME.RegExp.MonthPage.test(comment):
      return TimeMapper.monthToConditional(comment, J.TIME.RegExp.MonthPage);
    case J.TIME.RegExp.YearPage.test(comment):
      return TimeMapper.yearToConditional(comment, J.TIME.RegExp.YearPage);
    case J.TIME.RegExp.TimeOfDayPage.test(comment):
      return TimeMapper.timeOfDayToConditional(comment, J.TIME.RegExp.TimeOfDayPage);
    case J.TIME.RegExp.SeasonOfYearPage.test(comment):
      return TimeMapper.seasonOfYearToConditional(comment, J.TIME.RegExp.SeasonOfYearPage);
    case J.TIME.RegExp.TimeRangePage.test(comment):
      return TimeMapper.timeRangeToConditional(comment, J.TIME.RegExp.TimeRangePage);
    case J.TIME.RegExp.FullDateRangePage.test(comment):
      return TimeMapper.fullDateRangeToConditional(comment, J.TIME.RegExp.FullDateRangePage);
    case J.TIME.RegExp.MinuteRangePage.test(comment):
      return TimeMapper.minuteRangeToConditional(comment, J.TIME.RegExp.MinuteRangePage);
    case J.TIME.RegExp.HourRangePage.test(comment):
      return TimeMapper.hourRangeToConditional(comment, J.TIME.RegExp.HourRangePage);
    case J.TIME.RegExp.DayRangePage.test(comment):
      return TimeMapper.dayRangeToConditional(comment, J.TIME.RegExp.DayRangePage);
    case J.TIME.RegExp.MonthRangePage.test(comment):
      return TimeMapper.monthRangeToConditional(comment, J.TIME.RegExp.MonthRangePage);
    case J.TIME.RegExp.YearRangePage.test(comment):
      return TimeMapper.yearRangeToConditional(comment, J.TIME.RegExp.YearRangePage);
    //endregion events

    //region choices
    // JUST FOR CHOICES:
    case J.TIME.RegExp.MinuteChoice.test(comment):
      return TimeMapper.minuteToConditional(comment, J.TIME.RegExp.MinuteChoice);
    case J.TIME.RegExp.HourChoice.test(comment):
      return TimeMapper.hourToConditional(comment, J.TIME.RegExp.HourChoice);
    case J.TIME.RegExp.DayChoice.test(comment):
      return TimeMapper.dayToConditional(comment, J.TIME.RegExp.DayChoice);
    case J.TIME.RegExp.MonthChoice.test(comment):
      return TimeMapper.monthToConditional(comment, J.TIME.RegExp.MonthChoice);
    case J.TIME.RegExp.YearChoice.test(comment):
      return TimeMapper.yearToConditional(comment, J.TIME.RegExp.YearChoice);
    case J.TIME.RegExp.TimeOfDayChoice.test(comment):
      return TimeMapper.timeOfDayToConditional(comment, J.TIME.RegExp.TimeOfDayChoice);
    case J.TIME.RegExp.SeasonOfYearChoice.test(comment):
      return TimeMapper.seasonOfYearToConditional(comment, J.TIME.RegExp.SeasonOfYearChoice);
    case J.TIME.RegExp.TimeRangeChoice.test(comment):
      return TimeMapper.timeRangeToConditional(comment, J.TIME.RegExp.TimeRangeChoice);
    case J.TIME.RegExp.FullDateRangeChoice.test(comment):
      return TimeMapper.fullDateRangeToConditional(comment, J.TIME.RegExp.FullDateRangeChoice);
    case J.TIME.RegExp.MinuteRangeChoice.test(comment):
      return TimeMapper.minuteRangeToConditional(comment, J.TIME.RegExp.MinuteRangeChoice);
    case J.TIME.RegExp.HourRangeChoice.test(comment):
      return TimeMapper.hourRangeToConditional(comment, J.TIME.RegExp.HourRangeChoice);
    case J.TIME.RegExp.DayRangeChoice.test(comment):
      return TimeMapper.dayRangeToConditional(comment, J.TIME.RegExp.DayRangeChoice);
    case J.TIME.RegExp.MonthRangeChoice.test(comment):
      return TimeMapper.monthRangeToConditional(comment, J.TIME.RegExp.MonthRangeChoice);
    case J.TIME.RegExp.YearRangeChoice.test(comment):
      return TimeMapper.yearRangeToConditional(comment, J.TIME.RegExp.YearRangeChoice);
    //endregion choices

    default:
      console.warn(`time conditional was not generated for an identified TIME tag; ${comment}`);
      return new TimeConditional();
  }
};

/**
 * Evaluates a {@link TimeConditional} to see if its requirements are currently met.
 * @param {TimeConditional} timeConditional The TIME conditional to evaluate satisfaction of.
 * @returns {boolean}
 */
Game_Event.timeConditionalMet = function(timeConditional)
{
  // if this is a full date range, then use the full date range checking functionality.
  if (timeConditional.isFullDateRange) return Game_Event._timeConditionalFullDateRangeMet(timeConditional);

  // if this is a time range, then use the time range checking functionality.
  if (timeConditional.isTimeRange) return Game_Event._timeConditionalTimeRangeMet(timeConditional);

  // otherwise, use the direct checking.
  return Game_Event._timeConditionalDirectMet(timeConditional);
};

/**
 * Determines if the conditional comparison was equal.
 * @param {TimeConditional} timeConditional
 * @returns {boolean}
 * @private
 */
Game_Event._timeConditionalDirectMet = function(timeConditional)
{
  // grab the current time snapshot.
  const currentTime = $gameTime.currentTime();

  // extract the various data points from the conditional.
  const {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    timeOfDay,
    seasonOfYear,
  } = timeConditional;

  // validate if the data points are something other than -1, that they match.
  if (years !== -1 && years !== currentTime.years) return false;
  if (months !== -1 && months !== currentTime.months) return false;
  if (days !== -1 && days !== currentTime.days) return false;
  if (hours !== -1 && hours !== currentTime.hours) return false;
  if (minutes !== -1 && minutes !== currentTime.minutes) return false;
  if (seconds !== -1 && seconds !== currentTime.seconds) return false;
  if (timeOfDay !== -1 && timeOfDay !== currentTime._timeOfDayId) return false;
  if (seasonOfYear !== -1 && seasonOfYear !== currentTime._seasonOfYearId) return false;

  // everything that isn't -1 must match, so conditional met!
  return true;
};

/**
 * Determines if the current time was within the conditional time range.
 * @param {TimeConditional} timeConditional
 * @returns {boolean}
 * @private
 */
Game_Event._timeConditionalTimeRangeMet = function(timeConditional)
{
  // grab the current time snapshot.
  const {
    years,
    months,
    days
  } = $gameTime.currentTime();

  // extract the start and end ranges for time comparison.
  const {
    startRange,
    endRange
  } = timeConditional;

  // identify the hour markers.
  const startHour = startRange.at(0);
  const endHour = endRange.at(0);

  // if the end hour is less than the starting hour, then its intended to be overnight.
  const isOvernight = startHour > endHour;

  // identify the minute markers.
  const startMinute = startRange.at(1);
  const endMinute = endRange.at(1);

  // if the end minute is less than the starting minute, then its intended to be the next hour.
  const isOverhour = startMinute > endMinute;

  // build a starting date based on the "start" time.
  const fakeStartTimeArray = [ years, months - 1, days, startHour, startMinute, 0 ];
  const fakeStartDate = new Date(...fakeStartTimeArray);

  // build an ending date based on "end" time.
  const fakeEndTimeArray = [ years, months - 1, days, endHour, endMinute, 0 ];
  const fakeEndDate = new Date(...fakeEndTimeArray);

  // if the time difference translates to overnight, then add a day.
  if (isOvernight)
  {
    fakeEndDate.addDays(1);
  }

  // if the time difference translates to the next hour, then add an hour.
  if (isOverhour)
  {
    fakeEndDate.addHours(1);
  }

  // if we are not within the range of the projected start and end dates, then we did not meet the conditional.
  if (!$gameTime.currentTime()
    .isBetweenDates(fakeStartDate, fakeEndDate))
  {
    return false;
  }

  // we are within range!
  return true;
};

/**
 * Determines if the current full date time was within the conditional full date time range.
 * @param {TimeConditional} timeConditional
 * @returns {boolean}
 * @private
 */
Game_Event._timeConditionalFullDateRangeMet = function(timeConditional)
{
  // grab the current time snapshot.
  const currentSnapshot = $gameTime.currentTime();

  // build snapshots based on the start and end range.
  const startSnapshot = $gameTime.toTimeSnapshot(timeConditional.startRange);
  const endSnapshot = $gameTime.toTimeSnapshot(timeConditional.endRange);

  return currentSnapshot.isBetweenSnapshots(startSnapshot, endSnapshot);
};
//endregion Game_Event