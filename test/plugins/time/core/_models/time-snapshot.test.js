//region plugins/time/core/_models/time-snapshot.test.js
import { afterEach, describe, expect, it, vi } from 'vitest';

import Time_Snapshot from '../../../../../src/plugins/time/core/_models/Time_Snapshot.js';

describe('Time_Snapshot', () =>
{
  afterEach(() =>
  {
    vi.restoreAllMocks();
  });

  /**
   * Builds a snapshot at a given moment, defaulting the parts a test does not care about.
   */
  const snapshotAt = ({
    seconds = 0,
    minutes = 0,
    hours = 9,
    days = 1,
    months = 1,
    years = 2020,
    timeOfDayId = 2,
    seasonOfYearId = 3,
  } = {}) => new Time_Snapshot(seconds, minutes, hours, days, months, years, timeOfDayId, seasonOfYearId);

  /**
   * Silences the console.error the invalid-input paths emit, so an intentional bad lookup does not
   * clutter the test output, and hands back the spy for assertions.
   */
  const silenceError = () => vi.spyOn(console, 'error')
    .mockImplementation(() =>
    {
    });

  describe('SeasonsName', () =>
  {
    it('names season 0 spring', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsName(0)).toBe('Spring');
    });

    it('names season 1 summer', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsName(1)).toBe('Summer');
    });

    it('names season 2 autumn', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsName(2)).toBe('Autumn');
    });

    it('names season 3 winter', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsName(3)).toBe('Winter');
    });

    it('reports no name for a season id off the calendar', () =>
    {
      // Arrange
      const error = silenceError();

      // Act
      const result = Time_Snapshot.SeasonsName(9);

      // Assert
      expect(result).toBeNull();
      expect(error).toHaveBeenCalled();
    });
  });

  describe('SeasonsIconIndex', () =>
  {
    it('gives spring its icon', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsIconIndex(0)).toBe(887);
    });

    it('gives summer its icon', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsIconIndex(1)).toBe(888);
    });

    it('gives autumn its icon', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsIconIndex(2)).toBe(889);
    });

    it('gives winter its icon', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsIconIndex(3)).toBe(890);
    });

    it('describes the problem instead of an icon for a season id off the calendar', () =>
    {
      // Arrange
      // Act
      const result = Time_Snapshot.SeasonsIconIndex(9);

      // Assert
      expect(result).toBe('9 is not a valid season id.');
    });
  });

  describe('SeasonsId', () =>
  {
    it('resolves spring by name', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsId('spring')).toBe(0);
    });

    it('resolves summer by name', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsId('summer')).toBe(1);
    });

    it('resolves autumn by name', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsId('autumn')).toBe(2);
    });

    it('resolves autumn by its american alias', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsId('fall')).toBe(2);
    });

    it('resolves winter by name', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsId('winter')).toBe(3);
    });

    it('resolves a name regardless of how it was capitalized', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.SeasonsId('WiNtEr')).toBe(3);
    });

    it('returns the unknown sentinel for a name that is not a season', () =>
    {
      // Arrange
      const error = silenceError();

      // Act
      const result = Time_Snapshot.SeasonsId('harvest');

      // Assert
      expect(result).toBe(-1);
      expect(error).toHaveBeenCalled();
    });
  });

  describe('TimesOfDayName', () =>
  {
    const expectedNames = [ 'Night', 'Dawn', 'Morning', 'Afternoon', 'Evening', 'Twilight' ];

    expectedNames.forEach((expected, id) =>
    {
      it(`names time of day ${id} ${expected.toLowerCase()}`, () =>
      {
        // Arrange
        // Act
        // Assert
        expect(Time_Snapshot.TimesOfDayName(id)).toBe(expected);
      });
    });

    it('reports no name for a time of day id off the clock', () =>
    {
      // Arrange
      const error = silenceError();

      // Act
      const result = Time_Snapshot.TimesOfDayName(9);

      // Assert
      expect(result).toBeNull();
      expect(error).toHaveBeenCalled();
    });
  });

  describe('TimesOfDayIcon', () =>
  {
    const expectedIcons = [ 2256, 2260, 2261, 2261, 2257, 2256 ];

    expectedIcons.forEach((expected, id) =>
    {
      it(`gives time of day ${id} its icon`, () =>
      {
        // Arrange
        // Act
        // Assert
        expect(Time_Snapshot.TimesOfDayIcon(id)).toBe(expected);
      });
    });

    it('describes the problem instead of an icon for a time of day id off the clock', () =>
    {
      // Arrange
      // Act
      const result = Time_Snapshot.TimesOfDayIcon(9);

      // Assert
      expect(result).toBe('9 is not a valid time of day id.');
    });
  });

  describe('TimesOfDayId', () =>
  {
    const expectedIds = [ 'night', 'dawn', 'morning', 'afternoon', 'evening', 'twilight' ];

    expectedIds.forEach((name, expected) =>
    {
      it(`resolves ${name} to id ${expected}`, () =>
      {
        // Arrange
        // Act
        // Assert
        expect(Time_Snapshot.TimesOfDayId(name)).toBe(expected);
      });
    });

    it('resolves a name regardless of how it was capitalized', () =>
    {
      // Arrange
      // Act
      // Assert
      expect(Time_Snapshot.TimesOfDayId('TwIlIgHt')).toBe(5);
    });

    it('returns the unknown sentinel for a name that is not a time of day', () =>
    {
      // Arrange
      const error = silenceError();

      // Act
      const result = Time_Snapshot.TimesOfDayId('brunch');

      // Assert
      expect(result).toBe(-1);
      expect(error).toHaveBeenCalled();
    });
  });

  describe('equals', () =>
  {
    it('reports two identical moments as equal', () =>
    {
      // Arrange
      const left = snapshotAt();
      const right = snapshotAt();

      // Act
      const result = left.equals(right);

      // Assert
      expect(result).toBe(true);
    });

    it('reports a differing year as unequal', () =>
    {
      // Arrange
      const left = snapshotAt();
      const right = snapshotAt({ years: 2021 });

      // Act
      const result = left.equals(right);

      // Assert
      expect(result).toBe(false);
    });

    it('reports a differing month as unequal', () =>
    {
      // Arrange
      const left = snapshotAt();
      const right = snapshotAt({ months: 2 });

      // Act
      const result = left.equals(right);

      // Assert
      expect(result).toBe(false);
    });

    it('reports a differing day as unequal', () =>
    {
      // Arrange
      const left = snapshotAt();
      const right = snapshotAt({ days: 2 });

      // Act
      const result = left.equals(right);

      // Assert
      expect(result).toBe(false);
    });

    it('reports a differing hour as unequal', () =>
    {
      // Arrange
      const left = snapshotAt();
      const right = snapshotAt({ hours: 10 });

      // Act
      const result = left.equals(right);

      // Assert
      expect(result).toBe(false);
    });

    it('reports a differing minute as unequal', () =>
    {
      // Arrange
      const left = snapshotAt();
      const right = snapshotAt({ minutes: 1 });

      // Act
      const result = left.equals(right);

      // Assert
      expect(result).toBe(false);
    });

    it('reports a differing second as unequal', () =>
    {
      // Arrange
      const left = snapshotAt();
      const right = snapshotAt({ seconds: 1 });

      // Act
      const result = left.equals(right);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isBetweenSnapshots', () =>
  {
    it('reports a moment inside the range as between', () =>
    {
      // Arrange
      const start = snapshotAt({ hours: 8 });
      const end = snapshotAt({ hours: 10 });
      const subject = snapshotAt({ hours: 9 });

      // Act
      const result = subject.isBetweenSnapshots(start, end);

      // Assert
      expect(result).toBe(true);
    });

    it('reports a moment before the range as not between', () =>
    {
      // Arrange
      const start = snapshotAt({ hours: 8 });
      const end = snapshotAt({ hours: 10 });
      const subject = snapshotAt({ hours: 7 });

      // Act
      const result = subject.isBetweenSnapshots(start, end);

      // Assert
      expect(result).toBe(false);
    });

    it('reports a moment after the range as not between', () =>
    {
      // Arrange
      const start = snapshotAt({ hours: 8 });
      const end = snapshotAt({ hours: 10 });
      const subject = snapshotAt({ hours: 11 });

      // Act
      const result = subject.isBetweenSnapshots(start, end);

      // Assert
      expect(result).toBe(false);
    });

    it('excludes the exact start of the range by default', () =>
    {
      // Arrange
      const start = snapshotAt({ hours: 8 });
      const end = snapshotAt({ hours: 10 });
      const subject = snapshotAt({ hours: 8 });

      // Act
      const result = subject.isBetweenSnapshots(start, end);

      // Assert
      expect(result).toBe(false);
    });

    it('includes the exact start of the range when asked to', () =>
    {
      // Arrange
      const start = snapshotAt({ hours: 8 });
      const end = snapshotAt({ hours: 10 });
      const subject = snapshotAt({ hours: 8 });

      // Act
      const result = subject.isBetweenSnapshots(start, end, true);

      // Assert
      expect(result).toBe(true);
    });

    it('excludes the exact end of the range by default', () =>
    {
      // Arrange
      const start = snapshotAt({ hours: 8 });
      const end = snapshotAt({ hours: 10 });
      const subject = snapshotAt({ hours: 10 });

      // Act
      const result = subject.isBetweenSnapshots(start, end);

      // Assert
      expect(result).toBe(false);
    });

    it('includes the exact end of the range when asked to', () =>
    {
      // Arrange
      const start = snapshotAt({ hours: 8 });
      const end = snapshotAt({ hours: 10 });
      const subject = snapshotAt({ hours: 10 });

      // Act
      const result = subject.isBetweenSnapshots(start, end, false, true);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isAfter', () =>
  {
    it('reports a later moment as after', () =>
    {
      // Arrange
      const subject = snapshotAt({ hours: 10 });
      const target = snapshotAt({ hours: 9 });

      // Act
      const result = subject.isAfter(target);

      // Assert
      expect(result).toBe(true);
    });

    it('reports an earlier moment as not after', () =>
    {
      // Arrange
      const subject = snapshotAt({ hours: 8 });
      const target = snapshotAt({ hours: 9 });

      // Act
      const result = subject.isAfter(target);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isBefore', () =>
  {
    it('reports an earlier moment as before', () =>
    {
      // Arrange
      const subject = snapshotAt({ hours: 8 });
      const target = snapshotAt({ hours: 9 });

      // Act
      const result = subject.isBefore(target);

      // Assert
      expect(result).toBe(true);
    });

    it('reports a later moment as not before', () =>
    {
      // Arrange
      const subject = snapshotAt({ hours: 10 });
      const target = snapshotAt({ hours: 9 });

      // Act
      const result = subject.isBefore(target);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('derived descriptions', () =>
  {
    it('exposes the time of day id it was constructed with', () =>
    {
      // Arrange
      const subject = snapshotAt({ timeOfDayId: 4 });

      // Act
      const result = subject.timeOfDayId();

      // Assert
      expect(result).toBe(4);
    });

    it('exposes the season of year id it was constructed with', () =>
    {
      // Arrange
      const subject = snapshotAt({ seasonOfYearId: 1 });

      // Act
      const result = subject.seasonOfYearId();

      // Assert
      expect(result).toBe(1);
    });

    it('describes its time of day by name', () =>
    {
      // Arrange
      const subject = snapshotAt({ timeOfDayId: 4 });

      // Act
      const result = subject.timeOfDayName;

      // Assert
      expect(result).toBe('Evening');
    });

    it('describes its time of day by icon', () =>
    {
      // Arrange
      const subject = snapshotAt({ timeOfDayId: 4 });

      // Act
      const result = subject.timeOfDayIcon;

      // Assert
      expect(result).toBe(2257);
    });
  });
});
//endregion plugins/time/core/_models/time-snapshot.test.js
