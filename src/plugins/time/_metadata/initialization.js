/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.TIME = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.TIME.Metadata = {};
J.TIME.Metadata.Version = '1.0.0';
J.TIME.Metadata.Name = `J-TIME`;

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.TIME.PluginParameters = PluginManager.parameters(J.TIME.Metadata.Name);
J.TIME.Metadata.TimeWindowX = Number(J.TIME.PluginParameters['timeWindowX']);
J.TIME.Metadata.TimeWindowY = Number(J.TIME.PluginParameters['timeWindowY']);

J.TIME.Metadata.StartVisible = J.TIME.PluginParameters['startVisible'] === "true";
J.TIME.Metadata.StartActivated = J.TIME.PluginParameters['startActivated'] === "true";
J.TIME.Metadata.UseRealTime = J.TIME.PluginParameters['useRealTime'] === "true";
J.TIME.Metadata.ChangeToneByTime = J.TIME.PluginParameters['changeToneByTime'] === "true";
J.TIME.Metadata.UseVariableAssignment = J.TIME.PluginParameters['useVariableAssignment'] === "true";

J.TIME.Metadata.SecondsVariable = Number(J.TIME.PluginParameters['secondsVariable']);
J.TIME.Metadata.MinutesVariable = Number(J.TIME.PluginParameters['minutesVariable']);
J.TIME.Metadata.HoursVariable = Number(J.TIME.PluginParameters['hoursVariable']);
J.TIME.Metadata.DaysVariable = Number(J.TIME.PluginParameters['daysVariable']);
J.TIME.Metadata.MonthsVariable = Number(J.TIME.PluginParameters['monthsVariable']);
J.TIME.Metadata.YearsVariable = Number(J.TIME.PluginParameters['yearsVariable']);
J.TIME.Metadata.TimeOfDayIdVariable = Number(J.TIME.PluginParameters['timeOfDayIdVariable']);
J.TIME.Metadata.TimeOfDayNameVariable = Number(J.TIME.PluginParameters['timeOfDayNameVariable']);
J.TIME.Metadata.SeasonOfYearIdVariable = Number(J.TIME.PluginParameters['seasonOfYearIdVariable']);
J.TIME.Metadata.SeasonOfYearNameVariable = Number(J.TIME.PluginParameters['seasonOfYearNameVariable']);

J.TIME.Metadata.FramesPerTick = Number(J.TIME.PluginParameters['framesPerTick']);

J.TIME.Metadata.StartingSecond = Number(J.TIME.PluginParameters['startingSecond']);
J.TIME.Metadata.StartingMinute = Number(J.TIME.PluginParameters['startingMinute']);
J.TIME.Metadata.StartingHour = Number(J.TIME.PluginParameters['startingHour']);
J.TIME.Metadata.StartingDay = Number(J.TIME.PluginParameters['startingDay']);
J.TIME.Metadata.StartingMonth = Number(J.TIME.PluginParameters['startingMonth']);
J.TIME.Metadata.StartingYear = Number(J.TIME.PluginParameters['startingYear']);

J.TIME.Metadata.SecondsPerIncrement = Number(J.TIME.PluginParameters['secondsPerIncrement']);
J.TIME.Metadata.MinutesPerIncrement = Number(J.TIME.PluginParameters['minutesPerIncrement']);
J.TIME.Metadata.HoursPerIncrement = Number(J.TIME.PluginParameters['hoursPerIncrement']);
J.TIME.Metadata.DaysPerIncrement = Number(J.TIME.PluginParameters['daysPerIncrement']);
J.TIME.Metadata.MonthsPerIncrement = Number(J.TIME.PluginParameters['monthsPerIncrement']);
J.TIME.Metadata.YearsPerIncrement = Number(J.TIME.PluginParameters['yearsPerIncrement']);

/**
 * A collection of all aliased methods for this plugin.
 */
