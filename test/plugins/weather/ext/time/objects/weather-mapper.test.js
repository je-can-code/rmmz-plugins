//region plugins/weather/ext/time/objects/weather-mapper.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Turning a page comment into the weather requirement it declares.
 *
 * The parent plugin's own numbering goes in unmocked, because the whole point of resolving names
 * through `presetIds` is that a tag and the weather variable can never mean different things - and
 * a stubbed lookup would prove nothing about that.
 */
describe('WeatherMapper', () =>
{
  let WeatherMapper;

  const weatherConfig = {
    presetIds: {
      rain: 1,
      snow: 2,
    },
    intensityIds: {
      light: 1,
      moderate: 2,
      heavy: 3,
    },
  };

  beforeEach(async () =>
  {
    vi.resetModules();

    String.empty = '';
    globalThis.__PLUGIN_NAME__ = 'J-Weather-Time';

    globalThis.J = {
      WEATHER: {
        Metadata: { weatherConfig },
        EXT: {
          TIME: {
            RegExp: {
              WeatherTypePage: /<weatherTypePage:[ ]?([a-zA-Z0-9_-]+)>/i,
              WeatherIntensityPage: /<weatherIntensityPage:[ ]?([a-zA-Z0-9_-]+)>/i,
              WeatherIntensityRangePage: /<weatherIntensityRangePage:[ ]?([a-zA-Z0-9]+)-([a-zA-Z0-9]+)>/i,
            },
          },
        },
      },
    };

    ({ default: globalThis.WeatherVariables } =
      await import('../../../../../../src/plugins/weather/core/core/WeatherVariables.js'));

    ({ default: WeatherMapper } =
      await import('../../../../../../src/plugins/weather/ext/time/objects/WeatherMapper.js'));
  });

  describe('isWeatherComment', () =>
  {
    it('recognises a look requirement', () =>
    {
      // Act.
      const result = WeatherMapper.isWeatherComment('<weatherTypePage:rain>');

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('does not recognise an ordinary note', () =>
    {
      // Arrange - a comment that looks tag-shaped but belongs to another plugin entirely, which
      // is what a real event page is full of.
      const result = WeatherMapper.isWeatherComment('<timeOfDayPage:night>');

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('toConditional', () =>
  {
    it('declares nothing for a comment that is not a weather tag', () =>
    {
      // Act.
      const result = WeatherMapper.toConditional('just a note to myself');

      // Assert.
      expect(result)
        .toBeNull();
    });

    it('reads a look requirement', () =>
    {
      // Act.
      const result = WeatherMapper.toConditional('<weatherTypePage:snow>');

      // Assert - snow is 2 in this config, which is the number the variable mirror also writes.
      expect(result.typeId())
        .toBe(2);
    });

    it('reads a strength requirement as a span with equal ends', () =>
    {
      // Act.
      const result = WeatherMapper.toConditional('<weatherIntensityPage:moderate>');

      // Assert.
      expect(result.minIntensity())
        .toBe(2);
      expect(result.maxIntensity())
        .toBe(2);
    });

    it('reads a span of strengths', () =>
    {
      // Act.
      const result = WeatherMapper.toConditional('<weatherIntensityRangePage:light-heavy>');

      // Assert.
      expect(result.minIntensity())
        .toBe(1);
      expect(result.maxIntensity())
        .toBe(3);
    });
  });

  describe('typeIdOf', () =>
  {
    it('resolves a name through the shared numbering', () =>
    {
      // Act.
      const result = WeatherMapper.typeIdOf('snow');

      // Assert.
      expect(result)
        .toBe(2);
    });

    it('takes a number as written', () =>
    {
      // Arrange - a different number from any name in this fixture, so "parsed the number" and
      // "looked something up" are distinguishable.
      const result = WeatherMapper.typeIdOf('7');

      // Assert.
      expect(result)
        .toBe(7);
    });

    it('reports a name nothing is numbered for', () =>
    {
      // Arrange - a preset that draws fine but was never given an id, which would otherwise make
      // every page gated on it read the world as having no weather.
      const warn = vi.spyOn(Diagnostics, 'warn')
        .mockImplementation(() =>
        {});

      // Act.
      const result = WeatherMapper.typeIdOf('hurricane');

      // Assert.
      expect(result)
        .toBe(0);
      expect(warn)
        .toHaveBeenCalled();

      warn.mockRestore();
    });
  });

  describe('intensityIdOf', () =>
  {
    it('resolves a name through the shared numbering', () =>
    {
      // Act.
      const result = WeatherMapper.intensityIdOf('heavy');

      // Assert.
      expect(result)
        .toBe(3);
    });

    it('takes a number as written', () =>
    {
      // Arrange - outside the three real rungs, so this cannot be a lookup that happened to agree.
      const result = WeatherMapper.intensityIdOf('9');

      // Assert.
      expect(result)
        .toBe(9);
    });
  });
});
//endregion plugins/weather/ext/time/objects/weather-mapper.test.js