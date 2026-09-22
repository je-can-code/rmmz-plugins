//region plugins/weather/core/core/weather-audio.test.js
import { describe, expect, it } from 'vitest';
import WeatherAudio from '../../../../../src/plugins/weather/core/core/WeatherAudio.js';

/**
 * What a given weather sounds like, and how loudly.
 *
 * The fixture carries three presets on purpose: one that is audible at every strength, one that is
 * audible only at its heaviest, and one with no sounds at all. Those are the three real shapes -
 * rain, a whiteout, and fog - and a test with only the first could not tell "found the sound" apart
 * from "returned the only sound there was".
 */
describe('WeatherAudio', () =>
{
  const config = {
    presets: {
      rain: {
        sounds: {
          light: {
            name: 'Rain1',
            volume: 35,
            pitch: 100,
          },
          heavy: {
            name: 'Storm1',
            volume: 80,
            pitch: 100,
          },
        },
      },
      snow: {
        sounds: {
          heavy: {
            name: 'Wind4',
            volume: 55,
            pitch: 100,
          },
        },
      },
      fog: {},
    },
  };

  describe('soundFor', () =>
  {
    it('finds the sound a weather makes at the strength it is going', () =>
    {
      // Arrange & Act.
      const result = WeatherAudio.soundFor(config, {
        preset: 'rain',
        intensity: 'heavy',
      });

      // Assert - the heavy sound, which is a different file from the light one.
      expect(result.name)
        .toBe('Storm1');
    });

    it('finds a different sound at a different strength', () =>
    {
      // Arrange & Act - the near-miss for the case above.
      const result = WeatherAudio.soundFor(config, {
        preset: 'rain',
        intensity: 'light',
      });

      // Assert.
      expect(result.name)
        .toBe('Rain1');
    });

    it('is silent at a strength the preset says nothing about', () =>
    {
      // Arrange & Act - falling snow makes no noise; a whiteout does, and that noise is the wind.
      const result = WeatherAudio.soundFor(config, {
        preset: 'snow',
        intensity: 'light',
      });

      // Assert.
      expect(result)
        .toBeNull();
    });

    it('is silent for a preset that makes no noise at all', () =>
    {
      // Arrange & Act - fog, which is also what keeps the river maps uncontested.
      const result = WeatherAudio.soundFor(config, {
        preset: 'fog',
        intensity: 'heavy',
      });

      // Assert.
      expect(result)
        .toBeNull();
    });

    it('is silent for a preset nobody configured', () =>
    {
      // Arrange & Act - already reported by whatever tried to draw it, so this only has to not throw.
      const result = WeatherAudio.soundFor(config, {
        preset: 'rian',
        intensity: 'heavy',
      });

      // Assert.
      expect(result)
        .toBeNull();
    });

    it('is silent when there is no weather at all', () =>
    {
      // Arrange & Act.
      const result = WeatherAudio.soundFor(config, null);

      // Assert.
      expect(result)
        .toBeNull();
    });
  });

  describe('bufferVolume', () =>
  {
    it('folds the player setting into the authored loudness', () =>
    {
      // Arrange & Act - 80 authored against a slider at 50.
      const result = WeatherAudio.bufferVolume(80, 50);

      // Assert.
      expect(result)
        .toBe(0.4);
    });

    it('silences everything when the player turned the slider off', () =>
    {
      // Arrange & Act - the bug this arithmetic exists to prevent: weather runs on a channel of its
      // own, so a version that ignored this would keep raining at somebody who muted the game.
      const result = WeatherAudio.bufferVolume(80, 0);

      // Assert.
      expect(result)
        .toBe(0);
    });

    it('reaches full volume only when both are at maximum', () =>
    {
      // Arrange & Act.
      const result = WeatherAudio.bufferVolume(100, 100);

      // Assert.
      expect(result)
        .toBe(1);
    });
  });

  describe('matches', () =>
  {
    const rain = {
      name: 'Rain1',
      volume: 35,
      pitch: 100,
    };

    it('calls two silences the same', () =>
    {
      // Arrange & Act & Assert.
      expect(WeatherAudio.matches(null, null))
        .toBe(true);
    });

    it('calls a sound arriving a change', () =>
    {
      // Arrange & Act & Assert.
      expect(WeatherAudio.matches(rain, null))
        .toBe(false);
    });

    it('calls a sound leaving a change', () =>
    {
      // Arrange & Act & Assert - the mirror of the case above, which a single-sided test would miss.
      expect(WeatherAudio.matches(null, rain))
        .toBe(false);
    });

    it('calls the same sound at the same volume unchanged', () =>
    {
      // Arrange - walking between two lightly-raining maps. restarting here would put an audible
      // hitch in the rain at every boundary.
      const same = {
        name: 'Rain1',
        volume: 35,
        pitch: 100,
      };

      // Act & Assert.
      expect(WeatherAudio.matches(rain, same))
        .toBe(true);
    });

    it('calls a different recording a change', () =>
    {
      // Arrange & Act & Assert.
      expect(WeatherAudio.matches(rain, {
        name: 'Storm1',
        volume: 35,
        pitch: 100,
      }))
        .toBe(false);
    });

    it('calls the same recording at a different volume a change', () =>
    {
      // Arrange & Act & Assert - rain easing off is the same file and must still be acted on.
      expect(WeatherAudio.matches(rain, {
        name: 'Rain1',
        volume: 60,
        pitch: 100,
      }))
        .toBe(false);
    });

    it('calls the same recording at a different pitch a change', () =>
    {
      // Arrange & Act & Assert - the third operand of the same comparison.
      expect(WeatherAudio.matches(rain, {
        name: 'Rain1',
        volume: 35,
        pitch: 80,
      }))
        .toBe(false);
    });
  });
});
//endregion plugins/weather/core/core/weather-audio.test.js