//region Metadata
import J_TIME_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.TIME = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.TIME.Metadata = new J_TIME_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.TIME.Aliased = {
  DataManager: new Map(),

  Game_Event: new Map(),
  Game_Interpreter: new Map(),

  JABS_StandardController: new Map(),

  Scene_Base: new Map(),
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
// eslint-disable-next-line max-len
J.TIME.RegExp.FullDateRangePage = /<fullDateRangePage:[ ]?(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])-(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])>/i;

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
// eslint-disable-next-line max-len
J.TIME.RegExp.FullDateRangeChoice = /<fullDateRangeChoice:[ ]?(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])-(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])>/i;

/**
 * A global object for storing data related to TIME.
 * @global
 * @type {Game_Time}
 */
globalThis.$gameTime = null;
//endregion Introduction