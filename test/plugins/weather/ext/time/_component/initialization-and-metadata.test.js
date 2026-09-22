//region plugins/weather/ext/time/_component/initialization-and-metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installWeatherHostGlobals } from '../../../fixtures/install-weather-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

/**
 * The J umbrella as J-Base built it, captured once and handed back before every test.
 *
 * J-Base's bootstrap can only run once per realm - it finishes by making `Array.empty`
 * non-configurable, and evaluating it twice dies on "Cannot redefine property". So it is built a
 * single time, and any case that lowers a recorded version undoes that here rather than by
 * re-importing.
 * @type {Object}
 */
let realJ;

/**
 * Booting J-Weather-Time, and what it takes off the configuration on the way up.
 *
 * **Three version gates rather than one**, and each is tested at the boundary rather than at some
 * comfortably old value. A floor that is never tested one patch below itself is a floor nobody has
 * proven holds.
 */
describe('J-Weather-Time initialization and metadata (direct src import)', () =>
{
  /**
   * A whole weather configuration, as the parent plugin would have parsed it.
   * @returns {object}
   */
  const buildWeatherConfig = () => ({
    presets: { 'calm-preset': {} },
    presetIds: { 'calm-preset': 1 },
    climates: { muted: { byIntensity: { light: 'light' } } },
    sky: {
      types: { calm: { preset: 'calm-preset' } },
      seasons: { wet: { allowed: [ 'calm' ], transitions: { calm: { calm: 100 } } } },
      settleTo: 'calm',
      forecastPhases: 12,
    },
  });

  /**
   * Stands the two parent plugins up at whatever versions a case needs.
   * @param {string} weatherVersion What J-Weather reports.
   * @param {string} timeVersion What J-TIME reports.
   * @param {object} weatherConfig What J-Weather parsed.
   */
  const installParents = (weatherVersion, timeVersion, weatherConfig) =>
  {
    globalThis.J.WEATHER = {
      EXT: {},
      Metadata: {
        version: { version: () => weatherVersion },
        weatherConfig,
      },
    };
    globalThis.J.TIME = { Metadata: { version: { version: () => timeVersion } } };
  };

  beforeAll(async () =>
  {
    installWeatherHostGlobals();

    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.18.0';
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    // drop only this ship's half of the module graph; J-Base's evaluated modules stay put.
    vi.resetModules();

    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.18.0';
    delete globalThis.J.WEATHER;
    delete globalThis.J.TIME;

    // PluginMetadata refuses a duplicate plugin name on a private static registry, so a fresh copy
    // of the class is what lets this ship's metadata be constructed more than once in one file.
    const { default: FreshPluginMetadata } =
      await import('../../../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;
    installPluginManagerWithParams(globalThis, 'J-Weather-Time', {});

    globalThis.__PLUGIN_NAME__ = 'J-Weather-Time';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
  });

  describe('version gates', () =>
  {
    it('loads when every parent is exactly the required version', async () =>
    {
      // Arrange.
      installParents('1.0.0', '1.0.0', buildWeatherConfig());

      // Act.
      await import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Assert.
      expect(globalThis.J.WEATHER.EXT.TIME.Metadata.name)
        .toBe('J-Weather-Time');
    });

    it('loads when every parent is newer than required', async () =>
    {
      // Arrange.
      globalThis.J.BASE.Metadata.Version = '9.9.9';
      installParents('9.9.9', '9.9.9', buildWeatherConfig());

      // Act.
      await import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Assert.
      expect(globalThis.J.WEATHER.EXT.TIME.Metadata.name)
        .toBe('J-Weather-Time');
    });

    it('refuses to load against a J-Base older than it needs', async () =>
    {
      // Arrange - one patch below the floor, which is the boundary the gate exists to hold.
      globalThis.J.BASE.Metadata.Version = '3.17.9';
      installParents('1.0.0', '1.0.0', buildWeatherConfig());

      // Act.
      const attempt = import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Assert.
      await expect(attempt)
        .rejects
        .toThrow(/J-Base/);
    });

    it('refuses to load against a J-Weather older than it needs', async () =>
    {
      // Arrange - J-Base and J-TIME are both fine, so only the weather gate can be rejecting.
      installParents('0.9.9', '1.0.0', buildWeatherConfig());

      // Act.
      const attempt = import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Assert.
      await expect(attempt)
        .rejects
        .toThrow(/J-Weather/);
    });

    it('refuses to load against a J-TIME older than it needs', async () =>
    {
      // Arrange.
      installParents('1.0.0', '0.9.9', buildWeatherConfig());

      // Act.
      const attempt = import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Assert.
      await expect(attempt)
        .rejects
        .toThrow(/J-TIME/);
    });
  });

  describe('the climate tag', () =>
  {
    it('reads the name out of a climate tag', async () =>
    {
      // Arrange.
      installParents('1.0.0', '1.0.0', buildWeatherConfig());
      await import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Act.
      const [ , name ] = globalThis.J.WEATHER.EXT.TIME.RegExp.Climate.exec('<climate:dreaming>');

      // Assert.
      expect(name)
        .toBe('dreaming');
    });

    it('tolerates the one optional space after the colon', async () =>
    {
      // Arrange - every tag in this ecosystem allows exactly one, and an author will type it.
      installParents('1.0.0', '1.0.0', buildWeatherConfig());
      await import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Act.
      const [ , name ] = globalThis.J.WEATHER.EXT.TIME.RegExp.Climate.exec('<climate: dreaming>');

      // Assert.
      expect(name)
        .toBe('dreaming');
    });

    it('does not match a note box that says nothing about a climate', async () =>
    {
      // Arrange - a real weather tag beside it, so this cannot pass by matching nothing ever.
      installParents('1.0.0', '1.0.0', buildWeatherConfig());
      await import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Act.
      const result = globalThis.J.WEATHER.EXT.TIME.RegExp.Climate.test('<weather:fog>');

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('metadata', () =>
  {
    it('takes the sky off the configuration the parent already parsed', async () =>
    {
      // Arrange - loading the file twice would mean two copies that can disagree, so this asserts
      // the block arrived rather than that a loader ran.
      const weatherConfig = buildWeatherConfig();
      installParents('1.0.0', '1.0.0', weatherConfig);

      // Act.
      await import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Assert - the very same object, not a copy of it.
      expect(globalThis.J.WEATHER.EXT.TIME.Metadata.sky)
        .toBe(weatherConfig.sky);
    });

    it('takes the climates off the same configuration', async () =>
    {
      // Arrange.
      const weatherConfig = buildWeatherConfig();
      installParents('1.0.0', '1.0.0', weatherConfig);

      // Act.
      await import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Assert.
      expect(globalThis.J.WEATHER.EXT.TIME.Metadata.climates)
        .toBe(weatherConfig.climates);
    });

    it('says so at boot when the authored sky is wrong', async () =>
    {
      // Arrange - a face naming a preset that does not exist, which draws nothing on one
      // particular afternoon of one particular season and never throws.
      const weatherConfig = buildWeatherConfig();
      weatherConfig.sky.types.calm.preset = 'ghost-preset';
      installParents('1.0.0', '1.0.0', weatherConfig);
      const warn = vi.spyOn(Diagnostics, 'warn')
        .mockImplementation(() =>
        {});

      // Act.
      await import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Assert - boot is the only moment somebody is still looking at the console.
      expect(warn)
        .toHaveBeenCalledWith('J-Weather-Time', 'the sky names preset [ghost-preset], which does not exist.');

      warn.mockRestore();
    });

    it('says nothing at boot about a sky that is correct', async () =>
    {
      // Arrange.
      installParents('1.0.0', '1.0.0', buildWeatherConfig());
      const warn = vi.spyOn(Diagnostics, 'warn')
        .mockImplementation(() =>
        {});

      // Act.
      await import('../../../../../../src/plugins/weather/ext/time/_metadata/initialization.js');

      // Assert.
      expect(warn)
        .not
        .toHaveBeenCalled();

      warn.mockRestore();
    });
  });
});
//endregion plugins/weather/ext/time/_component/initialization-and-metadata.test.js