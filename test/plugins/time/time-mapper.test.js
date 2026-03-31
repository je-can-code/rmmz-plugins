//region plugins/time/time-mapper.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadTimePluginVm, makeGameTime } from './time-vm.js';

describe('J-TIME TimeMapper (out/J-TIME.js)', () =>
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

  it('parses scalar time tags from comments', () =>
  {
    const { TimeMapper, J } = sandbox;
    const c = TimeMapper.minuteToConditional('<minuteChoice: 42>', J.TIME.RegExp.MinuteChoice);
    expect(c.minutes).toBe(42);

    expect(TimeMapper.hourToConditional('<hourChoice:7>', J.TIME.RegExp.HourChoice).hours).toBe(7);
  });

  it('timeOfDayToConditional accepts numeric or name', () =>
  {
    const { TimeMapper, J } = sandbox;
    const c = TimeMapper.timeOfDayToConditional(
      '<timeOfDayChoice:evening>',
      J.TIME.RegExp.TimeOfDayChoice);
    expect(c.timeOfDay).toBe(4);
  });

  it('timeRangeToConditional builds clock ranges', () =>
  {
    const { TimeMapper, J } = sandbox;
    const c = TimeMapper.timeRangeToConditional(
      '<timeRangeChoice:8:30-16:45>',
      J.TIME.RegExp.TimeRangeChoice);
    expect(c.isTimeRange).toBe(true);
    expect(c.startRange).toEqual([ 8, 30 ]);
    expect(c.endRange).toEqual([ 16, 45 ]);
  });

  it('fullDateRangeToConditional prepends seconds and parses json segments', () =>
  {
    const { TimeMapper, J } = sandbox;
    const raw = '<fullDateRangeChoice:[0,12,1,6,2024]-[30,18,15,6,2024]>';
    const c = TimeMapper.fullDateRangeToConditional(raw, J.TIME.RegExp.FullDateRangeChoice);
    expect(c.isFullDateRange).toBe(true);
    expect(c.startRange[0]).toBe(0);
    expect(c.startRange[3]).toBe(1);
    expect(c.endRange[0]).toBe(59);
    expect(c.endRange[3]).toBe(15);
  });

  it('minuteRangeToConditional uses current artificial snapshot hours', () =>
  {
    makeGameTime(sandbox);
    const { TimeMapper, J } = sandbox;
    sandbox.$gameTime.setTime(0, 15, 14, 1, 6, 2024);
    const c = TimeMapper.minuteRangeToConditional(
      '<minuteRangeChoice:10-50>',
      J.TIME.RegExp.MinuteRangeChoice);
    expect(c.startRange).toEqual([ 14, 10 ]);
    expect(c.endRange).toEqual([ 14, 50 ]);
  });
});
//endregion plugins/time/time-mapper.test.js
