//region plugins/time/game-time-logic-direct.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installTimeHostGlobals } from './fixtures/install-time-host-globals.js';

describe('J-TIME Game_Time logic (direct src import)', () =>
{
  let Game_Time;

  beforeAll(async () =>
  {
    vi.resetModules();

    installTimeHostGlobals();

    await import('../../../src/plugins/time/core/_metadata/initialization.js');

    ({ default: Game_Time } = await import('../../../src/plugins/time/core/_models/Game_Time.js'));
  });

  describe('setTickSpeed', () =>
  {
    it('clamps a multiplier above 10 down to 10', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setTickSpeed(100);

      // Assert
      expect(t.getTickSpeed()).toBe(Math.ceil(60 / 10));
    });

    it('clamps a multiplier below 0.1 up to 0.1', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      t.setTickSpeed(0.01);

      // Assert
      expect(t.getTickSpeed()).toBe(Math.ceil(60 / 0.1));
    });
  });

  describe('addSeconds', () =>
  {
    it('accumulates seconds under the 60-second rollover threshold', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);

      // Act
      t.addSeconds(59);

      // Assert
      expect(t._seconds).toBe(59);
    });

    it('rolls seconds over into the next minute at the 60-second threshold', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 0, 1, 1, 2020);
      t.addSeconds(59);

      // Act
      t.addSeconds(1);

      // Assert
      expect(t._seconds).toBe(0);
      expect(t._minutes).toBe(1);
    });
  });

  describe('timeOfDay', () =>
  {
    it('maps hour 0 to the night bucket (id 0)', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      const result = t.timeOfDay(0);

      // Assert
      expect(result).toBe(0);
    });

    it('maps hour 5 to the dawn bucket (id 1)', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      const result = t.timeOfDay(5);

      // Assert
      expect(result).toBe(1);
    });

    it('maps hour 12 to the afternoon bucket (id 3)', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      const result = t.timeOfDay(12);

      // Assert
      expect(result).toBe(3);
    });
  });

  describe('seasonOfYear', () =>
  {
    it('maps month 6 to the summer bucket (id 1)', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      const result = t.seasonOfYear(6);

      // Assert
      expect(result).toBe(1);
    });

    it('maps month 12 to the winter bucket (id 3)', () =>
    {
      // Arrange
      const t = new Game_Time();

      // Act
      const result = t.seasonOfYear(12);

      // Assert
      expect(result).toBe(3);
    });
  });

  describe('determineArtificialTime', () =>
  {
    it('builds a snapshot that carries the constructed ids and derived names', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(5, 4, 14, 10, 6, 2024);

      // Act
      const snap = t.determineArtificialTime();

      // Assert
      expect(snap.seconds).toBe(5);
      expect(snap.hours).toBe(14);
      expect(snap.timeOfDayName).toBe('Afternoon');
      expect(snap.seasonOfTheYearName).toBe('Summer');
    });
  });

  describe('jumpToTimeOfDay', () =>
  {
    it('advances the clock to the start hour of the next matching time-of-day bucket', () =>
    {
      // Arrange
      const t = new Game_Time();
      t.setTime(0, 0, 10, 1, 1, 2020);

      // Act
      t.jumpToTimeOfDay(3);

      // Assert
      expect(t._hours).toBe(12);
      expect(t._minutes).toBe(0);
      expect(t._seconds).toBe(0);
    });
  });

  describe('toneBetweenTones', () =>
  {
    it('linearly interpolates every rgb(+gray) channel at the given ratio', () =>
    {
      // Arrange
      const t = new Game_Time();
      const a = [ 0, 0, 0, 0 ];
      const b = [ 10, 20, 30, 40 ];

      // Act
      const mid = t.toneBetweenTones(a, b, 0.5);

      // Assert
      expect(mid[0]).toBe(5);
      expect(mid[1]).toBe(10);
      expect(mid[2]).toBe(15);
      expect(mid[3]).toBe(20);
    });
  });

  describe('canUpdateTime', () =>
  {
    it('returns false when the frame count is not evenly divisible by the tick speed', () =>
    {
      // Arrange
      const t = new Game_Time();
      globalThis.Graphics.frameCount = 59;

      // Act
      const result = t.canUpdateTime();

      // Assert
      expect(result).toBe(false);
    });

    it('returns true when the frame count is evenly divisible by the tick speed', () =>
    {
      // Arrange
      const t = new Game_Time();
      globalThis.Graphics.frameCount = 60;

      // Act
      const result = t.canUpdateTime();

      // Assert
      expect(result).toBe(true);
    });
  });
});
//endregion plugins/time/game-time-logic-direct.test.js
