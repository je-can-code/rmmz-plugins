//region plugins/_base/models/j-timer.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J_Timer (direct src import)', () =>
{
  let J_Timer;

  beforeAll(async () =>
  {
    String.empty = '';

    ({ default: J_Timer } = await import('../../../../src/plugins/_base/models/J_Timer.js'));
  });

  describe('constructor', () =>
  {
    it('applies the given timerMax (regression: initMembers() used to silently reset it to 0)', () =>
    {
      // Arrange & Act
      const timer = new J_Timer(15);

      // Assert
      expect(timer.getMaxTime()).toBe(15);
    });

    it('defaults timerMax to 0 when omitted', () =>
    {
      // Arrange & Act
      const timer = new J_Timer();

      // Assert
      expect(timer.getMaxTime()).toBe(0);
    });

    it('defaults stopCounting to true when omitted', () =>
    {
      // Arrange & Act
      const timer = new J_Timer();

      // Assert
      expect(timer.shouldStopCounting()).toBe(true);
    });

    it('applies an explicit stopCounting value', () =>
    {
      // Arrange & Act
      const timer = new J_Timer(0, false);

      // Assert
      expect(timer.shouldStopCounting()).toBe(false);
    });

    it('starts with a fresh key and zeroed current time', () =>
    {
      // Arrange & Act
      const timer = new J_Timer(10);

      // Assert
      expect(timer.getKey()).toBe('');
      expect(timer.getCurrentTime()).toBe(0);
    });
  });

  describe('getKey / setKey', () =>
  {
    it('round-trips a key', () =>
    {
      // Arrange
      const timer = new J_Timer();

      // Act
      timer.setKey('probe');

      // Assert
      expect(timer.getKey()).toBe('probe');
    });
  });

  describe('getMaxTime / setMaxTime', () =>
  {
    it('round-trips a max time', () =>
    {
      // Arrange
      const timer = new J_Timer();

      // Act
      timer.setMaxTime(50);

      // Assert
      expect(timer.getMaxTime()).toBe(50);
    });
  });

  describe('setCurrentTime', () =>
  {
    it('sets the current time below max, leaving the timer incomplete', () =>
    {
      // Arrange
      const timer = new J_Timer(10);

      // Act
      timer.setCurrentTime(5);

      // Assert
      expect(timer.getCurrentTime()).toBe(5);
      expect(timer.isTimerComplete()).toBe(false);
    });

    it('marks the timer complete when set at or above max', () =>
    {
      // Arrange
      const timer = new J_Timer(10);

      // Act
      timer.setCurrentTime(10);

      // Assert
      expect(timer.isTimerComplete()).toBe(true);
    });

    it('reverts completion when set back below max', () =>
    {
      // Arrange
      const timer = new J_Timer(10);
      timer.setCurrentTime(10);

      // Act
      timer.setCurrentTime(5);

      // Assert
      expect(timer.isTimerComplete()).toBe(false);
    });
  });

  describe('modCurrentTime', () =>
  {
    it('adds the given amount and returns the new total', () =>
    {
      // Arrange
      const timer = new J_Timer(10);
      timer.setCurrentTime(3);

      // Act
      const result = timer.modCurrentTime(2);

      // Assert
      expect(result).toBe(5);
      expect(timer.getCurrentTime()).toBe(5);
    });

    it('marks the timer complete once the modified total reaches max', () =>
    {
      // Arrange
      const timer = new J_Timer(10);

      // Act
      timer.modCurrentTime(10);

      // Assert
      expect(timer.isTimerComplete()).toBe(true);
    });
  });

  describe('normalizeTime', () =>
  {
    it('does nothing when the timer is not complete', () =>
    {
      // Arrange
      const timer = new J_Timer(10);
      timer.setCurrentTime(3);

      // Act
      timer.normalizeTime();

      // Assert
      expect(timer.getCurrentTime()).toBe(3);
    });

    it('does nothing when the timer should not stop counting', () =>
    {
      // Arrange- stopCounting=false, and modCurrentTime overshoots past max.
      const timer = new J_Timer(10, false);
      timer.modCurrentTime(15);

      // Act
      timer.normalizeTime();

      // Assert- overshoot is preserved since this timer doesn't normalize.
      expect(timer.getCurrentTime()).toBe(15);
    });

    it('clamps the current time back to max when complete and stopCounting is true', () =>
    {
      // Arrange
      const timer = new J_Timer(10, true);

      // Act- modCurrentTime internally calls normalizeTime after completing.
      timer.modCurrentTime(15);

      // Assert
      expect(timer.getCurrentTime()).toBe(10);
    });
  });

  describe('reset', () =>
  {
    it('zeroes the current time and clears completion', () =>
    {
      // Arrange
      const timer = new J_Timer(10);
      timer.setCurrentTime(10);

      // Act
      timer.reset();

      // Assert
      expect(timer.getCurrentTime()).toBe(0);
      expect(timer.isTimerComplete()).toBe(false);
    });
  });

  describe('tick', () =>
  {
    it('increments the timer by one when not complete', () =>
    {
      // Arrange
      const timer = new J_Timer(10);

      // Act
      timer.tick();

      // Assert
      expect(timer.getCurrentTime()).toBe(1);
    });

    it('does not increment past completion', () =>
    {
      // Arrange
      const timer = new J_Timer(1);
      timer.update();
      expect(timer.isTimerComplete()).toBe(true);

      // Act
      timer.tick();

      // Assert
      expect(timer.getCurrentTime()).toBe(1);
    });
  });

  describe('tock / update', () =>
  {
    it('tock marks completion once the tick count reaches max', () =>
    {
      // Arrange
      const timer = new J_Timer(1);

      // Act
      timer.tick();
      timer.tock();

      // Assert
      expect(timer.isTimerComplete()).toBe(true);
    });

    it('update composes tick and tock to advance and evaluate completion in one call', () =>
    {
      // Arrange
      const timer = new J_Timer(1);

      // Act
      timer.update();

      // Assert
      expect(timer.isTimerComplete()).toBe(true);
    });
  });

  describe('forceComplete', () =>
  {
    it('jumps the timer straight to a completed state at max time', () =>
    {
      // Arrange
      const timer = new J_Timer(10);

      // Act
      timer.forceComplete();

      // Assert
      expect(timer.getCurrentTime()).toBe(10);
      expect(timer.isTimerComplete()).toBe(true);
    });
  });

  describe('onComplete', () =>
  {
    it('fires as a no-op hook when the timer completes', () =>
    {
      // Arrange
      const timer = new J_Timer(1);
      const completeSpy = vi.spyOn(timer, 'onComplete');

      // Act
      timer.update();

      // Assert
      expect(completeSpy).toHaveBeenCalled();
      completeSpy.mockRestore();
    });

    it('does not fire again on a subsequent already-complete tick', () =>
    {
      // Arrange
      const timer = new J_Timer(1);
      timer.update();
      const completeSpy = vi.spyOn(timer, 'onComplete');

      // Act
      timer.update();

      // Assert
      expect(completeSpy).not.toHaveBeenCalled();
      completeSpy.mockRestore();
    });
  });
});
//endregion plugins/_base/models/j-timer.test.js
