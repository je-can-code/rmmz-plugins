//region plugins/weather/_component/initialization-version-gate.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { installWeatherHostGlobals, setPluginContextToJWeather } from '../fixtures/install-weather-host-globals.js';

/**
 * The J umbrella as J-Base built it, captured once and handed back before every test.
 *
 * J-Base's bootstrap can only run once per realm - it finishes by making `Array.empty`
 * non-configurable, and evaluating it twice dies on "Cannot redefine property". So it is built a
 * single time, and any case that lowers the recorded version undoes that here rather than by
 * re-importing.
 * @type {Object}
 */
let realJ;

describe('J-Weather initialization version gate (direct src import)', () =>
{
  beforeAll(async () =>
  {
    installWeatherHostGlobals();

    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.18.0';
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    realJ = globalThis.J;
  });

  beforeEach(async () =>
  {
    // drop only the weather half of the module graph; J-Base's evaluated modules stay put.
    vi.resetModules();

    globalThis.J = realJ;
    globalThis.J.BASE.Metadata.Version = '3.18.0';
    delete globalThis.J.WEATHER;

    // PluginMetadata refuses a duplicate plugin name on a private static registry, so a fresh copy of
    // the class is what lets this ship's metadata be constructed more than once in one file.
    const { default: FreshPluginMetadata } =
      await import('../../../../src/plugins/_base/core/models/PluginMetadata.js');
    globalThis.PluginMetadata = FreshPluginMetadata;

    setPluginContextToJWeather();
  });

  it('loads when J-Base is exactly the required version', async () =>
  {
    // Arrange
    globalThis.J.BASE.Metadata.Version = '3.18.0';

    // Act
    await import('../../../../src/plugins/weather/core/_metadata/initialization.js');

    // Assert
    expect(globalThis.J.WEATHER.Metadata.name)
      .toBe('J-Weather');
  });

  it('loads when J-Base is newer than required', async () =>
  {
    // Arrange
    globalThis.J.BASE.Metadata.Version = '9.9.9';

    // Act
    await import('../../../../src/plugins/weather/core/_metadata/initialization.js');

    // Assert
    expect(globalThis.J.WEATHER.Metadata.name)
      .toBe('J-Weather');
  });

  it('refuses to load against a J-Base older than it needs', async () =>
  {
    // Arrange - one patch below the floor, which is the boundary the gate exists to hold.
    globalThis.J.BASE.Metadata.Version = '3.17.9';

    // Act
    const attempt = import('../../../../src/plugins/weather/core/_metadata/initialization.js');

    // Assert
    await expect(attempt)
      .rejects
      .toThrow(/J-Base/);
  });
});
//endregion plugins/weather/_component/initialization-version-gate.test.js