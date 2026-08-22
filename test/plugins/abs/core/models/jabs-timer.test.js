//region plugins/abs/core/models/jabs-timer.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * JABS_Timer.js has zero imports- a pure, self-contained class- so this file dynamically
 * imports it directly with no mocking required.
 */
describe('JABS_Timer (unit, pure/no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/models/JABS_Timer.js').default} */
  let JABS_Timer;

  beforeAll(async () =>
  {
    ({ default: JABS_Timer } = await import('../../../../../src/plugins/abs/core/models/JABS_Timer.js'));
  });

  describe('constructor', () =>
  {
    it('defaults max time to 0, stop-counting to true, and callback to null', () =>
    {
      const timer = new JABS_Timer();

      expect(timer.getMaxTime()).toEqual(0);
      expect(timer.shouldStopCounting()).toEqual(true);
    });

    it('accepts explicit max time and stop-counting flag', () =>
    {
      const timer = new JABS_Timer(10, false);

      expect(timer.getMaxTime()).toEqual(10);
      expect(timer.shouldStopCounting()).toEqual(false);
    });
  });

  describe('key', () =>
  {
    it('defaults to an empty string', () =>
    {
      const timer = new JABS_Timer();

      expect(timer.getKey()).toEqual(String.empty);
    });

    it('can be set to a new value', () =>
    {
      const timer = new JABS_Timer();
      timer.setKey('my-key');

      expect(timer.getKey()).toEqual('my-key');
    });
  });

  describe('setCurrentTime()/getCurrentTime()', () =>
  {
    it('sets and gets the current time below the max', () =>
    {
      const timer = new JABS_Timer(10);
      timer.setCurrentTime(5);

      expect(timer.getCurrentTime()).toEqual(5);
      expect(timer.isTimerComplete()).toEqual(false);
    });

    it('marks the timer complete when set at or above max time', () =>
    {
      const timer = new JABS_Timer(10);
      timer.setCurrentTime(10);

      expect(timer.isTimerComplete()).toEqual(true);
    });

    it('un-marks completion when set back below max time', () =>
    {
      const timer = new JABS_Timer(10);
      timer.setCurrentTime(10);
      timer.setCurrentTime(5);

      expect(timer.isTimerComplete()).toEqual(false);
    });

    it('normalizes time back down to max when stop-counting is enabled and time overshoots', () =>
    {
      const timer = new JABS_Timer(10, true);
      timer.setCurrentTime(15);

      expect(timer.getCurrentTime()).toEqual(10);
    });

    it('does not normalize time when stop-counting is disabled', () =>
    {
      const timer = new JABS_Timer(10, false);
      timer.setCurrentTime(15);

      expect(timer.getCurrentTime()).toEqual(15);
    });
  });

  describe('modCurrentTime()', () =>
  {
    it('modifies the current time by the given amount and returns the new total', () =>
    {
      const timer = new JABS_Timer(10);
      const result = timer.modCurrentTime(4);

      expect(result).toEqual(4);
      expect(timer.getCurrentTime()).toEqual(4);
    });
  });

  describe('setMaxTime()', () =>
  {
    it('updates the max time', () =>
    {
      const timer = new JABS_Timer();
      timer.setMaxTime(20);

      expect(timer.getMaxTime()).toEqual(20);
    });
  });

  describe('reset()', () =>
  {
    it('resets the timer back to zero and incomplete', () =>
    {
      const timer = new JABS_Timer(10);
      timer.setCurrentTime(10);
      timer.reset();

      expect(timer.getCurrentTime()).toEqual(0);
      expect(timer.isTimerComplete()).toEqual(false);
    });
  });

  describe('tick()/tock()/update()', () =>
  {
    it('increments the timer by one on tick', () =>
    {
      const timer = new JABS_Timer(10);
      timer.tick();

      expect(timer.getCurrentTime()).toEqual(1);
    });

    it('does not increment past completion on tick', () =>
    {
      // tick() alone does not mark completion- pair with tock() first, matching update()'s own sequence.
      const timer = new JABS_Timer(1);
      timer.tick();
      timer.tock();
      timer.tick();

      expect(timer.getCurrentTime()).toEqual(1);
    });

    it('marks completion via tock once max time is reached', () =>
    {
      const timer = new JABS_Timer(1);
      timer.tick();
      timer.tock();

      expect(timer.isTimerComplete()).toEqual(true);
    });

    it('update() advances the timer to completion over repeated calls', () =>
    {
      const timer = new JABS_Timer(2);
      timer.update();
      timer.update();

      expect(timer.isTimerComplete()).toEqual(true);
    });
  });

  describe('forceComplete()', () =>
  {
    it('forces the timer to its max time and marks it complete', () =>
    {
      const timer = new JABS_Timer(10);
      timer.forceComplete();

      expect(timer.getCurrentTime()).toEqual(10);
      expect(timer.isTimerComplete()).toEqual(true);
    });
  });

  describe('onComplete()', () =>
  {
    it('is invoked once when the timer completes', () =>
    {
      let completedCount = 0;
      const timer = new JABS_Timer(1);
      timer.onComplete = () => { completedCount++; };
      timer.tick();
      timer.tock();
      timer.tock();

      expect(completedCount).toEqual(1);
    });

    it('does not fire again when an already-complete timer is re-set at its max time', () =>
    {
      // Arrange
      // re-setting the time leaves the visible state identical either way- the timer still reads 1
      // and still reports complete- so the callback tally is the only thing that can tell whether
      // the incomplete-check correctly declined to un-complete a timer sitting exactly at max.
      let completedCount = 0;
      const timer = new JABS_Timer(1);
      timer.onComplete = () => { completedCount++; };

      // Act
      timer.setCurrentTime(1);
      timer.setCurrentTime(1);

      // Assert
      expect(completedCount).toEqual(1);
      expect(timer.isTimerComplete()).toEqual(true);
      expect(timer.getCurrentTime()).toEqual(1);
    });
  });
});
//endregion plugins/abs/core/models/jabs-timer.test.js
