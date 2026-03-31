//region plugins/time/time-snapshot.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadTimePluginVm } from './time-vm.js';

describe('J-TIME Time_Snapshot (out/J-TIME.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadTimePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('static name and id helpers round-trip known values', () =>
  {
    const { Time_Snapshot } = sandbox;
    expect(Time_Snapshot.TimesOfDayName(2)).toBe('Morning');
    expect(Time_Snapshot.TimesOfDayId('TWILIGHT')).toBe(5);
    expect(Time_Snapshot.SeasonsName(0)).toBe('Spring');
    expect(Time_Snapshot.SeasonsId('Fall')).toBe(2);
  });

  it('equals, isAfter, and isBetweenSnapshots respect calendar ordering', () =>
  {
    const { Time_Snapshot } = sandbox;
    const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
    const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);
    expect(early.equals(late)).toBe(false);
    expect(late.isAfter(early)).toBe(true);
    expect(early.isBefore(late)).toBe(true);
    expect(late.isBetweenSnapshots(early, early, true, false)).toBe(false);
    expect(late.isBetweenSnapshots(early, late, false, true)).toBe(true);
  });
});
//endregion plugins/time/time-snapshot.test.js
