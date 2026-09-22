//region plugins/weather/ext/time/_metadata/plugin-commands.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * The two ways an event can reach the forecast.
 *
 * The scene and the place cache are both stood in for, because what is being tested is the
 * wiring: that a command exists under the right name and reaches the right thing. Whether the
 * scene draws correctly is the scene's business.
 */
describe('J-Weather-Time plugin commands (direct src import)', () =>
{
  let handlers;
  let FakeSceneForecast;
  let FakeForecastPlaces;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeSceneForecast = { callScene: vi.fn() };
    FakeForecastPlaces = { forget: vi.fn() };
    vi.doMock(
      '../../../../../../src/plugins/weather/ext/time/scenes/Scene_DebugForecast.js',
      () => ({ default: FakeSceneForecast }));
    vi.doMock(
      '../../../../../../src/plugins/weather/ext/time/core/ForecastPlaces.js',
      () => ({ default: FakeForecastPlaces }));

    globalThis.J = { WEATHER: { EXT: { TIME: { Metadata: { name: 'J-Weather-Time' } } } } };

    handlers = {};
    globalThis.PluginManager = {
      registerCommand: vi.fn((pluginName, commandName, handler) =>
      {
        handlers[commandName] = handler;
      }),
    };

    await import('../../../../../../src/plugins/weather/ext/time/_metadata/pluginCommands.js');
  });

  it('registers both commands', () =>
  {
    // Arrange & Act - registration happened on import.

    // Assert - the names have to match the `@command` blocks in the annotations exactly, or the
    // command shows in the editor and does nothing when it fires.
    expect(Object.keys(handlers))
      .toEqual([ 'showDebugForecast', 'refreshForecastPlaces' ]);
  });

  it('registers them under this plugin name rather than the parent', () =>
  {
    // Arrange & Act.

    // Assert - a command registered against J-Weather would never be found; the editor looks it
    // up by the ship that declared it.
    expect(PluginManager.registerCommand)
      .toHaveBeenCalledWith('J-Weather-Time', 'showDebugForecast', expect.any(Function));
  });

  it('showDebugForecast opens the forecast scene', () =>
  {
    // Act.
    handlers.showDebugForecast();

    // Assert.
    expect(FakeSceneForecast.callScene)
      .toHaveBeenCalledTimes(1);
  });

  it('refreshForecastPlaces drops what was read off disk', () =>
  {
    // Act.
    handlers.refreshForecastPlaces();

    // Assert.
    expect(FakeForecastPlaces.forget)
      .toHaveBeenCalledTimes(1);
  });
});
//endregion plugins/weather/ext/time/_metadata/plugin-commands.test.js