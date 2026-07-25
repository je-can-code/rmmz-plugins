//region plugins/time/_component/time-snapshot-direct.test.js
import { describe, expect, it } from 'vitest';

import Time_Snapshot from '../../../../src/plugins/time/core/_models/Time_Snapshot.js';

describe('Time_Snapshot (direct import)', () =>
{
  describe('TimesOfDayName', () =>
  {
    it('returns the name for a known time-of-day id', () =>
    {
      // Arrange
      const id = 2;

      // Act
      const result = Time_Snapshot.TimesOfDayName(id);

      // Assert
      expect(result).toBe('Morning');
    });

    it('returns null for an unknown time-of-day id', () =>
    {
      // Arrange
      const id = 99;

      // Act
      const result = Time_Snapshot.TimesOfDayName(id);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('TimesOfDayId', () =>
  {
    it('returns the id for a known time-of-day name, case-insensitively', () =>
    {
      // Arrange
      const name = 'TWILIGHT';

      // Act
      const result = Time_Snapshot.TimesOfDayId(name);

      // Assert
      expect(result).toBe(5);
    });

    it('returns -1 for an unknown time-of-day name', () =>
    {
      // Arrange
      const name = 'nonsense';

      // Act
      const result = Time_Snapshot.TimesOfDayId(name);

      // Assert
      expect(result).toBe(-1);
    });
  });

  describe('SeasonsName', () =>
  {
    it('returns the name for a known season id', () =>
    {
      // Arrange
      const id = 0;

      // Act
      const result = Time_Snapshot.SeasonsName(id);

      // Assert
      expect(result).toBe('Spring');
    });

    it('returns null for an unknown season id', () =>
    {
      // Arrange
      const id = 99;

      // Act
      const result = Time_Snapshot.SeasonsName(id);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('SeasonsId', () =>
  {
    it('returns the id for a known season name', () =>
    {
      // Arrange
      const name = 'Fall';

      // Act
      const result = Time_Snapshot.SeasonsId(name);

      // Assert
      expect(result).toBe(2);
    });

    it('returns -1 for an unknown season name', () =>
    {
      // Arrange
      const name = 'nonsense';

      // Act
      const result = Time_Snapshot.SeasonsId(name);

      // Assert
      expect(result).toBe(-1);
    });
  });

  describe('SeasonsIconIndex', () =>
  {
    it('returns the icon index for a known season id', () =>
    {
      // Arrange
      const id = 1;

      // Act
      const result = Time_Snapshot.SeasonsIconIndex(id);

      // Assert
      expect(result).toBe(888);
    });
  });

  describe('TimesOfDayIcon', () =>
  {
    it('returns the icon index for a known time-of-day id', () =>
    {
      // Arrange
      const id = 4;

      // Act
      const result = Time_Snapshot.TimesOfDayIcon(id);

      // Assert
      expect(result).toBe(2257);
    });
  });

  describe('instance getters derived from its own ids', () =>
  {
    it('timeOfDayName reflects the constructed timeOfDay id', () =>
    {
      // Arrange
      const snapshot = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);

      // Act
      const result = snapshot.timeOfDayName;

      // Assert
      expect(result).toBe('Morning');
    });

    it('timeOfDayIcon reflects the constructed timeOfDay id', () =>
    {
      // Arrange
      const snapshot = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);

      // Act
      const result = snapshot.timeOfDayIcon;

      // Assert
      expect(result).toBe(2261);
    });

    it('seasonOfTheYearName reflects the constructed season id', () =>
    {
      // Arrange
      const snapshot = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);

      // Act
      const result = snapshot.seasonOfTheYearName;

      // Assert
      expect(result).toBe('Winter');
    });

    it('seasonOfTheYearIcon reflects the constructed season id', () =>
    {
      // Arrange
      const snapshot = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);

      // Act
      const result = snapshot.seasonOfTheYearIcon;

      // Assert
      expect(result).toBe(890);
    });
  });

  describe('equals', () =>
  {
    it('returns false for two snapshots at different times', () =>
    {
      // Arrange
      const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
      const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);

      // Act
      const result = early.equals(late);

      // Assert
      expect(result).toBe(false);
    });

    it('returns true for a snapshot compared to itself', () =>
    {
      // Arrange
      const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);

      // Act
      const result = early.equals(early);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('isAfter', () =>
  {
    it('returns true when this snapshot is later than the compared one', () =>
    {
      // Arrange
      const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
      const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);

      // Act
      const result = late.isAfter(early);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when this snapshot is earlier than the compared one', () =>
    {
      // Arrange
      const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
      const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);

      // Act
      const result = early.isAfter(late);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isBefore', () =>
  {
    it('returns true when this snapshot is earlier than the compared one', () =>
    {
      // Arrange
      const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
      const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);

      // Act
      const result = early.isBefore(late);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when this snapshot is later than the compared one', () =>
    {
      // Arrange
      const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
      const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);

      // Act
      const result = late.isBefore(early);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isBetweenSnapshots', () =>
  {
    it('returns true when strictly between the start and end snapshots', () =>
    {
      // Arrange
      const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
      const middle = new Time_Snapshot(0, 30, 9, 1, 1, 2020, 2, 3);
      const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);

      // Act
      const result = middle.isBetweenSnapshots(early, late);

      // Assert
      expect(result).toBe(true);
    });

    it('excludes an exact match on the start boundary by default', () =>
    {
      // Arrange
      const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
      const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);

      // Act
      const result = late.isBetweenSnapshots(early, early, true, false);

      // Assert
      expect(result).toBe(false);
    });

    it('includes an exact match on the end boundary when the end is marked inclusive', () =>
    {
      // Arrange
      const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
      const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);

      // Act
      const result = late.isBetweenSnapshots(early, late, false, true);

      // Assert
      expect(result).toBe(true);
    });

    it('excludes an exact match on the end boundary when the end is marked exclusive', () =>
    {
      // Arrange
      const early = new Time_Snapshot(0, 0, 9, 1, 1, 2020, 2, 3);
      const late = new Time_Snapshot(0, 0, 10, 1, 1, 2020, 2, 3);

      // Act
      const result = late.isBetweenSnapshots(early, late, false, false);

      // Assert
      expect(result).toBe(false);
    });
  });
});
//endregion plugins/time/_component/time-snapshot-direct.test.js
