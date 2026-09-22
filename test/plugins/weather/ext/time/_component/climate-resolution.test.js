//region plugins/weather/ext/time/_component/climate-resolution.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installWeatherHostGlobals, setPluginContextToJWeather } from '../../../fixtures/install-weather-host-globals.js';

/**
 * A climate reaching a real map declaration, through the real core resolver.
 *
 * **Nothing downstream is mocked.** The core resolver, the note reader and the curve all go in
 * unmocked, because the thing worth proving is that aliasing a *static* on another ship actually
 * takes effect in the place that calls it. A test that stubbed the resolver would prove only that
 * a function calls the function it calls, and would pass just as happily if the alias never
 * attached.
 */
describe('climate resolution through the core resolver', () =>
{
  let MapWeatherResolver;

  const climates = {
    dreaming: {
      byType: {
        clear: 'heavy',
        overcast: 'light',
      },
      default: 'moderate',
    },
  };

  /**
   * A map as RMMZ hands it over, with its note already parsed into meta.
   * @param {string} note What the note box says.
   * @param {object} meta What RMMZ made of it.
   * @returns {object}
   */
  const mapOf = (note, meta = {}) => ({
    note,
    meta,
  });

  beforeEach(async () =>
  {
    vi.resetModules();

    installWeatherHostGlobals();
    setPluginContextToJWeather();

    ({ default: globalThis.RPGManager } =
      await import('../../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    // the parent ship's tags and the resolver it defines, both as the hoisted globals they are at
    // runtime rather than as imports.
    globalThis.J.WEATHER = {
      EXT: {},
      RegExp: {
        Weather: /<weather:[ ]?([a-zA-Z][a-zA-Z0-9_-]*)>/i,
        NoWeather: /<noWeather>/i,
      },
    };

    ({ default: globalThis.MapWeatherResolver } =
      await import('../../../../../../src/plugins/weather/core/core/MapWeatherResolver.js'));

    globalThis.J.WEATHER.EXT.TIME = {
      Metadata: { climates },
      Aliased: { MapWeatherResolver: new Map() },
      RegExp: { Climate: /<climate:[ ]?([a-zA-Z][a-zA-Z0-9_-]*)>/i },
    };
    globalThis.__PLUGIN_NAME__ = 'J-Weather-Time';

    // and now the extension, which reassigns two statics on the class captured above.
    await import('../../../../../../src/plugins/weather/ext/time/core/MapWeatherResolver.js');

    ({ MapWeatherResolver } = globalThis);
  });

  describe('declarationFor', () =>
  {
    it('reads a climate off the note alongside everything core already read', () =>
    {
      // Arrange - both tags at once, because the extension must add to the declaration rather
      // than replace it.
      const dataMap = mapOf('<weather:fog>\n<climate:dreaming>');

      // Act.
      const result = MapWeatherResolver.declarationFor(dataMap);

      // Assert.
      expect(result)
        .toEqual({
          suppressed: false,
          preset: 'fog',
          hasSky: true,
          climate: 'dreaming',
        });
    });

    it('reports no climate for a map that named none', () =>
    {
      // Arrange - a real weather tag, so this cannot pass by finding nothing in an empty note.
      const dataMap = mapOf('<weather:fog>');

      // Act.
      const result = MapWeatherResolver.declarationFor(dataMap);

      // Assert.
      expect(result.climate)
        .toBeNull();
    });
  });

  describe('resolve', () =>
  {
    it('bends an authored look through the climate the map named', () =>
    {
      // Arrange - the Forest of Dreams under the lightest possible clear sky. This is the whole
      // feature: the fog is heavy *because* the sky is clear.
      const dataMap = mapOf('<weather:fog>\n<climate:dreaming>');
      const declaration = MapWeatherResolver.declarationFor(dataMap);
      const sky = { preset: 'clear', intensity: 'light', type: 'clear' };

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert - the preset is still the map's own; only the strength was bent.
      expect(result)
        .toEqual({
          preset: 'fog',
          intensity: 'heavy',
        });
    });

    it('thins the same place when the sky clouds over', () =>
    {
      // Arrange - the near miss: same map, same tag, a different condition overhead. Without this
      // the climate could be returning a constant.
      const dataMap = mapOf('<weather:fog>\n<climate:dreaming>');
      const declaration = MapWeatherResolver.declarationFor(dataMap);
      const sky = { preset: 'clouds', intensity: 'heavy', type: 'overcast' };

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert.
      expect(result.intensity)
        .toBe('light');
    });

    it('leaves a map with no climate following the sky exactly', () =>
    {
      // Arrange - the Deluge Plains, which authored a look and answers the sky directly.
      const dataMap = mapOf('<weather:rain>');
      const declaration = MapWeatherResolver.declarationFor(dataMap);
      const sky = { preset: 'clear', intensity: 'light', type: 'clear' };

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert.
      expect(result)
        .toEqual({
          preset: 'rain',
          intensity: 'light',
        });
    });

    it('does nothing for a climate on a map that authored no look of its own', () =>
    {
      // Arrange - an untagged outdoor map. Core returns the sky's own preset and strength from a
      // branch that never consults the strength resolver, so the alias is simply not on that
      // path. Documented as the intended shape rather than discovered later as a bug.
      const dataMap = mapOf('<climate:dreaming>');
      const declaration = MapWeatherResolver.declarationFor(dataMap);
      const sky = { preset: 'clear', intensity: 'light', type: 'clear' };

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert - the sky, untouched, rather than the heavy the climate would have asked for.
      expect(result)
        .toEqual({
          preset: 'clear',
          intensity: 'light',
        });
    });

    it('still draws nothing on a map that opted out entirely', () =>
    {
      // Arrange - the opt-out outranks everything, and a climate does not rescue it.
      const dataMap = mapOf('<noWeather>\n<climate:dreaming>');
      const declaration = MapWeatherResolver.declarationFor(dataMap);
      const sky = { preset: 'clear', intensity: 'light', type: 'clear' };

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert.
      expect(result)
        .toBeNull();
    });
  });
});
//endregion plugins/weather/ext/time/_component/climate-resolution.test.js