//region plugins/weather/core/core/weather-variables.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import WeatherVariables from '../../../../../src/plugins/weather/core/core/WeatherVariables.js';

/**
 * Mirroring the current weather into the variables events branch on.
 *
 * The fixture declares ids that are deliberately **not** in any order a positional scheme would
 * produce - rain is 1, snow is 7, fog is 4 - so a lookup that quietly used array position instead of
 * the declared number cannot accidentally agree with these assertions.
 */
describe('WeatherVariables', () =>
{
  beforeAll(() =>
  {
    globalThis.__PLUGIN_NAME__ = 'J-Weather';
  });

  const config = {
    presetIds: {
      rain: 1,
      fog: 4,
      snow: 7,
    },
    intensityIds: {
      light: 1,
      moderate: 2,
      heavy: 3,
    },
    variables: {
      enabled: true,
      weatherType: 41,
      weatherIntensity: 42,
    },
  };

  describe('idsFor', () =>
  {
    it('numbers a resolved weather by its declared ids', () =>
    {
      // Arrange & Act - snow is declared 7, which nothing positional would produce for the third key.
      const result = WeatherVariables.idsFor(config, {
        preset: 'snow',
        intensity: 'heavy',
      });

      // Assert.
      expect(result)
        .toEqual({
          weatherType: 7,
          weatherIntensity: 3,
        });
    });

    it('numbers a different weather differently', () =>
    {
      // Arrange & Act - the near-miss: a second real preset, so "looked it up" can be told apart
      // from "returned the only thing it had".
      const result = WeatherVariables.idsFor(config, {
        preset: 'fog',
        intensity: 'light',
      });

      // Assert.
      expect(result)
        .toEqual({
          weatherType: 4,
          weatherIntensity: 1,
        });
    });

    it('zeroes both numbers when there is no weather at all', () =>
    {
      // Arrange & Act - an interior. both must be written, not merely left alone, or walking in out
      // of the rain leaves every "is it raining" branch still answering yes.
      const result = WeatherVariables.idsFor(config, null);

      // Assert.
      expect(result)
        .toEqual({
          weatherType: 0,
          weatherIntensity: 0,
        });
    });
  });

  describe('typeIdFor', () =>
  {
    it('reports a preset that was never given a number', () =>
    {
      // Arrange - a real authoring gap: it draws fine and every event thinks the place is clear.
      const warn = vi.spyOn(globalThis.Diagnostics, 'warn')
        .mockImplementation(() => {});

      // Act.
      const result = WeatherVariables.typeIdFor(config, 'embers');

      // Assert.
      expect(result)
        .toBe(0);
      expect(warn)
        .toHaveBeenCalledTimes(1);

      warn.mockRestore();
    });
  });

  describe('intensityIdFor', () =>
  {
    it('reports a strength that was never given a number', () =>
    {
      // Arrange - what adding a fourth rung to a preset without numbering it would produce.
      const warn = vi.spyOn(globalThis.Diagnostics, 'warn')
        .mockImplementation(() => {});

      // Act.
      const result = WeatherVariables.intensityIdFor(config, 'extreme');

      // Assert.
      expect(result)
        .toBe(0);
      expect(warn)
        .toHaveBeenCalledTimes(1);

      warn.mockRestore();
    });
  });

  describe('sync', () =>
  {
    let written;

    beforeEach(() =>
    {
      written = new Map();
      globalThis.$gameVariables = {
        setValue: (id, value) => written.set(id, value),
      };
    });

    it('writes both variables at the ids configuration named', () =>
    {
      // Arrange & Act.
      WeatherVariables.sync(config, {
        preset: 'rain',
        intensity: 'moderate',
      });

      // Assert - the configured slots, not slots one and two.
      expect(written.get(41))
        .toBe(1);
      expect(written.get(42))
        .toBe(2);
    });

    it('writes zeroes rather than skipping when there is no weather', () =>
    {
      // Arrange - previously rainy, now indoors.
      WeatherVariables.sync(config, {
        preset: 'rain',
        intensity: 'moderate',
      });

      // Act.
      WeatherVariables.sync(config, null);

      // Assert.
      expect(written.get(41))
        .toBe(0);
      expect(written.get(42))
        .toBe(0);
    });

    it('writes nothing at all when the mirror is switched off', () =>
    {
      // Arrange - a game that does not branch on weather should not have two variables commandeered.
      const disabled = {
        ...config,
        variables: {
          enabled: false,
          weatherType: 41,
          weatherIntensity: 42,
        },
      };

      // Act.
      WeatherVariables.sync(disabled, {
        preset: 'rain',
        intensity: 'moderate',
      });

      // Assert.
      expect(written.size)
        .toBe(0);
    });
  });
});
//endregion plugins/weather/core/core/weather-variables.test.js