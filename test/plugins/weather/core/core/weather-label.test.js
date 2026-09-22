//region plugins/weather/core/core/weather-label.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import WeatherLabel from '../../../../../src/plugins/weather/core/core/WeatherLabel.js';

// RMMZ's core adds this to the String constructor and nothing in a node realm does. It has to be
// in place before the assertions read it, or every empty-string expectation quietly becomes an
// expectation of `undefined` and agrees with a broken implementation.
String.empty = '';

/**
 * The one spelling of weather, shared by every screen and every line of dialogue.
 *
 * The fixture gives rain an icon and fog none, because "has artwork" and "has not been drawn yet"
 * are the two states every caller has to survive, and a config where everything had an icon would
 * let a missing-icon bug ship. Ids are deliberately not positional - rain is 1, fog is 4, snow is
 * 7 - so a lookup reading array position could not accidentally agree with these assertions.
 */
describe('WeatherLabel', () =>
{
  beforeAll(() =>
  {
    globalThis.__PLUGIN_NAME__ = 'J-Weather';
    globalThis.Diagnostics = { warn: () => {} };
  });

  beforeEach(() =>
  {
    globalThis.Diagnostics.warn = vi.fn();
  });

  const config = {
    presets: {
      rain: { iconIndex: 64 },
      fog: {},
      snow: { iconIndex: 65 },
    },
    presetIds: {
      rain: 1,
      fog: 4,
      snow: 7,
    },
    intensityIds: {
      light: 1,
      moderate: 2,
      heavy: 3,
    },
  };

  describe('words', () =>
  {
    it('pairs a look with its strength in brackets', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.words(config, 'rain', 'heavy');

      // Assert.
      expect(result)
        .toBe('rain (heavy)');
    });

    it('names the look alone when no strength is given', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.words(config, 'rain', '');

      // Assert.
      expect(result)
        .toBe('rain');
    });

    it('says nothing at all when there is no look', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.words(config, '', 'heavy');

      // Assert.
      expect(result)
        .toBe('');
    });
  });

  describe('for', () =>
  {
    it('puts the icon in front of a look that has one', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.for(config, 'rain', 'heavy');

      // Assert.
      expect(result)
        .toBe('\\I[64]rain (heavy)');
    });

    it('draws a look with no artwork as its words alone', () =>
    {
      // Arrange - fog is in the config and deliberately has no iconIndex.

      // Act.
      const result = WeatherLabel.for(config, 'fog', 'light');

      // Assert.
      expect(result)
        .toBe('fog (light)');
    });

    it('says nothing at all when there is no look', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.for(config, '', 'heavy');

      // Assert.
      expect(result)
        .toBe('');
    });
  });

  describe('presetFrom', () =>
  {
    it('takes a name the config declares', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.presetFrom(config, 'snow');

      // Assert.
      expect(result)
        .toBe('snow');
    });

    it('takes a declared id', () =>
    {
      // Arrange - seven is snow, and is not snow's position in the table.

      // Act.
      const result = WeatherLabel.presetFrom(config, '7');

      // Assert.
      expect(result)
        .toBe('snow');
    });

    it('takes neither a name it has never heard of', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.presetFrom(config, 'hurricane');

      // Assert.
      expect(result)
        .toBe('');
    });

    it('takes neither an id nobody claims', () =>
    {
      // Arrange - three is between two real ids and belongs to neither.

      // Act.
      const result = WeatherLabel.presetFrom(config, '3');

      // Assert.
      expect(result)
        .toBe('');
    });
  });

  describe('intensityFrom', () =>
  {
    it('takes a name the config declares', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.intensityFrom(config, 'moderate');

      // Assert.
      expect(result)
        .toBe('moderate');
    });

    it('takes a declared id', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.intensityFrom(config, '3');

      // Assert.
      expect(result)
        .toBe('heavy');
    });

    it('takes neither something nobody claims', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.intensityFrom(config, 'torrential');

      // Assert.
      expect(result)
        .toBe('');
    });
  });

  describe('nothingFalling', () =>
  {
    it('uses the word the config authored', () =>
    {
      // Arrange.
      const authored = {
        ...config,
        labels: { nothing: 'nothing much' },
      };

      // Act.
      const result = WeatherLabel.nothingFalling(authored);

      // Assert.
      expect(result)
        .toBe('nothing much');
    });

    it('falls back when the config names no word', () =>
    {
      // Arrange.
      const bare = {
        ...config,
        labels: {},
      };

      // Act.
      const result = WeatherLabel.nothingFalling(bare);

      // Assert.
      expect(result)
        .toBe('clear');
    });

    it('falls back when the config has no labels at all', () =>
    {
      // Arrange - the shape every config had before this word existed.

      // Act.
      const result = WeatherLabel.nothingFalling(config);

      // Assert.
      expect(result)
        .toBe('clear');
    });
  });

  describe('here', () =>
  {
    it('spells out what is falling', () =>
    {
      // Arrange.
      const falling = {
        preset: 'snow',
        intensity: 'moderate',
      };

      // Act.
      const result = WeatherLabel.here(config, falling);

      // Assert.
      expect(result)
        .toBe('\\I[65]snow (moderate)');
    });

    it('uses the no-weather word where nothing is falling', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.here(config, null);

      // Assert.
      expect(result)
        .toBe('clear');
    });
  });

  describe('fromArguments', () =>
  {
    it('reads a look and a strength', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.fromArguments(config, 'rain, heavy', null);

      // Assert.
      expect(result)
        .toBe('\\I[64]rain (heavy)');
    });

    it('reads a look on its own', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.fromArguments(config, 'snow', null);

      // Assert.
      expect(result)
        .toBe('\\I[65]snow');
    });

    it('reads ids just as readily as names', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.fromArguments(config, '1, 3', null);

      // Assert.
      expect(result)
        .toBe('\\I[64]rain (heavy)');
    });

    it('falls back to what is falling when given nothing', () =>
    {
      // Arrange.
      const falling = {
        preset: 'fog',
        intensity: 'light',
      };

      // Act.
      const result = WeatherLabel.fromArguments(config, '', falling);

      // Assert.
      expect(result)
        .toBe('fog (light)');
    });

    it('treats whitespace between the brackets as nothing', () =>
    {
      // Arrange.
      const falling = {
        preset: 'rain',
        intensity: 'light',
      };

      // Act.
      const result = WeatherLabel.fromArguments(config, '  ', falling);

      // Assert.
      expect(result)
        .toBe('\\I[64]rain (light)');
    });

    it('renders nothing and reports a look it cannot name', () =>
    {
      // Arrange.

      // Act.
      const result = WeatherLabel.fromArguments(config, 'hurricane, heavy', null);

      // Assert - silent in the sentence, loud in the console.
      expect(result)
        .toBe('');
      expect(globalThis.Diagnostics.warn)
        .toHaveBeenCalledTimes(1);
    });

    it('still names the look when it cannot name the strength', () =>
    {
      // Arrange - losing the strength must not cost the sentence its subject too.

      // Act.
      const result = WeatherLabel.fromArguments(config, 'rain, torrential', null);

      // Assert.
      expect(result)
        .toBe('\\I[64]rain');
      expect(globalThis.Diagnostics.warn)
        .toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/weather/core/core/weather-label.test.js