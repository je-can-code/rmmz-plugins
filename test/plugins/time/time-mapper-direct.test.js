//region plugins/time/time-mapper-direct.test.js
import { describe, expect, it } from 'vitest';

import TimeMapper from '../../../src/plugins/time/core/objects/TimeMapper.js';

const MinuteChoice = /<minuteChoice:[ ]?(\d+)>/i;
const HourChoice = /<hourChoice:[ ]?(\d+)>/i;
const TimeOfDayChoice = /<timeOfDayChoice:[ ]?([0-5]|night|dawn|morning|afternoon|evening|twilight)>/i;
const TimeRangeChoice = /<timeRangeChoice:[ ]?(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})>/i;
const FullDateRangeChoice = /<fullDateRangeChoice:[ ]?(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])-(\[\d+, ?\d+, ?\d+, ?\d+, ?\d+])>/i;
const MinuteRangeChoice = /<minuteRangeChoice:[ ]?(\d+)-(\d+)>/i;
const DayChoice = /<dayChoice:[ ]?(\d+)>/i;
const MonthChoice = /<monthChoice:[ ]?(\d+)>/i;
const YearChoice = /<yearChoice:[ ]?(\d+)>/i;
const HourRangeChoice = /<hourRangeChoice:[ ]?(\d+)-(\d+)>/i;
const DayRangeChoice = /<dayRangeChoice:[ ]?(\d+)-(\d+)>/i;
const MonthRangeChoice = /<monthRangeChoice:[ ]?(\d+)-(\d+)>/i;
const YearRangeChoice = /<yearRangeChoice:[ ]?(\d+)-(\d+)>/i;

describe('TimeMapper (direct import)', () =>
{
  it('parses scalar time tags from comments', () =>
  {
    const c = TimeMapper.minuteToConditional('<minuteChoice: 42>', MinuteChoice);
    expect(c.minutes).toBe(42);

    expect(TimeMapper.hourToConditional('<hourChoice:7>', HourChoice).hours).toBe(7);
  });

  it('timeOfDayToConditional accepts numeric or name', () =>
  {
    const c = TimeMapper.timeOfDayToConditional('<timeOfDayChoice:evening>', TimeOfDayChoice);
    expect(c.timeOfDay).toBe(4);

    const numeric = TimeMapper.timeOfDayToConditional('<timeOfDayChoice:3>', TimeOfDayChoice);
    expect(numeric.timeOfDay).toBe(3);
  });

  it('timeRangeToConditional builds clock ranges', () =>
  {
    const c = TimeMapper.timeRangeToConditional('<timeRangeChoice:8:30-16:45>', TimeRangeChoice);
    expect(c.isTimeRange).toBe(true);
    expect(c.startRange).toEqual([ 8, 30 ]);
    expect(c.endRange).toEqual([ 16, 45 ]);
  });

  it('fullDateRangeToConditional prepends seconds and parses json segments', () =>
  {
    const raw = '<fullDateRangeChoice:[0,12,1,6,2024]-[30,18,15,6,2024]>';
    const c = TimeMapper.fullDateRangeToConditional(raw, FullDateRangeChoice);
    expect(c.isFullDateRange).toBe(true);
    expect(c.startRange[0]).toBe(0);
    expect(c.startRange[3]).toBe(1);
    expect(c.endRange[0]).toBe(59);
    expect(c.endRange[3]).toBe(15);
  });

  it('minuteRangeToConditional uses current global $gameTime snapshot hours', () =>
  {
    globalThis.$gameTime = {
      currentTime()
      {
        return { hours: 14 };
      },
    };

    const c = TimeMapper.minuteRangeToConditional('<minuteRangeChoice:10-50>', MinuteRangeChoice);
    expect(c.startRange).toEqual([ 14, 10 ]);
    expect(c.endRange).toEqual([ 14, 50 ]);

    delete globalThis.$gameTime;
  });

  it('parses direct day/month/year scalar tags from comments', () =>
  {
    expect(TimeMapper.dayToConditional('<dayChoice:15>', DayChoice).days).toBe(15);
    expect(TimeMapper.monthToConditional('<monthChoice:9>', MonthChoice).months).toBe(9);
    expect(TimeMapper.yearToConditional('<yearChoice:2025>', YearChoice).years).toBe(2025);
  });

  it('hourRangeToConditional builds an hour-only range', () =>
  {
    const c = TimeMapper.hourRangeToConditional('<hourRangeChoice:8-17>', HourRangeChoice);
    expect(c.isTimeRange).toBe(true);
    expect(c.startRange).toEqual([ 8, 0 ]);
    expect(c.endRange).toEqual([ 17, 0 ]);
  });

  it('dayRangeToConditional builds a full date range using the current month/year', () =>
  {
    globalThis.$gameTime = {
      currentTime()
      {
        return { months: 6, years: 2024 };
      },
    };

    // end day after start day- same month, no rollover.
    const c = TimeMapper.dayRangeToConditional('<dayRangeChoice:1-15>', DayRangeChoice);
    expect(c.isFullDateRange).toBe(true);
    expect(c.startRange).toEqual([ 0, 0, 0, 1, 6, 2024 ]);
    expect(c.endRange).toEqual([ 59, 59, 23, 15, 6, 2024 ]);

    delete globalThis.$gameTime;
  });

  it('monthRangeToConditional builds a full date range using the current year', () =>
  {
    globalThis.$gameTime = {
      currentTime()
      {
        return { years: 2024 };
      },
    };

    // end month before start month- rolls into next year.
    const c = TimeMapper.monthRangeToConditional('<monthRangeChoice:10-2>', MonthRangeChoice);
    expect(c.isFullDateRange).toBe(true);
    expect(c.startRange).toEqual([ 0, 0, 0, 1, 10, 2024 ]);
    expect(c.endRange).toEqual([ 59, 59, 23, 30, 2, 2025 ]);

    delete globalThis.$gameTime;
  });

  it('yearRangeToConditional builds a full date range spanning whole years', () =>
  {
    const c = TimeMapper.yearRangeToConditional('<yearRangeChoice:2020-2025>', YearRangeChoice);
    expect(c.isFullDateRange).toBe(true);
    expect(c.startRange).toEqual([ 0, 0, 0, 1, 1, 2020 ]);
    expect(c.endRange).toEqual([ 0, 0, 0, 1, 1, 2025 ]);
  });
});
//endregion plugins/time/time-mapper-direct.test.js
