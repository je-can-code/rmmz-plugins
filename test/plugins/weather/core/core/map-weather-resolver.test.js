//region plugins/weather/core/core/map-weather-resolver.test.js
import { describe, expect, it } from 'vitest';
import MapWeatherResolver from '../../../../../src/plugins/weather/core/core/MapWeatherResolver.js';

/**
 * What a given map's weather actually is.
 *
 * Every case below is written against a sky that is doing something *distinguishable* - heavy snow -
 * so that "fell back to the sky" and "used what the map authored" can never be confused for one
 * another. A suite that tested against a sky of clear-nothing would pass identically whether the
 * fallback worked or was deleted.
 */
describe('MapWeatherResolver', () =>
{
  // the sky, mid-blizzard, so anything reading it produces numbers nothing else would.
  const sky = {
    preset: 'snow',
    intensity: 'heavy',
  };

  /**
   * Builds what a map declared, defaulting to a plain outdoor map that said nothing.
   * @param {object} overrides Whatever this case needs to differ on.
   * @returns {{suppressed: boolean, preset: ?string, hasSky: boolean}}
   */
  const buildDeclaration = (overrides = {}) => ({
    suppressed: false,
    preset: null,
    hasSky: true,
    ...overrides,
  });

  describe('resolve', () =>
  {
    it('draws nothing on a map that opted out', () =>
    {
      // Arrange - sky overhead and a blizzard running, both of which this outranks.
      const declaration = buildDeclaration({ suppressed: true });

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert.
      expect(result)
        .toBeNull();
    });

    it('draws nothing on a map that opted out even while authoring a look', () =>
    {
      // Arrange - contradictory tags, which an author will eventually write. the opt-out wins, and
      // saying so here is what stops that becoming a question somebody has to go read source for.
      const declaration = buildDeclaration({
        suppressed: true,
        preset: 'motes',
      });

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert.
      expect(result)
        .toBeNull();
    });

    it('draws the look a map authored rather than the one the sky wanted', () =>
    {
      // Arrange - the Deluge Plains under a snowing sky, which is the case that proves an authored
      // look is not merely a default.
      const declaration = buildDeclaration({ preset: 'rain' });

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert - its own look, at the sky's strength.
      expect(result)
        .toEqual({
          preset: 'rain',
          intensity: 'heavy',
        });
    });

    it('draws an authored look indoors, where the sky never reaches', () =>
    {
      // Arrange - the Forlorn Basin: a cave that is emphatically not weatherless.
      const declaration = buildDeclaration({
        preset: 'motes',
        hasSky: false,
      });

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert - drawn, and at its own settled strength rather than the blizzard's.
      expect(result)
        .toEqual({
          preset: 'motes',
          intensity: 'moderate',
        });
    });

    it('draws nothing on a sheltered map that authored nothing', () =>
    {
      // Arrange - an ordinary interior, which is most of the game and needs no tag at all.
      const declaration = buildDeclaration({ hasSky: false });

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert.
      expect(result)
        .toBeNull();
    });

    it('draws nothing outdoors when nothing is driving the sky', () =>
    {
      // Arrange - this plugin running without its time extension, which is a supported way to run it.
      const declaration = buildDeclaration();

      // Act.
      const result = MapWeatherResolver.resolve(declaration, null);

      // Assert.
      expect(result)
        .toBeNull();
    });

    it('falls back to the sky on an untagged map with sky overhead', () =>
    {
      // Arrange - the connecting corridors, which is the whole reason the fallback is automatic
      // rather than empty.
      const declaration = buildDeclaration();

      // Act.
      const result = MapWeatherResolver.resolve(declaration, sky);

      // Assert.
      expect(result)
        .toEqual({
          preset: 'snow',
          intensity: 'heavy',
        });
    });
  });

  describe('intensityFor', () =>
  {
    it('reads the sky for a map under open sky', () =>
    {
      // Arrange & Act.
      const result = MapWeatherResolver.intensityFor(buildDeclaration({ preset: 'rain' }), sky);

      // Assert.
      expect(result)
        .toBe('heavy');
    });

    it('settles a sheltered map at its middle rung', () =>
    {
      // Arrange - sky is mid-blizzard, and a cave does not care.
      const declaration = buildDeclaration({
        preset: 'motes',
        hasSky: false,
      });

      // Act.
      const result = MapWeatherResolver.intensityFor(declaration, sky);

      // Assert.
      expect(result)
        .toBe('moderate');
    });

    it('settles an open-sky map at its middle rung when nothing drives the sky', () =>
    {
      // Arrange - the second operand of the same condition, which a test that only ever varied the
      // first would never reach.
      const declaration = buildDeclaration({ preset: 'rain' });

      // Act.
      const result = MapWeatherResolver.intensityFor(declaration, null);

      // Assert.
      expect(result)
        .toBe('moderate');
    });
  });
});
//endregion plugins/weather/core/core/map-weather-resolver.test.js