J.TIME.Aliased = {
  DataManager: {},

  Game_Event: new Map(),
  Game_Interpreter: new Map(),

  JABS_InputController: new Map(),

  Scene_Base: {},
  Scene_Map: new Map(),

  Window_Base: new Map(),
};

/**
 * A collection of all regular expressions for this plugin.
 */
J.TIME.RegExp = {};
J.TIME.RegExp.MinutePage = /<minutePage:[ ]?(\d+),? ?( )?>/i;
J.TIME.RegExp.HourPage = /<hourPage:[ ]?(\d+)>/i;
J.TIME.RegExp.DayPage = /<dayPage:[ ]?(\d+)>/i;
J.TIME.RegExp.MonthPage = /<monthPage:[ ]?(\d+)>/i;
J.TIME.RegExp.YearPage = /<yearPage:[ ]?(\d+)>/i;
J.TIME.RegExp.TimeOfDayPage = /<timeOfDayPage:[ ]?([0-5]|night|dawn|morning|afternoon|evening|twilight)>/i;
J.TIME.RegExp.SeasonOfYearPage = /<seasonOfYearPage:[ ]?([0-3]|spring|summer|autumn|winter)>/i;

J.TIME.RegExp.MinuteRangePage = /<minuteRangePage:[ ]?(\d+)-(\d+)>/i;
J.TIME.RegExp.HourRangePage = /<hourRangePage:[ ]?(\d+)-(\d+)>/i;
J.TIME.RegExp.DayRangePage = /<dayRangePage:[ ]?(\d+)-(\d+)>/i;
J.TIME.RegExp.MonthRangePage = /<monthRangePage:[ ]?(\d+)-(\d+)>/i;
J.TIME.RegExp.YearRangePage = /<yearRangePage:[ ]?(\d+)-(\d+)>/i;

J.TIME.RegExp.TimeRangePage = /<timeRangePage:[ ]?(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})>/i;
J.TIME.RegExp.FullDateRangePage = /<fullDateRangePage:[ ]?(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])-(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])>/i


J.TIME.RegExp.MinuteChoice = /<minuteChoice:[ ]?(\d+)>/i;
J.TIME.RegExp.HourChoice = /<hourChoice:[ ]?(\d+)>/i;
J.TIME.RegExp.DayChoice = /<dayChoice:[ ]?(\d+)>/i;
J.TIME.RegExp.MonthChoice = /<monthChoice:[ ]?(\d+)>/i;
J.TIME.RegExp.YearChoice = /<yearChoice:[ ]?(\d+)>/i;
J.TIME.RegExp.TimeOfDayChoice = /<timeOfDayChoice:[ ]?([0-5]|night|dawn|morning|afternoon|evening|twilight)>/i;
J.TIME.RegExp.SeasonOfYearChoice = /<seasonOfYearChoice:[ ]?([0-3]|spring|summer|autumn|winter)>/i;

J.TIME.RegExp.MinuteRangeChoice = /<minuteRangeChoice:[ ]?(\d+)-(\d+)>/i;
J.TIME.RegExp.HourRangeChoice = /<hourRangeChoice:[ ]?(\d+)-(\d+)>/i;
J.TIME.RegExp.DayRangeChoice = /<dayRangeChoice:[ ]?(\d+)-(\d+)>/i;
J.TIME.RegExp.MonthRangeChoice = /<monthRangeChoice:[ ]?(\d+)-(\d+)>/i;
J.TIME.RegExp.YearRangeChoice = /<yearRangeChoice:[ ]?(\d+)-(\d+)>/i;

J.TIME.RegExp.TimeRangeChoice = /<timeRangeChoice:[ ]?(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})>/i;
J.TIME.RegExp.FullDateRangeChoice = /<fullDateRangeChoice:[ ]?(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])-(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])>/i

/**
 * A global object for storing data related to TIME.
 * @global
 * @type {Game_Time}
 */
var $gameTime = null;
//endregion Introduction