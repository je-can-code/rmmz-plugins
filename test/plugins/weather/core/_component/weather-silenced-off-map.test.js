//region plugins/weather/core/_component/weather-silenced-off-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  installWeatherHostGlobals,
  setPluginContextToJWeather,
  setWeatherConfig,
} from '../../fixtures/install-weather-host-globals.js';

/**
 * The weather going quiet at every moment the engine silences the map's own background sound: a game over,
 * the title screen, and a battle beginning.
 *
 * The weather plays on a channel of its own that `AudioManager` has never heard of, so the engine stopping
 * "the" background sound at those moments stops the map's river and nothing else. Without these, a game
 * over carried the wind on through to the title screen.
 *
 * Each scene here is a stand-in carrying only the engine method J-Weather extends, recording that it ran:
 * the point is that the engine's own work still happens, and the weather stops alongside it.
 */
describe('the weather falling silent off the map', () =>
{
  let WeatherAudioChannel;
  let created;
  let engineCalls;

  const config = {
    motions: {},
    presets: {
      rain: {
        sounds: {
          light: {
            name: 'Rain1',
            volume: 40,
            pitch: 100,
          },
        },
      },
    },
    variables: { enabled: false },
  };

  /**
   * Builds a stand-in for one of the engine's audio buffers.
   * @param {string} name Which recording it holds.
   * @returns {object}
   */
  const buildBuffer = name => ({
    name,
    volume: 0,
    pitch: 0,
    stopped: false,
    destroyed: false,
    play: () => {},
    fadeIn: () => {},
    stop()
    {
      this.stopped = true;
    },
    destroy()
    {
      this.destroyed = true;
    },
  });

  /**
   * Builds a stand-in for one of the engine's scenes, carrying the methods J-Weather extends on it.
   * @param {string[]} methodNames The methods to give it, each recording its own name when it runs.
   * @returns {Function}
   */
  const buildScene = methodNames =>
  {
    const Scene = function()
    {
    };

    methodNames.forEach(methodName =>
    {
      Scene.prototype[methodName] = function()
      {
        engineCalls.push(methodName);
      };
    });

    return Scene;
  };

  beforeAll(async () =>
  {
    vi.resetModules();

    installWeatherHostGlobals();
    setWeatherConfig(config);
    setPluginContextToJWeather();

    globalThis.AudioManager = {
      bgsVolume: 100,
      createBuffer: (folder, name) =>
      {
        const buffer = buildBuffer(name);
        created.push(buffer);

        return buffer;
      },
    };

    // the engine's three scenes, as far as J-Weather reaches into them.
    globalThis.Scene_Gameover = buildScene([ 'playGameoverMusic' ]);
    globalThis.Scene_Title = buildScene([ 'playTitleMusic' ]);
    globalThis.Scene_Map = buildScene([ 'onMapLoaded', 'update', 'stopAudioOnBattleStart' ]);

    ({ default: globalThis.RPGManager } =
      await import('../../../../../src/plugins/_base/core/managers/RPGManager.js'));

    await import('../../../../../src/plugins/weather/core/_metadata/initialization.js');

    ({ default: WeatherAudioChannel } =
      await import('../../../../../src/plugins/weather/core/managers/WeatherAudioChannel.js'));

    await import('../../../../../src/plugins/weather/core/scenes/Scene_Gameover.js');
    await import('../../../../../src/plugins/weather/core/scenes/Scene_Title.js');
    await import('../../../../../src/plugins/weather/core/scenes/Scene_Map.js');
  });

  beforeEach(() =>
  {
    // rain going on the weather's own channel, as it would be out on a map.
    created = [];
    engineCalls = [];
    WeatherAudioChannel.stop();
    WeatherAudioChannel.play(config, {
      preset: 'rain',
      intensity: 'light',
    });
  });

  it('stops the weather at a game over, after the engine stops the map\'s own sound', () =>
  {
    // Arrange
    const scene = new globalThis.Scene_Gameover();

    // Act
    scene.playGameoverMusic();

    // Assert- the engine's own work first, then the rain let go of entirely.
    expect(engineCalls)
      .toEqual([ 'playGameoverMusic' ]);
    expect(created[0].stopped)
      .toBe(true);
    expect(WeatherAudioChannel.playing())
      .toBeNull();
  });

  it('stops the weather on the title screen, after the engine stops the map\'s own sound', () =>
  {
    // Arrange- arriving from the menu's To Title, which only fades the engine's own sounds on the way out.
    const scene = new globalThis.Scene_Title();

    // Act
    scene.playTitleMusic();

    // Assert
    expect(engineCalls)
      .toEqual([ 'playTitleMusic' ]);
    expect(created[0].stopped)
      .toBe(true);
    expect(WeatherAudioChannel.playing())
      .toBeNull();
  });

  it('stops the weather as a battle begins, after the engine stops the map\'s own sound', () =>
  {
    // Arrange
    const scene = new globalThis.Scene_Map();

    // Act
    scene.stopAudioOnBattleStart();

    // Assert
    expect(engineCalls)
      .toEqual([ 'stopAudioOnBattleStart' ]);
    expect(created[0].stopped)
      .toBe(true);
    expect(WeatherAudioChannel.playing())
      .toBeNull();
  });
});
//endregion plugins/weather/core/_component/weather-silenced-off-map.test.js
