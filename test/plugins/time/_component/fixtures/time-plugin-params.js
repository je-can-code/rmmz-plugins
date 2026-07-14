//region plugins/time/_component/fixtures/time-plugin-params.js
/**
 * Stringly values as RMMZ passes to {@link PluginManager.parameters} for `J-TIME`.
 * Tuned for tests: artificial time, no tone or variable writes, 1 second per tick.
 */
export const DEFAULT_TIME_PLUGIN_PARAMS = {
  timeWindowX: '0',
  timeWindowY: '0',
  startVisible: 'true',
  startActivated: 'true',
  useRealTime: 'false',
  changeToneByTime: 'false',
  useVariableAssignment: 'false',
  secondsVariable: '121',
  minutesVariable: '122',
  hoursVariable: '123',
  daysVariable: '124',
  monthsVariable: '125',
  yearsVariable: '126',
  timeOfDayIdVariable: '127',
  timeOfDayNameVariable: '128',
  seasonOfYearIdVariable: '129',
  seasonOfYearNameVariable: '130',
  framesPerTick: '60',
  startingSecond: '0',
  startingMinute: '0',
  startingHour: '9',
  startingDay: '29',
  startingMonth: '5',
  startingYear: '2021',
  secondsPerIncrement: '1',
  minutesPerIncrement: '1',
  hoursPerIncrement: '1',
  daysPerIncrement: '1',
  monthsPerIncrement: '1',
  yearsPerIncrement: '1',
};
//endregion plugins/time/_component/fixtures/time-plugin-params.js
