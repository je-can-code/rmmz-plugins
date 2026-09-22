//region plugins/weather/core/_component/weather-director.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installWeatherHostGlobals,
  setPluginContextToJWeather,
  setWeatherConfig,
} from '../../fixtures/install-weather-host-globals.js';

/**
 * Deciding what the weather is, with every piece downstream of the decision being the real one.
 *
 * The resolver, the preset table, the variable mirror and the note reader all go in unmocked, because
 * the director's whole job is holding those four together - a test that stubbed them would be
 * asserting that a function calls the functions it calls.
 */
describe('WeatherDirector', () =>
{
  let WeatherDirector;
  let written;

  const config = {
    motions: {
      fall: {
        edge: 'top',
        speedX: 0,
        speedY: 4,
        jitterX: 0,
        jitterY: 3,
        roll: 0,
        growth: 0,
        fadeIn: 25,
        staggerFrames: 120,
      },
    },
    presets: {
      rain: {
        stops: {
          light: [ { motion: 'fall', asset: 'Rain_01A', density: 150, speed: 100, scale: 100, blend: 'normal' } ],
          moderate: [
            { motion: 'fall', asset: 'Rain_01A', density: 450, speed: 100, scale: 100, blend: 'normal' },
            { motion: 'fall', asset: 'Rain_01B', density: 80, speed: 100, scale: 100, blend: 'additive' },
          ],
        },
      },
      motes: {
        stops: {
          moderate: [ { motion: 'fall', asset: 'Light_01A', density: 15, speed: 50, scale: 30, blend: 'additive' } ],
        },
      },
    },
    presetIds: {
      rain: 1,
      motes: 6,
    },
    intensityIds: {
      light: 1,
      moderate: 2,
    },
    variables: {
      enabled: true,
      weatherType: 41,
      weatherIntensity: 42,
    },
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    installWeatherHostGlobals();
    setWeatherConfig(config);
    setPluginContextToJWeather();

    ({ default: globalThis.RPGManager } =
      await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/weather/core/_metadata/initialization.js');

    ({ default: WeatherDirector } =
      await import('../../../../../src/plugins/weather/core/managers/WeatherDirector.js'));
  });

  beforeEach(() =>
  {
    written = new Map();
    globalThis.$gameVariables = {
      setValue: (id, value) => written.set(id, value),
    };

    // somewhere to be standing, since re-reading the sky re-reads the map underneath it.
    globalThis.$dataMap = {
      note: '',
      meta: {},
    };

    // somebody to be standing there, for the travel the spawn edges are chosen against.
    globalThis.$gamePlayer = {
      x: 0,
      y: 0,
    };

    // no sky by default; this plugin runs perfectly well without its time extension.
    WeatherDirector.setSky(null);
  });

  /**
   * Puts the player on a map with a given note.
   * @param {string} note What is typed in Map Properties.
   * @param {object} meta What RMMZ extracted from it.
   */
  const arriveAt = (note, meta = {}) =>
  {
    globalThis.$dataMap = {
      note,
      meta,
    };
  };

  describe('refresh', () =>
  {
    it('resolves the look a map authored', () =>
    {
      // Arrange - a cave that is emphatically not weatherless.
      arriveAt('<weather:motes>', { noToneChange: true });

      // Act.
      WeatherDirector.refresh();

      // Assert.
      expect(WeatherDirector.current())
        .toEqual({
          preset: 'motes',
          intensity: 'moderate',
        });
    });

    it('resolves to nothing on a sheltered map that authored none', () =>
    {
      // Arrange - an ordinary interior, which is most of the game.
      arriveAt('<noToneChange>', { noToneChange: true });

      // Act.
      WeatherDirector.refresh();

      // Assert.
      expect(WeatherDirector.current())
        .toBeNull();
    });

    it('mirrors the resolved weather into the variables events read', () =>
    {
      // Arrange.
      arriveAt('<weather:motes>', { noToneChange: true });

      // Act.
      WeatherDirector.refresh();

      // Assert - motes is declared 6, moderate is declared 2.
      expect(written.get(41))
        .toBe(6);
      expect(written.get(42))
        .toBe(2);
    });

    it('mirrors zeroes when the new map has no weather at all', () =>
    {
      // Arrange - walking out of the rain into a cellar. without this the last map's answer would
      // stand and every "is it raining" branch in the game would keep saying yes.
      arriveAt('<weather:motes>', { noToneChange: true });
      WeatherDirector.refresh();

      // Act.
      arriveAt('', { noToneChange: true });
      WeatherDirector.refresh();

      // Assert.
      expect(written.get(41))
        .toBe(0);
      expect(written.get(42))
        .toBe(0);
    });
  });

  describe('setSky', () =>
  {
    it('lets an untagged outdoor map follow the sky', () =>
    {
      // Arrange - a connecting corridor, which is the whole reason the fallback is automatic.
      arriveAt('');

      // Act.
      WeatherDirector.setSky({
        preset: 'rain',
        intensity: 'moderate',
      });

      // Assert.
      expect(WeatherDirector.current())
        .toEqual({
          preset: 'rain',
          intensity: 'moderate',
        });
    });

    it('re-resolves immediately rather than waiting for the next arrival', () =>
    {
      // Arrange - standing still outdoors while the hour turns over.
      arriveAt('');
      WeatherDirector.setSky({
        preset: 'rain',
        intensity: 'light',
      });

      // Act - the sky thickens under a player who has not moved.
      WeatherDirector.setSky({
        preset: 'rain',
        intensity: 'moderate',
      });

      // Assert - and the variables followed it without anybody arriving anywhere.
      expect(WeatherDirector.current().intensity)
        .toBe('moderate');
      expect(written.get(42))
        .toBe(2);
    });

    it('leaves an authored look alone while taking its strength from the sky', () =>
    {
      // Arrange - the Deluge Plains under a sky that is doing something else entirely.
      arriveAt('<weather:rain>');

      // Act.
      WeatherDirector.setSky({
        preset: 'motes',
        intensity: 'light',
      });

      // Assert - its own look, the sky's strength.
      expect(WeatherDirector.current())
        .toEqual({
          preset: 'rain',
          intensity: 'light',
        });
    });
  });

  describe('layers', () =>
  {
    it('hands back the layers of the current weather', () =>
    {
      // Arrange - moderate rain is two layers, beside a light stop that is one.
      arriveAt('<weather:rain>');
      WeatherDirector.setSky({
        preset: 'rain',
        intensity: 'moderate',
      });

      // Act.
      const result = WeatherDirector.layers();

      // Assert.
      expect(result)
        .toHaveLength(2);
      expect(result[0].asset)
        .toBe('Rain_01A');
      expect(result[1].blend)
        .toBe('additive');
    });

    it('hands back nothing at all when there is no weather', () =>
    {
      // Arrange.
      arriveAt('<noWeather>');
      WeatherDirector.refresh();

      // Act.
      const result = WeatherDirector.layers();

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });

  describe('trackPlayer', () =>
  {
    it('reports no travel from the first reading after arriving', () =>
    {
      // Arrange.
      arriveAt('<weather:rain>');
      WeatherDirector.refresh();
      globalThis.$gamePlayer = {
        x: 8,
        y: 12,
      };

      // Act.
      WeatherDirector.trackPlayer();

      // Assert.
      expect(WeatherDirector.travel())
        .toEqual({
          x: 0,
          y: 0,
        });
    });

    it('reports how far the player moved between two readings', () =>
    {
      // Arrange.
      arriveAt('<weather:rain>');
      WeatherDirector.refresh();
      globalThis.$gamePlayer = {
        x: 8,
        y: 12,
      };
      WeatherDirector.trackPlayer();

      // Act.
      globalThis.$gamePlayer = {
        x: 8.25,
        y: 11.5,
      };
      WeatherDirector.trackPlayer();

      // Assert.
      expect(WeatherDirector.travel())
        .toEqual({
          x: 0.25,
          y: -0.5,
        });
    });

    it('does not read an arrival somewhere else as a frame of running', () =>
    {
      // Arrange - walk a bit, so there is a reading to be wrongly carried across the transfer.
      arriveAt('<weather:rain>');
      WeatherDirector.refresh();
      globalThis.$gamePlayer = {
        x: 8,
        y: 12,
      };
      WeatherDirector.trackPlayer();
      globalThis.$gamePlayer = {
        x: 8.25,
        y: 12,
      };
      WeatherDirector.trackPlayer();

      // Act - land on the far side of a different map.
      arriveAt('<weather:motes>');
      WeatherDirector.refresh();
      globalThis.$gamePlayer = {
        x: 60,
        y: 44,
      };
      WeatherDirector.trackPlayer();

      // Assert.
      expect(WeatherDirector.travel())
        .toEqual({
          x: 0,
          y: 0,
        });
    });
  });

  describe('isSameWeather', () =>
  {
    it('calls two bare places the same', () =>
    {
      // Arrange & Act.
      const result = WeatherDirector.isSameWeather(null, null);

      // Assert - walking between two interiors is not a change of weather, and treating it as one
      // would rebuild an empty plane on every doorway.
      expect(result)
        .toBe(true);
    });

    it('calls a bare place and a rainy one different', () =>
    {
      // Arrange & Act.
      const result = WeatherDirector.isSameWeather(null, { preset: 'rain', intensity: 'light' });

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('calls a rainy place and a bare one different', () =>
    {
      // Arrange - the mirror, because null on either side is a separate branch and only one of
      // them is the one an author writes first.
      const result = WeatherDirector.isSameWeather({ preset: 'rain', intensity: 'light' }, null);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('calls two separately-built descriptions of one weather the same', () =>
    {
      // Arrange - two distinct objects holding identical values, which is exactly what the
      // resolver produces on consecutive calls. Compared by identity these differ, and the
      // emitter would tear itself down and rebuild sixty times a second.
      const left = { preset: 'rain', intensity: 'moderate' };
      const right = { preset: 'rain', intensity: 'moderate' };

      // Act.
      const result = WeatherDirector.isSameWeather(left, right);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('notices the look changing while the strength holds', () =>
    {
      // Arrange.
      const left = { preset: 'rain', intensity: 'moderate' };
      const right = { preset: 'snow', intensity: 'moderate' };

      // Act.
      const result = WeatherDirector.isSameWeather(left, right);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('notices the strength changing while the look holds', () =>
    {
      // Arrange - the case a comparison on the preset alone would miss, and the commoner of the
      // two: the sky drifts a rung far more often than it changes condition.
      const left = { preset: 'rain', intensity: 'moderate' };
      const right = { preset: 'rain', intensity: 'heavy' };

      // Act.
      const result = WeatherDirector.isSameWeather(left, right);

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('generation', () =>
  {
    it('moves when the weather becomes something else', () =>
    {
      // Arrange.
      arriveAt('<weather:rain>');
      WeatherDirector.refresh();
      const before = WeatherDirector.generation();

      // Act.
      arriveAt('<weather:motes>');
      WeatherDirector.refresh();

      // Assert.
      expect(WeatherDirector.generation())
        .toBe(before + 1);
    });

    it('stays put when the same place is resolved again', () =>
    {
      // Arrange - the resolver hands back a fresh object every call, so an identity comparison
      // would move the number here and rebuild the whole emitter on every frame that asked.
      arriveAt('<weather:rain>');
      WeatherDirector.refresh();
      const before = WeatherDirector.generation();

      // Act.
      WeatherDirector.refresh();

      // Assert.
      expect(WeatherDirector.generation())
        .toBe(before);
    });

    it('stays put walking between two places with the same weather', () =>
    {
      // Arrange - two different maps that happen to resolve identically, which is most of a region.
      arriveAt('<weather:rain>');
      WeatherDirector.refresh();
      const before = WeatherDirector.generation();

      // Act.
      arriveAt('<weather:rain>\n<someOtherTag>');
      WeatherDirector.refresh();

      // Assert.
      expect(WeatherDirector.generation())
        .toBe(before);
    });
  });

  describe('hasChangedSince', () =>
  {
    it('reports nothing new to a caller holding the current generation', () =>
    {
      // Arrange - what the emitter holds on every frame after the one it was built on.
      arriveAt('<weather:rain>');
      WeatherDirector.refresh();

      // Act.
      const result = WeatherDirector.hasChangedSince(WeatherDirector.generation());

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('reports a change to a caller holding an older generation', () =>
    {
      // Arrange.
      arriveAt('<weather:rain>');
      WeatherDirector.refresh();
      const built = WeatherDirector.generation();

      // Act.
      arriveAt('<weather:motes>');
      WeatherDirector.refresh();

      // Assert.
      expect(WeatherDirector.hasChangedSince(built))
        .toBe(true);
    });
  });
});
//endregion plugins/weather/core/_component/weather-director.test.js