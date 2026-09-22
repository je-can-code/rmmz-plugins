//region plugins/weather/ext/time/core/climate-curves.test.js
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ClimateCurves from '../../../../../../src/plugins/weather/ext/time/core/ClimateCurves.js';

/**
 * How one kind of place answers the sky rather than following it.
 *
 * **Every case runs against a sky that is doing something distinguishable**, so "bent it" and
 * "passed it through" can never be confused. The Forest case in particular is written the way
 * Jeremy described it rather than the way the first design implemented it: the fog is heaviest
 * when the sky is at its **clearest**, which is a statement about the sky's condition and not
 * about its strength.
 */
describe('ClimateCurves', () =>
{
  /**
   * The climates this run knows about.
   *
   * Three of them, of two different shapes, because a lookup with one entry cannot tell "found the
   * right climate" from "found the only climate".
   */
  const climates = {
    dreaming: {
      byType: {
        clear: 'heavy',
        overcast: 'light',
        rain: 'light',
      },
      default: 'moderate',
    },
    inverted: {
      byIntensity: {
        light: 'heavy',
        heavy: 'light',
      },
    },
    partial: {
      byType: { clear: 'heavy' },
    },
  };

  /**
   * What a map said, defaulting to an outdoor map with an authored look and no climate.
   * @param {object} overrides Whatever this case needs to differ on.
   * @returns {object}
   */
  const buildDeclaration = (overrides = {}) => ({
    suppressed: false,
    preset: 'fog',
    hasSky: true,
    climate: null,
    ...overrides,
  });

  /**
   * What the sky is doing, defaulting to a clear day at middling strength.
   * @param {object} overrides Whatever this case needs to differ on.
   * @returns {object}
   */
  const buildSky = (overrides = {}) => ({
    preset: 'clear',
    intensity: 'moderate',
    type: 'clear',
    ...overrides,
  });

  beforeEach(() =>
  {
    globalThis.__PLUGIN_NAME__ = 'J-Weather-Time';
    globalThis.J = { WEATHER: { EXT: { TIME: { Metadata: { climates } } } } };
  });

  describe('apply', () =>
  {
    it('leaves a place that named no climate following the sky', () =>
    {
      // Arrange - the overwhelming majority of maps.
      const declaration = buildDeclaration();

      // Act.
      const result = ClimateCurves.apply(declaration, buildSky(), 'moderate');

      // Assert.
      expect(result)
        .toBe('moderate');
    });

    it('says nothing about a place that named no climate', () =>
    {
      // Arrange - naming none is the normal state of a map, not an error, and this runs on every
      // arrival and every phase crossing for the life of a playthrough. Letting it fall through
      // to the unknown-climate path answers correctly and buries the console under a warning per
      // map - which is the shape of the bug that makes people stop reading the console at all.
      const declaration = buildDeclaration();
      const warn = vi.spyOn(Diagnostics, 'warn')
        .mockImplementation(() =>
        {});

      // Act.
      ClimateCurves.apply(declaration, buildSky(), 'moderate');

      // Assert.
      expect(warn)
        .not
        .toHaveBeenCalled();

      warn.mockRestore();
    });

    it('makes the forest foggiest when the sky is clearest', () =>
    {
      // Arrange - a clear sky at its *lightest*, which is the case that separates keying on the
      // condition from keying on the strength. An intensity curve would answer `heavy` here by
      // inverting light, and would then answer `light` for a blazing clear day - the exact
      // opposite of what this exists to do.
      const declaration = buildDeclaration({ climate: 'dreaming' });

      // Act.
      const result = ClimateCurves.apply(declaration, buildSky({ intensity: 'light' }), 'light');

      // Assert.
      expect(result)
        .toBe('heavy');
    });

    it('keeps the forest foggiest when the sky is clear and blazing', () =>
    {
      // Arrange - the other end of the same condition. Both answers are `heavy`, which is the
      // whole point: how clear it is decides the fog, and how *much* clear does not.
      const declaration = buildDeclaration({ climate: 'dreaming' });

      // Act.
      const result = ClimateCurves.apply(declaration, buildSky({ intensity: 'heavy' }), 'heavy');

      // Assert.
      expect(result)
        .toBe('heavy');
    });

    it('thins the forest fog when the sky clouds over', () =>
    {
      // Arrange.
      const declaration = buildDeclaration({ climate: 'dreaming' });
      const sky = buildSky({ preset: 'clouds', type: 'overcast', intensity: 'heavy' });

      // Act.
      const result = ClimateCurves.apply(declaration, sky, 'heavy');

      // Assert.
      expect(result)
        .toBe('light');
    });

    it('answers by strength for a climate that declared a strength table', () =>
    {
      // Arrange - a different climate of a different shape, proving the two routes are separate
      // rather than one of them being dead.
      const declaration = buildDeclaration({ climate: 'inverted' });

      // Act.
      const result = ClimateCurves.apply(declaration, buildSky(), 'light');

      // Assert.
      expect(result)
        .toBe('heavy');
    });

    it('falls to a climate own default for a condition its table omitted', () =>
    {
      // Arrange - `dreaming` lists three conditions and says nothing about a breeze.
      const declaration = buildDeclaration({ climate: 'dreaming' });
      const sky = buildSky({ preset: 'leaves', type: 'breezy', intensity: 'heavy' });

      // Act.
      const result = ClimateCurves.apply(declaration, sky, 'heavy');

      // Assert.
      expect(result)
        .toBe('moderate');
    });

    it('follows the sky for a climate with neither a match nor a default', () =>
    {
      // Arrange - `partial` names one condition and declares no fallback.
      const declaration = buildDeclaration({ climate: 'partial' });
      const sky = buildSky({ preset: 'rain', type: 'rain', intensity: 'heavy' });

      // Act.
      const result = ClimateCurves.apply(declaration, sky, 'heavy');

      // Assert.
      expect(result)
        .toBe('heavy');
    });

    it('leaves an indoor place at the strength it was authored for', () =>
    {
      // Arrange - a cave that somehow carries a climate tag. There is no sky in here to answer, so
      // the sheltered strength core arrived at has to survive.
      const declaration = buildDeclaration({ climate: 'dreaming', hasSky: false });

      // Act.
      const result = ClimateCurves.apply(declaration, buildSky(), 'moderate');

      // Assert - `heavy` would mean a climate bending a sky that cannot be seen from here.
      expect(result)
        .toBe('moderate');
    });

    it('leaves a place alone when nothing is driving a sky at all', () =>
    {
      // Arrange - J-Weather running without this extension installed is the ordinary state of the
      // parent plugin, and a climate has nothing to bend.
      const declaration = buildDeclaration({ climate: 'dreaming' });

      // Act.
      const result = ClimateCurves.apply(declaration, null, 'moderate');

      // Assert.
      expect(result)
        .toBe('moderate');
    });

    it('follows the sky and says so when a map names a climate that does not exist', () =>
    {
      // Arrange - an author mistyped a tag the regex was perfectly happy to match.
      const declaration = buildDeclaration({ climate: 'dreamign' });
      const warn = vi.spyOn(Diagnostics, 'warn')
        .mockImplementation(() =>
        {});

      // Act.
      const result = ClimateCurves.apply(declaration, buildSky(), 'moderate');

      // Assert - diagnosable rather than silent, and the place simply follows the weather.
      expect(result)
        .toBe('moderate');
      expect(warn)
        .toHaveBeenCalledWith('J-Weather-Time', 'no climate named: [ dreamign ]!', expect.anything());

      warn.mockRestore();
    });
  });
});
//endregion plugins/weather/ext/time/core/climate-curves.test.js