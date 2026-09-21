//region plugins/weather/ext/time/_component/page-conditions.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * An event page asking for particular weather, end to end.
 *
 * The mapper, the conditional and the parent plugin's own numbering all go in unmocked, because
 * the thing worth proving is that a tag an author types resolves to the same number the weather
 * variable reports. Only `WeatherDirector.current()` is steered, since that is what stands in for
 * "what the player can see right now".
 */
describe('weather page conditions', () =>
{
  let current;
  let vanillaPasses;

  /**
   * The weather configuration these pages are written against.
   */
  const weatherConfig = {
    presetIds: {
      rain: 1,
      snow: 2,
      fireflies: 11,
    },
    intensityIds: {
      light: 1,
      moderate: 2,
      heavy: 3,
    },
  };

  /**
   * An event page carrying comment commands.
   * @param {string[]} comments The comment lines on the page.
   * @returns {object}
   */
  const pageOf = (...comments) => ({
    list: comments.map(comment => ({
      code: 108,
      parameters: [ comment ],
    })),
  });

  /**
   * Puts a given weather on screen.
   * @param {?{preset: string, intensity: string}} weather What the player can see, or null.
   */
  const showing = weather =>
  {
    current = weather;
  };

  beforeEach(async () =>
  {
    vi.resetModules();

    String.empty = '';
    globalThis.__PLUGIN_NAME__ = 'J-Weather-Time';

    globalThis.J = {
      WEATHER: {
        Metadata: { weatherConfig },
        EXT: {
          TIME: {
            Aliased: { Game_Event: new Map() },
            RegExp: {
              WeatherTypePage: /<weatherTypePage:[ ]?([a-zA-Z0-9_-]+)>/i,
              WeatherIntensityPage: /<weatherIntensityPage:[ ]?([a-zA-Z0-9_-]+)>/i,
              WeatherIntensityRangePage: /<weatherIntensityRangePage:[ ]?([a-zA-Z0-9]+)-([a-zA-Z0-9]+)>/i,
            },
          },
        },
      },
    };

    ({ default: globalThis.WeatherVariables } =
      await import('../../../../../../src/plugins/weather/core/core/WeatherVariables.js'));

    globalThis.WeatherDirector = { current: () => current };
    showing(null);

    // the engine class, plus the base's comment reader and a vanilla condition check whose answer
    // this suite steers. It is installed *before* the import so the alias captures it, which is
    // what makes reaching it - and being blocked by it - something the alias has to actually do.
    vanillaPasses = true;
    globalThis.Game_Event = class
    {
    };
    globalThis.Game_Event.prototype.meetsConditions = function()
    {
      return vanillaPasses;
    };
    globalThis.Game_Event.getValidCommentCommandsFromPage = page => page.list.filter(command => command.code === 108);

    await import('../../../../../../src/plugins/weather/ext/time/objects/Game_Event.js');
  });

  /**
   * Whether a page would be active right now.
   * @param {object} page The page being tested.
   * @returns {boolean}
   */
  const isActive = page => new globalThis.Game_Event().meetsConditions(page);

  describe('a page with no weather tags', () =>
  {
    it('is active whatever the weather is doing', () =>
    {
      // Arrange - a comment that is genuinely a comment, so this is not merely an empty page.
      showing({ preset: 'snow', intensity: 'heavy' });

      // Act.
      const result = isActive(pageOf('just a note to myself'));

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('is active on a page with no comments at all', () =>
    {
      // Arrange.
      showing({ preset: 'snow', intensity: 'heavy' });

      // Act.
      const result = isActive(pageOf());

      // Assert.
      expect(result)
        .toBe(true);
    });
  });

  describe('a page naming a look', () =>
  {
    it('is active in that look', () =>
    {
      // Arrange.
      showing({ preset: 'rain', intensity: 'light' });

      // Act.
      const result = isActive(pageOf('<weatherTypePage:rain>'));

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('is inactive in a different look', () =>
    {
      // Arrange - snow rather than nothing, which is the near miss.
      showing({ preset: 'snow', intensity: 'light' });

      // Act.
      const result = isActive(pageOf('<weatherTypePage:rain>'));

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('is inactive where there is no weather', () =>
    {
      // Arrange - indoors, which is where the majority of events live.
      showing(null);

      // Act.
      const result = isActive(pageOf('<weatherTypePage:rain>'));

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('accepts the number as readily as the name', () =>
    {
      // Arrange - rain is 1, and both spellings have to reach the same conditional or an author
      // gets two dialects for one thing.
      showing({ preset: 'rain', intensity: 'light' });

      // Act.
      const result = isActive(pageOf('<weatherTypePage:1>'));

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('names what is on screen rather than what the sky is doing', () =>
    {
      // Arrange - a clear summer night draws fireflies, and this is the one genuinely surprising
      // part of the whole feature: the author writes what they can see.
      showing({ preset: 'fireflies', intensity: 'moderate' });

      // Act.
      const result = isActive(pageOf('<weatherTypePage:fireflies>'));

      // Assert.
      expect(result)
        .toBe(true);
    });
  });

  describe('a page naming a strength', () =>
  {
    it('is active at that strength', () =>
    {
      // Arrange.
      showing({ preset: 'rain', intensity: 'heavy' });

      // Act.
      const result = isActive(pageOf('<weatherIntensityPage:heavy>'));

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('is inactive at another strength of the same look', () =>
    {
      // Arrange.
      showing({ preset: 'rain', intensity: 'moderate' });

      // Act.
      const result = isActive(pageOf('<weatherIntensityPage:heavy>'));

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('a page naming a span of strengths', () =>
  {
    it('is active inside the span', () =>
    {
      // Arrange.
      showing({ preset: 'rain', intensity: 'heavy' });

      // Act.
      const result = isActive(pageOf('<weatherIntensityRangePage:moderate-heavy>'));

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('is inactive below the span', () =>
    {
      // Arrange.
      showing({ preset: 'rain', intensity: 'light' });

      // Act.
      const result = isActive(pageOf('<weatherIntensityRangePage:moderate-heavy>'));

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('is not confused for the single-strength tag', () =>
    {
      // Arrange - the two tag names share a prefix up to `weatherIntensity`, so if the shorter
      // pattern could claim this comment it would read the span as one strength named
      // "moderate-heavy" and resolve it to no weather at all.
      showing({ preset: 'rain', intensity: 'heavy' });

      // Act.
      const result = isActive(pageOf('<weatherIntensityRangePage:light-heavy>'));

      // Assert.
      expect(result)
        .toBe(true);
    });
  });

  describe('a page naming both a look and a strength', () =>
  {
    it('is active only when both are satisfied', () =>
    {
      // Arrange.
      showing({ preset: 'rain', intensity: 'heavy' });

      // Act.
      const result = isActive(pageOf('<weatherTypePage:rain>', '<weatherIntensityPage:heavy>'));

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('is inactive when the look matches and the strength does not', () =>
    {
      // Arrange.
      showing({ preset: 'rain', intensity: 'light' });

      // Act.
      const result = isActive(pageOf('<weatherTypePage:rain>', '<weatherIntensityPage:heavy>'));

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('is inactive when the strength matches and the look does not', () =>
    {
      // Arrange - the mirror, so neither condition can be the only one actually evaluated.
      showing({ preset: 'snow', intensity: 'heavy' });

      // Act.
      const result = isActive(pageOf('<weatherTypePage:rain>', '<weatherIntensityPage:heavy>'));

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('vanilla conditions', () =>
  {
    it('cannot be rescued by the weather being right', () =>
    {
      // Arrange - a page whose own switch or variable condition already failed. Weather is a
      // narrowing, never a widening.
      vanillaPasses = false;
      showing({ preset: 'rain', intensity: 'heavy' });

      // Act.
      const result = isActive(pageOf('<weatherTypePage:rain>'));

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('a comment command carrying nothing', () =>
  {
    it('is ignored rather than parsed', () =>
    {
      // Arrange - RMMZ writes an empty parameter for a blank comment line, and an author leaves
      // those between tags all the time.
      showing({ preset: 'rain', intensity: 'heavy' });

      // Act.
      const result = isActive(pageOf('', '<weatherTypePage:rain>'));

      // Assert - the real tag beside it still decides the page, so the blank was skipped rather
      // than the whole list being abandoned at the first one.
      expect(result)
        .toBe(true);
    });
  });
});
//endregion plugins/weather/ext/time/_component/page-conditions.test.js