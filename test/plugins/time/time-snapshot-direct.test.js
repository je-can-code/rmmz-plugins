//region plugins/time/time-snapshot-direct.test.js
import { describe, expect, it } from 'vitest';

import Time_Snapshot from '../../../src/plugins/time/core/_models/Time_Snapshot.js';

describe('Time_Snapshot (direct import)', () =>
{
  it('static name and id helpers round-trip known values', () =>
  {
    expect(Time_Snapshot.TimesOfDayName(2)).toBe('Morning');
    expect(Time_Snapshot.TimesOfDayId('TWILIGHT')).toBe(5);
    expect(Time_Snapshot.SeasonsName(0)).toBe('Spring');
    expect(Time_Snapshot.SeasonsId('Fall')).toBe(2);
  });

  it('static name and id helpers report and fall back on invalid ids/names', () =>
  {
    expect(Time_Snapshot.TimesOfDayName(99)).toBeNull();
    expect(Time_Snapshot.TimesOfDayId('nonsense')).toBe(-1);
    expect(Time_Snapshot.SeasonsName(99)).toBeNull();
    expect(Time_Snapshot.SeasonsId('nonsense')).toBe(-1);
  });

  it('static icon helpers return the expected indices', () =>
  {
    expect(Time_Snapshot.SeasonsIconIndex(1)).toBe(888);
    expect(Time_Snapshot.TimesOfDayIcon(4)).toBe(2257);
  });

  it('exposes season/time-of-day name and icon getters derived from its own ids', () =>
  {
    const snapshot = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
    expect(snapshot.timeOfDayName).toBe('Morning');
    expect(snapshot.timeOfDayIcon).toBe(2261);
    expect(snapshot.seasonOfTheYearName).toBe('Winter');
    expect(snapshot.seasonOfTheYearIcon).toBe(890);
  });

  it('equals, isAfter, and isBefore compare calendar ordering', () =>
  {
    const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
    const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);
    expect(early.equals(late)).toBe(false);
    expect(early.equals(early)).toBe(true);
    expect(late.isAfter(early)).toBe(true);
    expect(early.isAfter(late)).toBe(false);
    expect(early.isBefore(late)).toBe(true);
    expect(late.isBefore(early)).toBe(false);
  });

  it('isBetweenSnapshots respects inclusive/exclusive boundaries', () =>
  {
    const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
    const middle = new Time_Snapshot(0, 30, 9, 1, 1, 2020, 2, 3);
    const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);

    // middle is strictly between early and late.
    expect(middle.isBetweenSnapshots(early, late)).toBe(true);

    // the boundary itself is excluded by default.
    expect(late.isBetweenSnapshots(early, early, true, false)).toBe(false);

    // an inclusive end boundary includes an exact match on the end.
    expect(late.isBetweenSnapshots(early, late, false, true)).toBe(true);

    // an exclusive end boundary excludes an exact match on the end.
    expect(late.isBetweenSnapshots(early, late, false, false)).toBe(false);
  });
});
//endregion plugins/time/time-snapshot-direct.test.js
