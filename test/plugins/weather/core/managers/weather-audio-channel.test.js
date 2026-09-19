//region plugins/weather/core/managers/weather-audio-channel.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import WeatherAudioChannel from '../../../../../src/plugins/weather/core/managers/WeatherAudioChannel.js';

/**
 * The plugin's own looping audio channel.
 *
 * The buffers here are stand-ins, but the thing being checked is not the audio - it is the
 * bookkeeping, which is the entire cost of owning a channel `AudioManager` has never heard of. Every
 * case below is a thing nothing else in the engine will do on this channel's behalf.
 */
describe('WeatherAudioChannel', () =>
{
  let created;

  const config = {
    presets: {
      rain: {
        sounds: {
          light: {
            name: 'Rain1',
            volume: 40,
            pitch: 100,
          },
          heavy: {
            name: 'Storm1',
            volume: 80,
            pitch: 100,
          },
        },
      },
      fog: {},
    },
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
    played: null,
    fadedIn: null,
    stopped: false,
    destroyed: false,
    play(loop, offset)
    {
      this.played = {
        loop,
        offset,
      };
    },
    fadeIn(seconds)
    {
      this.fadedIn = seconds;
    },
    stop()
    {
      this.stopped = true;
    },
    destroy()
    {
      this.destroyed = true;
    },
  });

  beforeAll(() =>
  {
    globalThis.AudioManager = {
      bgsVolume: 100,
      createBuffer: (folder, name) =>
      {
        const buffer = buildBuffer(name);
        buffer.folder = folder;
        created.push(buffer);

        return buffer;
      },
    };
  });

  beforeEach(() =>
  {
    created = [];
    globalThis.AudioManager.bgsVolume = 100;
    WeatherAudioChannel.stop();
  });

  describe('play', () =>
  {
    it('starts the sound looping, from the weather folder', () =>
    {
      // Arrange & Act.
      WeatherAudioChannel.play(config, {
        preset: 'rain',
        intensity: 'light',
      });

      // Assert - looped, from the start, out of the engine's own bgs folder.
      expect(created)
        .toHaveLength(1);
      expect(created[0].name)
        .toBe('Rain1');
      expect(created[0].folder)
        .toBe('bgs/');
      expect(created[0].played)
        .toEqual({
          loop: true,
          offset: 0,
        });
    });

    it('fades the sound in rather than starting it abruptly', () =>
    {
      // Arrange & Act - weather does not begin, it is already going when you walk outside.
      WeatherAudioChannel.play(config, {
        preset: 'rain',
        intensity: 'light',
      });

      // Assert.
      expect(created[0].fadedIn)
        .toBe(WeatherAudioChannel.FadeSeconds);
    });

    it('folds the player volume setting into the authored one', () =>
    {
      // Arrange - the slider at half.
      globalThis.AudioManager.bgsVolume = 50;

      // Act.
      WeatherAudioChannel.play(config, {
        preset: 'rain',
        intensity: 'light',
      });

      // Assert.
      expect(created[0].volume)
        .toBe(0.2);
    });

    it('leaves an already-playing sound strictly alone', () =>
    {
      // Arrange - walking between two lightly-raining maps.
      WeatherAudioChannel.play(config, {
        preset: 'rain',
        intensity: 'light',
      });

      // Act.
      WeatherAudioChannel.play(config, {
        preset: 'rain',
        intensity: 'light',
      });

      // Assert - one buffer ever created, and it was never stopped. restarting here would put an
      // audible hitch in the rain at every map boundary.
      expect(created)
        .toHaveLength(1);
      expect(created[0].stopped)
        .toBe(false);
    });

    it('swaps the buffer when the weather changes strength', () =>
    {
      // Arrange - rain picking up, which is a different recording.
      WeatherAudioChannel.play(config, {
        preset: 'rain',
        intensity: 'light',
      });

      // Act.
      WeatherAudioChannel.play(config, {
        preset: 'rain',
        intensity: 'heavy',
      });

      // Assert - the old one gone entirely, the new one going.
      expect(created)
        .toHaveLength(2);
      expect(created[0].stopped)
        .toBe(true);
      expect(created[0].destroyed)
        .toBe(true);
      expect(created[1].name)
        .toBe('Storm1');
    });

    it('falls silent when the new weather makes no noise', () =>
    {
      // Arrange - walking out of the rain into fog.
      WeatherAudioChannel.play(config, {
        preset: 'rain',
        intensity: 'light',
      });

      // Act.
      WeatherAudioChannel.play(config, {
        preset: 'fog',
        intensity: 'heavy',
      });

      // Assert - stopped, and nothing started in its place.
      expect(created)
        .toHaveLength(1);
      expect(created[0].destroyed)
        .toBe(true);
      expect(WeatherAudioChannel.playing())
        .toBeNull();
    });

    it('does nothing at all when silence follows silence', () =>
    {
      // Arrange - two interiors in a row, which is most of walking around a town.
      WeatherAudioChannel.play(config, null);

      // Act.
      WeatherAudioChannel.play(config, null);

      // Assert.
      expect(created)
        .toHaveLength(0);
      expect(WeatherAudioChannel.playing())
        .toBeNull();
    });
  });

  describe('refreshVolume', () =>
  {
    it('re-reads the slider onto a sound already playing', () =>
    {
      // Arrange - rain going, then the player turns the volume down in Options. AudioManager retunes
      // only the buffers it knows about, and it has never heard of this one.
      WeatherAudioChannel.play(config, {
        preset: 'rain',
        intensity: 'heavy',
      });
      globalThis.AudioManager.bgsVolume = 25;

      // Act.
      WeatherAudioChannel.refreshVolume();

      // Assert.
      expect(created[0].volume)
        .toBe(0.2);
    });

    it('does nothing when nothing is playing', () =>
    {
      // Arrange - indoors, slider moved. there is no buffer to retune and reaching for one would
      // throw.
      globalThis.AudioManager.bgsVolume = 25;

      // Act.
      WeatherAudioChannel.refreshVolume();

      // Assert.
      expect(WeatherAudioChannel.playing())
        .toBeNull();
    });
  });

  describe('stop', () =>
  {
    it('lets go of the buffer entirely', () =>
    {
      // Arrange.
      WeatherAudioChannel.play(config, {
        preset: 'rain',
        intensity: 'light',
      });

      // Act.
      WeatherAudioChannel.stop();

      // Assert.
      expect(created[0].stopped)
        .toBe(true);
      expect(created[0].destroyed)
        .toBe(true);
      expect(WeatherAudioChannel.playing())
        .toBeNull();
    });

    it('is harmless when nothing is playing', () =>
    {
      // Arrange & Act & Assert - called on every weather change, so most calls hit this.
      expect(() => WeatherAudioChannel.stop())
        .not
        .toThrow();
      expect(WeatherAudioChannel.playing())
        .toBeNull();
    });
  });
});
//endregion plugins/weather/core/managers/weather-audio-channel.test.js