//region plugins/time/time-conditional-direct.test.js
import { describe, expect, it } from 'vitest';

import TimeConditional from '../../../src/plugins/time/core/_models/TimeConditional.js';

describe('TimeConditional (direct import)', () =>
{
  it('defaults to an unset, non-matching conditional', () =>
  {
    const conditional = new TimeConditional();

    expect(conditional.isTimeRange).toBe(false);
    expect(conditional.isFullDateRange).toBe(false);
    expect(conditional.seconds).toBe(-1);
    expect(conditional.minutes).toBe(-1);
    expect(conditional.hours).toBe(-1);
    expect(conditional.days).toBe(-1);
    expect(conditional.months).toBe(-1);
    expect(conditional.years).toBe(-1);
    expect(conditional.timeOfDay).toBe(-1);
    expect(conditional.seasonOfYear).toBe(-1);
    expect(conditional.startRange).toEqual([]);
    expect(conditional.endRange).toEqual([]);
  });

  it('allows overwriting range fields for a time-range conditional', () =>
  {
    const conditional = new TimeConditional();
    conditional.isTimeRange = true;
    conditional.startRange = [ 8, 0 ];
    conditional.endRange = [ 9, 0 ];

    expect(conditional.isTimeRange).toBe(true);
    expect(conditional.startRange).toEqual([ 8, 0 ]);
    expect(conditional.endRange).toEqual([ 9, 0 ]);
  });
});
//endregion plugins/time/time-conditional-direct.test.js
