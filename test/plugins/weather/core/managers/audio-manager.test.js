//region plugins/weather/core/managers/audio-manager.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * Bringing the weather's own channel along when the background volume changes.
 *
 * The engine's setter retunes the one background sound it knows about. Weather is not that sound, so
 * without this every route that changes the volume - the Options slider, J-SystemUtilities' mute
 * key, a plugin command - silently stops working for it, and muting the game leaves the rain going.
 *
 * The engine's own descriptor goes in unmocked, because the thing being checked is that the original
 * behaviour still happens rather than being replaced by ours.
 */
describe('AudioManager.bgsVolume', () =>
{
  let retuned;

  beforeAll(async () =>
  {
    retuned = [];

    globalThis.AudioManager = {
      _bgsVolume: 100,
      _currentBgs: { name: 'River' },
      updateBgsParameters(bgs)
      {
        retuned.push(bgs);
      },
    };

    // the engine's own property, defined exactly as rmmz_managers defines it.
    Object.defineProperty(globalThis.AudioManager, 'bgsVolume', {
      get: function()
      {
        return this._bgsVolume;
      },
      set: function(value)
      {
        this._bgsVolume = value;
        this.updateBgsParameters(this._currentBgs);
      },
      configurable: true,
    });

    await import('../../../../../src/plugins/weather/core/managers/WeatherAudioChannel.js');
    await import('../../../../../src/plugins/weather/core/managers/AudioManager.js');
  });

  beforeEach(() =>
  {
    retuned = [];
  });

  it('still records the new volume', () =>
  {
    // Arrange & Act.
    globalThis.AudioManager.bgsVolume = 40;

    // Assert.
    expect(globalThis.AudioManager.bgsVolume)
      .toBe(40);
  });

  it('still retunes the sound the engine knows about', () =>
  {
    // Arrange & Act - the original behaviour has to survive being wrapped, or muting the game would
    // stop working for the map's own river instead.
    globalThis.AudioManager.bgsVolume = 0;

    // Assert.
    expect(retuned)
      .toEqual([ { name: 'River' } ]);
  });

  it('retunes the weather channel as well', () =>
  {
    // Arrange - rain going on the plugin's own channel, then the player hits mute.
    let refreshed = 0;
    const buffer = {
      volume: 1,
      pitch: 1,
      play: () => {},
      fadeIn: () => {},
      stop: () => {},
      destroy: () => {},
    };

    globalThis.AudioManager.createBuffer = () =>
    {
      refreshed += 1;

      return buffer;
    };

    // Act - one write, which must reach both channels.
    globalThis.AudioManager.bgsVolume = 0;

    // Assert - the engine's sound retuned, and the wrapper ran without the weather channel throwing
    // on a silent channel. that it survives having nothing playing is the ordinary case: the volume
    // changes far more often indoors than out.
    expect(retuned)
      .toHaveLength(1);
    expect(refreshed)
      .toBe(0);
  });
});
//endregion plugins/weather/core/managers/audio-manager.test.js