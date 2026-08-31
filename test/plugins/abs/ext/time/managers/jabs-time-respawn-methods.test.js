//region plugins/abs/ext/time/managers/jabs-time-respawn-methods.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_TimeRespawnMethods reads everything through cross-ship globals ($gameTime, Time_Snapshot,
 * Game_Time, JABS_RespawnManager), so this file installs faithful minimal stand-ins for each- the
 * snapshot fake mirrors the artificial-calendar weekday derivation the real Time_Snapshot performs,
 * FakeAabb-style, because the schedulers walk candidate dates by asking them their weekday.
 */
describe('JABS_TimeRespawnMethods (unit, all cross-ship globals stubbed)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/abs/ext/time/managers/JABS_TimeRespawnMethods.js').default} */
  let JABS_TimeRespawnMethods;
  let registerMethodMock;

  /**
   * Builds a snapshot-shaped object with the artificial-calendar weekday derivation.
   */
  const buildSnapshot = (seconds, minutes, hours, days, months, years) => ({
    seconds,
    minutes,
    hours,
    days,
    months,
    years,
    dayOfWeekId()
    {
      // the artificial derivation: total days since the epoch monday, cycled through the week.
      return ((((this.years * 12) + (this.months - 1)) * 30) + (this.days - 1)) % 7;
    },
  });

  beforeAll(async () =>
  {
    vi.resetModules();

    // registration happens at import time; captured so the wiring can be asserted below.
    registerMethodMock = vi.fn();
    globalThis.JABS_RespawnManager = {
      registerMethod: (name, handler) => registerMethodMock(name, handler),
    };

    // minimal faithful stand-ins for the J-TIME name-to-id vocabularies.
    globalThis.Time_Snapshot = {
      TimesOfDayId: name => ({
        night: 0,
        dawn: 1,
        morning: 2,
        afternoon: 3,
        evening: 4,
        twilight: 5,
      })[name.toLowerCase()] ?? -1,
      DaysOfWeekId: name => ({
        monday: 0,
        tuesday: 1,
        wednesday: 2,
        thursday: 3,
        friday: 4,
        saturday: 5,
        sunday: 6,
      })[name.toLowerCase()] ?? -1,
      SeasonsId: name => ({
        spring: 0,
        summer: 1,
        autumn: 2,
        winter: 3,
      })[name.toLowerCase()] ?? -1,
    };

    // the artificial calendar's radixes, as the real Game_Time statics declare them.
    globalThis.Game_Time = {
      daysPerMonth: 30,
      monthsPerYear: 12,
    };

    ({ default: JABS_TimeRespawnMethods } = await import(
      '../../../../../../src/plugins/abs/ext/time/managers/JABS_TimeRespawnMethods.js'));
  });

  beforeEach(() =>
  {
    globalThis.J = { TIME: { Metadata: { UseRealTime: false } } };

    // a fixed "now": 9:15:30am on day 4 of month 5, year 2. (weekday: ((2*12+4)*30+3)%7 = 843%7 = 3)
    const now = buildSnapshot(30, 15, 9, 4, 5, 2);
    globalThis.$gameTime = {
      currentTime: () => now,
      toTimeSnapshot: fromArray =>
      {
        const [ seconds, minutes, hours, days, months, years ] = fromArray;
        return buildSnapshot(seconds, minutes, hours, days, months, years);
      },
      startOfTimeOfDay: timeOfDayId => [ 0, 4, 8, 12, 16, 20 ][timeOfDayId],
    };
  });

  describe('epochOf', () =>
  {
    it('encodes a moment into the documented radix-31 scalar', () =>
    {
      // Arrange
      const snapshot = buildSnapshot(1, 2, 3, 4, 5, 6);

      // Act
      const epoch = JABS_TimeRespawnMethods.epochOf(snapshot);

      // Assert- ((6*12+4)*31+3) days = 2359; ((2359*24+3)*60+2)*60+1 = 203828521.
      expect(epoch).toBe(203828521);
    });

    it('keeps the artificial month boundary ordered: day 30 precedes day 1 of the next month', () =>
    {
      // Arrange- a radix of 30 would make these two encode as equal.
      const endOfMonth = buildSnapshot(0, 0, 23, 30, 2, 1);
      const startOfNextMonth = buildSnapshot(0, 0, 0, 1, 3, 1);

      // Act
      const endEpoch = JABS_TimeRespawnMethods.epochOf(endOfMonth);
      const startEpoch = JABS_TimeRespawnMethods.epochOf(startOfNextMonth);

      // Assert
      expect(endEpoch).toBeLessThan(startEpoch);
    });

    it('keeps the real-calendar month boundary ordered: day 31 precedes day 1 of the next month', () =>
    {
      // Arrange- real time produces day 31, which a radix of 30 would fold past the next month.
      const endOfJanuary = buildSnapshot(0, 0, 23, 31, 1, 2026);
      const startOfFebruary = buildSnapshot(0, 0, 0, 1, 2, 2026);

      // Act
      const endEpoch = JABS_TimeRespawnMethods.epochOf(endOfJanuary);
      const startEpoch = JABS_TimeRespawnMethods.epochOf(startOfFebruary);

      // Assert
      expect(endEpoch).toBeLessThan(startEpoch);
    });
  });

  describe('currentEpoch', () =>
  {
    it('encodes the clock\'s current snapshot', () =>
    {
      // Arrange- now is 9:15:30 on day 4 of month 5, year 2: ((2*12+4)*31+3) = 871 days.
      // ((871*24+9)*60+15)*60+30 = 75287730.

      // Act
      const epoch = JABS_TimeRespawnMethods.currentEpoch();

      // Assert
      expect(epoch).toBe(75287730);
    });
  });

  describe('atClockTime', () =>
  {
    it('keeps the date and replaces the clock, zeroing seconds', () =>
    {
      // Arrange
      const snapshot = buildSnapshot(30, 15, 9, 4, 5, 2);

      // Act
      const result = JABS_TimeRespawnMethods.atClockTime(snapshot, 8, 45);

      // Assert
      expect(result.seconds).toBe(0);
      expect(result.minutes).toBe(45);
      expect(result.hours).toBe(8);
      expect(result.days).toBe(4);
      expect(result.months).toBe(5);
      expect(result.years).toBe(2);
    });
  });

  describe('addDays', () =>
  {
    it('advances within the artificial month without rolling over', () =>
    {
      // Arrange
      const snapshot = buildSnapshot(30, 15, 9, 4, 5, 2);

      // Act
      const result = JABS_TimeRespawnMethods.addDays(snapshot, 3);

      // Assert- the clock rides along unchanged.
      expect(result.days).toBe(7);
      expect(result.months).toBe(5);
      expect(result.years).toBe(2);
      expect(result.hours).toBe(9);
      expect(result.minutes).toBe(15);
      expect(result.seconds).toBe(30);
    });

    it('rolls an artificial day overflow into the next month', () =>
    {
      // Arrange
      const snapshot = buildSnapshot(0, 0, 0, 29, 5, 2);

      // Act
      const result = JABS_TimeRespawnMethods.addDays(snapshot, 2);

      // Assert
      expect(result.days).toBe(1);
      expect(result.months).toBe(6);
      expect(result.years).toBe(2);
    });

    it('rolls an artificial month overflow into the next year', () =>
    {
      // Arrange
      const snapshot = buildSnapshot(0, 0, 0, 30, 12, 2);

      // Act
      const result = JABS_TimeRespawnMethods.addDays(snapshot, 1);

      // Assert
      expect(result.days).toBe(1);
      expect(result.months).toBe(1);
      expect(result.years).toBe(3);
    });

    it('walks a multi-month overflow through repeated rollovers', () =>
    {
      // Arrange
      const snapshot = buildSnapshot(0, 0, 0, 1, 5, 2);

      // Act
      const result = JABS_TimeRespawnMethods.addDays(snapshot, 65);

      // Assert- 1+65=66 -> 36 (month 6) -> 6 (month 7).
      expect(result.days).toBe(6);
      expect(result.months).toBe(7);
      expect(result.years).toBe(2);
    });

    it('delegates real-time day arithmetic to the real calendar', () =>
    {
      // Arrange- January has 31 days, which the artificial arithmetic would never produce.
      globalThis.J.TIME.Metadata.UseRealTime = true;
      const snapshot = buildSnapshot(5, 10, 12, 31, 1, 2026);

      // Act
      const result = JABS_TimeRespawnMethods.addDays(snapshot, 1);

      // Assert
      expect(result.days).toBe(1);
      expect(result.months).toBe(2);
      expect(result.years).toBe(2026);
      expect(result.hours).toBe(12);
      expect(result.minutes).toBe(10);
      expect(result.seconds).toBe(5);
    });
  });

  describe('scheduleTimeOfDay', () =>
  {
    it('schedules nothing for an unrecognized time of day', () =>
    {
      // Arrange
      const param = 'lunchtime';

      // Act
      const due = JABS_TimeRespawnMethods.scheduleTimeOfDay(param);

      // Assert
      expect(due).toBeNull();
    });

    it('schedules today\'s occurrence when it is still ahead', () =>
    {
      // Arrange- now is 9:15am; the afternoon begins at noon today.
      const expected = JABS_TimeRespawnMethods.epochOf(buildSnapshot(0, 0, 12, 4, 5, 2));

      // Act
      const due = JABS_TimeRespawnMethods.scheduleTimeOfDay('afternoon');

      // Assert
      expect(due).toBe(expected);
    });

    it('schedules tomorrow\'s occurrence when today\'s has already begun', () =>
    {
      // Arrange- now is 9:15am, mid-morning; the next morning start is tomorrow's 8am.
      const expected = JABS_TimeRespawnMethods.epochOf(buildSnapshot(0, 0, 8, 5, 5, 2));

      // Act
      const due = JABS_TimeRespawnMethods.scheduleTimeOfDay('morning');

      // Assert
      expect(due).toBe(expected);
    });
  });

  describe('scheduleNextDay', () =>
  {
    it('schedules nothing for a non-numeric clock value', () =>
    {
      // Arrange
      const param = 'noonish';

      // Act
      const due = JABS_TimeRespawnMethods.scheduleNextDay(param);

      // Assert
      expect(due).toBeNull();
    });

    it('schedules nothing for a negative clock value', () =>
    {
      // Arrange
      const param = '-830';

      // Act
      const due = JABS_TimeRespawnMethods.scheduleNextDay(param);

      // Assert
      expect(due).toBeNull();
    });

    it('schedules nothing for an hour that is not on the clock', () =>
    {
      // Arrange
      const param = '2400';

      // Act
      const due = JABS_TimeRespawnMethods.scheduleNextDay(param);

      // Assert
      expect(due).toBeNull();
    });

    it('schedules nothing for a minute that is not on the clock', () =>
    {
      // Arrange
      const param = '1275';

      // Act
      const due = JABS_TimeRespawnMethods.scheduleNextDay(param);

      // Assert
      expect(due).toBeNull();
    });

    it('schedules tomorrow at the requested clock time', () =>
    {
      // Arrange- 830 reads as 8:30am on day 5, the day after now's day 4.
      const expected = JABS_TimeRespawnMethods.epochOf(buildSnapshot(0, 30, 8, 5, 5, 2));

      // Act
      const due = JABS_TimeRespawnMethods.scheduleNextDay('830');

      // Assert
      expect(due).toBe(expected);
    });
  });

  describe('scheduleDayOfWeek', () =>
  {
    it('schedules nothing for an unrecognized day of the week', () =>
    {
      // Arrange
      const param = 'caturday';

      // Act
      const due = JABS_TimeRespawnMethods.scheduleDayOfWeek(param);

      // Assert
      expect(due).toBeNull();
    });

    it('schedules tomorrow\'s midnight when tomorrow is the requested weekday', () =>
    {
      // Arrange- now is weekday 3 (thursday); tomorrow, day 5, is weekday 4 (friday).
      const expected = JABS_TimeRespawnMethods.epochOf(buildSnapshot(0, 0, 0, 5, 5, 2));

      // Act
      const due = JABS_TimeRespawnMethods.scheduleDayOfWeek('friday');

      // Assert
      expect(due).toBe(expected);
    });

    it('schedules a full week out when dying on the requested weekday itself', () =>
    {
      // Arrange- now is weekday 3 (thursday); the next thursday midnight is day 11.
      const expected = JABS_TimeRespawnMethods.epochOf(buildSnapshot(0, 0, 0, 11, 5, 2));

      // Act
      const due = JABS_TimeRespawnMethods.scheduleDayOfWeek('thursday');

      // Assert
      expect(due).toBe(expected);
    });
  });

  describe('scheduleMonthStart', () =>
  {
    it('schedules nothing for a non-numeric month', () =>
    {
      // Arrange
      const month = NaN;

      // Act
      const due = JABS_TimeRespawnMethods.scheduleMonthStart(month);

      // Assert
      expect(due).toBeNull();
    });

    it('schedules nothing for a month below the calendar', () =>
    {
      // Arrange
      const month = 0;

      // Act
      const due = JABS_TimeRespawnMethods.scheduleMonthStart(month);

      // Assert
      expect(due).toBeNull();
    });

    it('schedules nothing for a month beyond the calendar', () =>
    {
      // Arrange
      const month = 13;

      // Act
      const due = JABS_TimeRespawnMethods.scheduleMonthStart(month);

      // Assert
      expect(due).toBeNull();
    });

    it('schedules this year\'s occurrence when the month is still ahead', () =>
    {
      // Arrange- now is month 5; month 9 begins later this year.
      const expected = JABS_TimeRespawnMethods.epochOf(buildSnapshot(0, 0, 0, 1, 9, 2));

      // Act
      const due = JABS_TimeRespawnMethods.scheduleMonthStart(9);

      // Assert
      expect(due).toBe(expected);
    });

    it('schedules next year\'s occurrence when this year\'s has already begun', () =>
    {
      // Arrange- now is day 4 of month 5, so month 5's own start is behind us.
      const expected = JABS_TimeRespawnMethods.epochOf(buildSnapshot(0, 0, 0, 1, 5, 3));

      // Act
      const due = JABS_TimeRespawnMethods.scheduleMonthStart(5);

      // Assert
      expect(due).toBe(expected);
    });
  });

  describe('scheduleSeason', () =>
  {
    it('schedules nothing for an unrecognized season', () =>
    {
      // Arrange
      const param = 'monsoon';

      // Act
      const due = JABS_TimeRespawnMethods.scheduleSeason(param);

      // Assert
      expect(due).toBeNull();
    });

    describe.each([
      [ 'spring', 3, 3 ],
      [ 'summer', 6, 2 ],
      [ 'autumn', 9, 2 ],
      [ 'winter', 12, 2 ],
    ])('%s', (seasonName, startMonth, expectedYear) =>
    {
      it(`schedules the start of month ${startMonth}`, () =>
      {
        // Arrange- now is month 5 of year 2, so spring's month 3 lands next year while the
        // later season starts land this year.
        const expected = JABS_TimeRespawnMethods.epochOf(buildSnapshot(0, 0, 0, 1, startMonth, expectedYear));

        // Act
        const due = JABS_TimeRespawnMethods.scheduleSeason(seasonName);

        // Assert
        expect(due).toBe(expected);
      });
    });
  });

  describe('isDue', () =>
  {
    it('comes due the moment the scheduled epoch is reached', () =>
    {
      // Arrange- now encodes to exactly 75287730.
      const due = 75287730;

      // Act
      const result = JABS_TimeRespawnMethods.isDue(due);

      // Assert
      expect(result).toBe(true);
    });

    it('stays down while the scheduled epoch is still ahead', () =>
    {
      // Arrange
      const due = 75287731;

      // Act
      const result = JABS_TimeRespawnMethods.isDue(due);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('method registration', () =>
  {
    const registeredHandler = name =>
    {
      const call = registerMethodMock.mock.calls.find(([ registeredName ]) => registeredName === name);
      return call[1];
    };

    it('registers all five calendar methods with core\'s respawn registry', () =>
    {
      // Arrange
      const registeredNames = registerMethodMock.mock.calls.map(([ name ]) => name);

      // Act & Assert
      expect(registeredNames).toEqual([ 'time-of-day', 'next-day', 'day-of-week', 'month', 'season' ]);
    });

    describe.each([
      [ 'time-of-day', 'scheduleTimeOfDay', 'morning' ],
      [ 'next-day', 'scheduleNextDay', '830' ],
      [ 'day-of-week', 'scheduleDayOfWeek', 'monday' ],
      [ 'season', 'scheduleSeason', 'winter' ],
    ])('%s', (methodName, schedulerName, sampleParam) =>
    {
      it('delegates scheduling to its scheduler', () =>
      {
        // Arrange
        const spy = vi.spyOn(JABS_TimeRespawnMethods, schedulerName)
          .mockReturnValue(1234);

        // Act
        const due = registeredHandler(methodName).schedule(sampleParam);

        // Assert
        expect(spy).toHaveBeenCalledWith(sampleParam);
        expect(due).toBe(1234);
        spy.mockRestore();
      });
    });

    it('the month method parses its parameter into a number before scheduling', () =>
    {
      // Arrange
      const spy = vi.spyOn(JABS_TimeRespawnMethods, 'scheduleMonthStart')
        .mockReturnValue(1234);

      // Act
      const due = registeredHandler('month').schedule('9');

      // Assert
      expect(spy).toHaveBeenCalledWith(9);
      expect(due).toBe(1234);
      spy.mockRestore();
    });

    describe.each([
      [ 'time-of-day' ],
      [ 'next-day' ],
      [ 'day-of-week' ],
      [ 'month' ],
      [ 'season' ],
    ])('%s', methodName =>
    {
      it('delegates its due check to the shared epoch comparison', () =>
      {
        // Arrange
        const spy = vi.spyOn(JABS_TimeRespawnMethods, 'isDue')
          .mockReturnValue(true);

        // Act
        const result = registeredHandler(methodName).isDue(4567);

        // Assert
        expect(spy).toHaveBeenCalledWith(4567);
        expect(result).toBe(true);
        spy.mockRestore();
      });
    });
  });

});
//endregion plugins/abs/ext/time/managers/jabs-time-respawn-methods.test.js