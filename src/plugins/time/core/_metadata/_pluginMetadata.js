//region plugin metadata
class J_TIME_PluginMetadata extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Maps plugin parameters into instance fields used by {@link Game_Time}.
   */
  postInitialize()
  {
    super.postInitialize();

    // capture pp for downstream policy in this routine.
    const pp = this.parsedPluginParameters;

    // assign time window x on this instance for callers.
    this.TimeWindowX = Number(pp['timeWindowX']);
    this.TimeWindowY = Number(pp['timeWindowY']);

    // assign start visible on this instance for callers.
    this.StartVisible = pp['startVisible'] === 'true';
    this.StartActivated = pp['startActivated'] === 'true';
    this.UseRealTime = pp['useRealTime'] === 'true';
    // assign change tone by time on this instance for callers.
    this.ChangeToneByTime = pp['changeToneByTime'] === 'true';
    this.UseVariableAssignment = pp['useVariableAssignment'] === 'true';

    // assign seconds variable on this instance for callers.
    this.SecondsVariable = Number(pp['secondsVariable']);
    this.MinutesVariable = Number(pp['minutesVariable']);
    this.HoursVariable = Number(pp['hoursVariable']);
    this.DaysVariable = Number(pp['daysVariable']);
    this.MonthsVariable = Number(pp['monthsVariable']);
    this.YearsVariable = Number(pp['yearsVariable']);
    this.TimeOfDayIdVariable = Number(pp['timeOfDayIdVariable']);
    this.TimeOfDayNameVariable = Number(pp['timeOfDayNameVariable']);
    this.SeasonOfYearIdVariable = Number(pp['seasonOfYearIdVariable']);
    this.SeasonOfYearNameVariable = Number(pp['seasonOfYearNameVariable']);

    // assign frames per tick on this instance for callers.
    this.FramesPerTick = Number(pp['framesPerTick']);

    // assign starting second on this instance for callers.
    this.StartingSecond = Number(pp['startingSecond']);
    this.StartingMinute = Number(pp['startingMinute']);
    this.StartingHour = Number(pp['startingHour']);
    this.StartingDay = Number(pp['startingDay']);
    this.StartingMonth = Number(pp['startingMonth']);
    this.StartingYear = Number(pp['startingYear']);

    // assign seconds per increment on this instance for callers.
    this.SecondsPerIncrement = Number(pp['secondsPerIncrement']);
    this.MinutesPerIncrement = Number(pp['minutesPerIncrement']);
    this.HoursPerIncrement = Number(pp['hoursPerIncrement']);
    this.DaysPerIncrement = Number(pp['daysPerIncrement']);
    this.MonthsPerIncrement = Number(pp['monthsPerIncrement']);
    this.YearsPerIncrement = Number(pp['yearsPerIncrement']);
  }
}

export default J_TIME_PluginMetadata;
//endregion plugin metadata