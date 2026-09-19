//region plugins/weather/core/core/player-travel.test.js
import { describe, expect, it } from 'vitest';
import PlayerTravel from '../../../../../src/plugins/weather/core/core/PlayerTravel.js';

/**
 * Measuring how far the player moved across a frame.
 *
 * Every case moves the two axes by different amounts, and usually in different directions, because
 * a tracker that reported one axis for both would otherwise agree with a suite that only ever
 * walked in straight lines.
 */
describe('PlayerTravel', () =>
{
  describe('sample', () =>
  {
    it('reports no movement from a first sample, having nothing to measure against', () =>
    {
      // Arrange.
      const travel = new PlayerTravel();

      // Act.
      travel.sample(10, 20);

      // Assert.
      expect(travel.perFrame())
        .toEqual({
          x: 0,
          y: 0,
        });
    });

    it('reports the distance covered between two samples', () =>
    {
      // Arrange.
      const travel = new PlayerTravel();
      travel.sample(10, 20);

      // Act.
      travel.sample(10.25, 19.5);

      // Assert - rightward and upward, so a sign dropped on either axis shows up here.
      expect(travel.perFrame())
        .toEqual({
          x: 0.25,
          y: -0.5,
        });
    });

    it('measures from the most recent sample rather than the first', () =>
    {
      // Arrange.
      const travel = new PlayerTravel();
      travel.sample(10, 20);
      travel.sample(11, 21);

      // Act.
      travel.sample(11.5, 23);

      // Assert - measuring from the original 10,20 would report 1.5 and 3 instead.
      expect(travel.perFrame())
        .toEqual({
          x: 0.5,
          y: 2,
        });
    });
  });

  describe('perFrame', () =>
  {
    it('hands back a fresh object each time, so a caller cannot be changed underneath', () =>
    {
      // Arrange.
      const travel = new PlayerTravel();
      travel.sample(10, 20);
      travel.sample(12, 20);
      const held = travel.perFrame();

      // Act.
      travel.sample(20, 20);

      // Assert - the reading taken earlier still says what it said when it was taken.
      expect(held)
        .toEqual({
          x: 2,
          y: 0,
        });
    });
  });

  describe('forget', () =>
  {
    it('makes the next sample a fresh baseline instead of a measurement', () =>
    {
      // Arrange.
      const travel = new PlayerTravel();
      travel.sample(10, 20);
      travel.sample(12, 20);

      // Act - a transfer to the far side of the map, which is not a speed.
      travel.forget();
      travel.sample(90, 80);

      // Assert.
      expect(travel.perFrame())
        .toEqual({
          x: 0,
          y: 0,
        });
    });

    it('clears the movement it was already reporting', () =>
    {
      // Arrange.
      const travel = new PlayerTravel();
      travel.sample(10, 20);
      travel.sample(12, 23);

      // Act.
      travel.forget();

      // Assert - nothing has been sampled since, so the last reading must not still stand.
      expect(travel.perFrame())
        .toEqual({
          x: 0,
          y: 0,
        });
    });

    it('measures normally again once a new baseline has been taken', () =>
    {
      // Arrange.
      const travel = new PlayerTravel();
      travel.sample(10, 20);
      travel.forget();
      travel.sample(90, 80);

      // Act.
      travel.sample(89, 80.5);

      // Assert.
      expect(travel.perFrame())
        .toEqual({
          x: -1,
          y: 0.5,
        });
    });
  });
});
//endregion plugins/weather/core/core/player-travel.test.js