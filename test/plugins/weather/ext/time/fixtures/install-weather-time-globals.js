//region plugins/weather/ext/time/fixtures/install-weather-time-globals.js
import { vi } from 'vitest';
import TimePhases from '../../../../../../src/plugins/time/core/managers/TimePhases.js';

/**
 * Everything J-Weather-Time's own source expects a loaded game to already hold.
 *
 * Kept deliberately thin. This extension's whole job is holding four real things together - the
 * forecast, the walk, the state table and the clock - so those go in unmocked and only the two
 * genuine boundaries are stood in for: the parent plugin's director, which lives in another ship,
 * and `Game_System`, which is an engine class.
 *
 * `TimePhases` is the real one rather than a stub, because it is pure and because the `-1` it
 * reports for an hour off the clock face is a case this plugin has to survive. A stub that always
 * returned a real phase would quietly remove the only test that proves it does.
 */

/**
 * Installs the globals, and hands back the pieces a test needs to steer or inspect.
 * @param {object} sky The sky configuration this run should behave by.
 * @param {Object} [sandbox] Defaults to `globalThis`.
 * @returns {{setSky: Function, clockOf: Function}}
 */
export function installWeatherTimeGlobals(sky, sandbox = globalThis)
{
  // RMMZ's core installs this, and the sources under test use it as their empty-string sentinel.
  String.empty = '';

  sandbox.TimePhases = TimePhases;

  // the day-of-week vocabulary belongs to J-TIME, which is a hoisted global once it has loaded.
  sandbox.Time_Snapshot = {
    DaysOfWeekName: dayOfWeekId => [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
    ][ dayOfWeekId ],
  };

  sandbox.J ||= {};
  sandbox.J.WEATHER ||= {};
  sandbox.J.WEATHER.EXT ||= {};
  sandbox.J.WEATHER.EXT.TIME = {
    Metadata: { sky },
    Aliased: {
      Game_System: new Map(),
      Game_Time: new Map(),
      Scene_Map: new Map(),
    },
    RegExp: {},
  };

  const setSky = vi.fn();
  sandbox.WeatherDirector = { setSky };

  // a party of two, matching Chef Adventure's own actor ids, because who is present decides who
  // is allowed to remark on the weather.
  sandbox.$gameParty = {
    members: () => [ { actorId: () => 1 }, { actorId: () => 2 } ],
  };

  // the engine class this plugin hangs its save slice on. The constructor reaches `initMembers`
  // exactly as the real one does, which is what the slice's alias depends on.
  sandbox.Game_System = class
  {
    constructor()
    {
      this.initMembers();
    }

    initMembers()
    {
    }
  };

  return {
    setSky,
    clockOf,
  };
}

/**
 * A stand-in clock reporting a fixed date.
 *
 * Only the six readers this plugin actually calls, so a seventh appearing in source shows up as a
 * failure here rather than as a silent `undefined` travelling into the arithmetic.
 * @param {number} years The year.
 * @param {number} months The month, 1 through 12.
 * @param {number} days The day of the month, 1 through 30.
 * @param {number} hours The hour, 0 through 23 - or something else, deliberately.
 * @returns {object}
 */
export function clockOf(years, months, days, hours, minutes = 0)
{
  return {
    years: () => years,
    months: () => months,
    days: () => days,
    hours: () => hours,
    minutes: () => minutes,
  };
}
//endregion plugins/weather/ext/time/fixtures/install-weather-time-globals.js