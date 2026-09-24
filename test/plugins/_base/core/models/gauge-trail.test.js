//region plugins/_base/core/models/gauge-trail.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The numbers behind every trailing gauge: a loss snaps the fill down and drains a trail after it, a gain jumps
 * the trail up and grows the fill into it.
 *
 * Each test pins both ends. The end that should jump and the end that should not are the whole difference
 * between a loss and a gain, and a test that only watched one of them would pass with the two swapped.
 */
describe('GaugeTrail (direct src import)', () =>
{
  let GaugeTrail;

  beforeAll(async () =>
  {
    ({ default: GaugeTrail } = await import('../../../../../src/plugins/_base/core/models/GaugeTrail.js'));
  });

  /**
   * Builds a trail already showing a value, with nothing to animate.
   * @param {number} value The value it starts at.
   * @param {number} max The max it starts at.
   * @returns {GaugeTrail}
   */
  function trailAt(value, max = 100)
  {
    const trail = new GaugeTrail();
    trail.track(value, max);

    return trail;
  }

  describe('track', () =>
  {
    it('takes the first value as it is, with nothing to animate', () =>
    {
      // Arrange
      const trail = new GaugeTrail();

      // Act
      trail.track(80, 100);

      // Assert
      expect(trail.fillRate()).toBe(0.8);
      expect(trail.trailRate()).toBe(0.8);
      expect(trail.isSettled()).toBe(true);
    });

    it('shows a loss by dropping the fill straight to the value and draining the trail after it', () =>
    {
      // Arrange
      const trail = trailAt(80);

      // Act
      trail.track(50, 100);

      // Assert- the fill is already there; the trail has closed a tenth of the thirty-point gap.
      expect(trail.fillRate()).toBe(0.5);
      expect(trail.trailRate()).toBeCloseTo(0.77, 10);
      expect(trail.trend()).toBe(GaugeTrail.Trends.Loss);
    });

    it('shows a gain by jumping the trail straight to the value and growing the fill into it', () =>
    {
      // Arrange
      const trail = trailAt(50);

      // Act
      trail.track(80, 100);

      // Assert- the trail is already there; the fill has closed a tenth of the thirty-point gap.
      expect(trail.trailRate()).toBe(0.8);
      expect(trail.fillRate()).toBeCloseTo(0.53, 10);
      expect(trail.trend()).toBe(GaugeTrail.Trends.Gain);
    });

    it('keeps the trail moving while the value holds', () =>
    {
      // Arrange
      const trail = trailAt(80);
      trail.track(50, 100);

      // Act
      trail.track(50, 100);

      // Assert- another tenth of what was left: 77 down to 74.3.
      expect(trail.trailRate()).toBeCloseTo(0.743, 10);
      expect(trail.fillRate()).toBe(0.5);
    });

    it('stays unsettled while the gap is still wider than a tenth of a percent of the max', () =>
    {
      // Arrange- a 0.12 drop leaves 0.108 after one step, just over the 0.1 a max of 100 allows.
      const trail = trailAt(50);

      // Act
      trail.track(49.88, 100);

      // Assert
      expect(trail.isSettled()).toBe(false);
      expect(trail.trailRate()).toBeCloseTo(0.49988, 10);
    });

    it('settles both ends on the value once the gap is within a tenth of a percent of the max', () =>
    {
      // Arrange- a 0.11 drop leaves 0.099 after one step, just inside the 0.1 a max of 100 allows.
      const trail = trailAt(50);

      // Act
      trail.track(49.89, 100);

      // Assert
      expect(trail.isSettled()).toBe(true);
      expect(trail.trailRate()).toBeCloseTo(0.4989, 10);
      expect(trail.fillRate()).toBeCloseTo(0.4989, 10);
    });

    it('measures a loss during a gain from what the bar showed, dropping the gain that never landed', () =>
    {
      // Arrange- a gain toward 80 has only filled to 53 when the hit lands.
      const trail = trailAt(50);
      trail.track(80, 100);

      // Act
      trail.track(40, 100);

      // Assert- the drain starts from 53, not 80: one step takes it to 51.7.
      expect(trail.fillRate()).toBe(0.4);
      expect(trail.trailRate()).toBeCloseTo(0.517, 10);
      expect(trail.trend()).toBe(GaugeTrail.Trends.Loss);
    });

    it('carries on a drain already underway when a second loss lands', () =>
    {
      // Arrange- the first drain has reached 77 when the second hit lands.
      const trail = trailAt(80);
      trail.track(50, 100);

      // Act
      trail.track(30, 100);

      // Assert- the drain keeps going from 77 rather than starting over from the fill: one step takes it to 72.3.
      expect(trail.fillRate()).toBe(0.3);
      expect(trail.trailRate()).toBeCloseTo(0.723, 10);
    });

    it('turns a drain into a gain when the value rises back above the fill', () =>
    {
      // Arrange- a drain from 80 toward 50 is underway.
      const trail = trailAt(80);
      trail.track(50, 100);

      // Act
      trail.track(60, 100);

      // Assert- the trail now marks the new value, and the fill grows toward it.
      expect(trail.trailRate()).toBe(0.6);
      expect(trail.fillRate()).toBeCloseTo(0.51, 10);
      expect(trail.trend()).toBe(GaugeTrail.Trends.Gain);
    });

    it('settles when the value lands exactly on the fill, with nothing left to show', () =>
    {
      // Arrange- a gain toward 80 has filled to exactly 53.
      const trail = trailAt(50);
      trail.track(80, 100);

      // Act
      trail.track(53, 100);

      // Assert
      expect(trail.isSettled()).toBe(true);
      expect(trail.fillRate()).toBeCloseTo(0.53, 10);
      expect(trail.trailRate()).toBeCloseTo(0.53, 10);
    });

    it('follows a change in max without treating it as a change in value', () =>
    {
      // Arrange
      const trail = trailAt(50);

      // Act
      trail.track(50, 200);

      // Assert
      expect(trail.fillRate()).toBe(0.25);
      expect(trail.isSettled()).toBe(true);
    });
  });

  describe('rates', () =>
  {
    it('reach nowhere before any value has arrived', () =>
    {
      // Arrange
      const trail = new GaugeTrail();

      // Act
      const rates = [ trail.fillRate(), trail.trailRate() ];

      // Assert
      expect(rates).toEqual([ 0, 0 ]);
    });

    it('reach nowhere against a max of 0, even with a value on the gauge', () =>
    {
      // Arrange
      const trail = trailAt(5, 0);

      // Act
      const rates = [ trail.fillRate(), trail.trailRate() ];

      // Assert
      expect(rates).toEqual([ 0, 0 ]);
    });
  });

  describe('clear', () =>
  {
    it('forgets the last value, so the next one is taken as it is instead of shown as a change', () =>
    {
      // Arrange
      const trail = trailAt(80);

      // Act
      trail.clear();
      trail.track(20, 100);

      // Assert- no drain from 80: both ends sit at the new value.
      expect(trail.isSettled()).toBe(true);
      expect(trail.trailRate()).toBe(0.2);
      expect(trail.fillRate()).toBe(0.2);
    });
  });

  describe('hasObserved', () =>
  {
    it('reports nothing observed before the first value arrives', () =>
    {
      // Arrange
      const trail = new GaugeTrail();

      // Act
      const result = trail.hasObserved();

      // Assert
      expect(result).toBe(false);
    });

    it('reports a value observed once one has arrived', () =>
    {
      // Arrange
      const trail = trailAt(50);

      // Act
      const result = trail.hasObserved();

      // Assert
      expect(result).toBe(true);
    });
  });
});
//endregion plugins/_base/core/models/gauge-trail.test.js
