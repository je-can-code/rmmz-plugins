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

    const pp = this.parsedPluginParameters;

    this.TimeWindowX = Number(pp['timeWindowX']);
    this.TimeWindowY = Number(pp['timeWindowY']);

    this.StartVisible = pp['startVisible'] === 'true';
    this.StartActivated = pp['startActivated'] === 'true';
    this.UseRealTime = pp['useRealTime'] === 'true';
    this.ChangeToneByTime = pp['changeToneByTime'] === 'true';
    this.UseVariableAssignment = pp['useVariableAssignment'] === 'true';

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

    this.FramesPerTick = Number(pp['framesPerTick']);

    this.StartingSecond = Number(pp['startingSecond']);
    this.StartingMinute = Number(pp['startingMinute']);
    this.StartingHour = Number(pp['startingHour']);
    this.StartingDay = Number(pp['startingDay']);
    this.StartingMonth = Number(pp['startingMonth']);
    this.StartingYear = Number(pp['startingYear']);

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