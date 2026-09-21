//region plugins/weather/ext/time/core/forecast-icons.test.js
import { describe, expect, it } from 'vitest';
import ForecastIcons from '../../../../../../src/plugins/weather/ext/time/core/ForecastIcons.js';

/**
 * The picture a forecast draws for each look.
 *
 * **Absence is the normal case here**, not an error path. Fifteen presets need artwork and the
 * game has a handful, so every case below is written against a config where some are drawn and
 * some are not - which is the state this will live in for as long as it takes to draw the rest.
 */
describe('ForecastIcons', () =>
{
  /**
   * A config partway through being illustrated.
   * @returns {object}
   */
  const buildConfig = () => ({
    presets: {
      rain: { iconIndex: 64 },
      snow: { iconIndex: 65 },
      fog: {},
      sakura: { iconIndex: 0 },
      _comment_faces: [ 'a note to the author, not a preset' ],
    },
  });

  describe('indexFor', () =>
  {
    it('reports the icon a look was given', () =>
    {
      // Arrange - snow rather than the first entry, so a lookup returning whatever it found first
      // would be visible.
      const result = ForecastIcons.indexFor(buildConfig(), 'snow');

      // Assert.
      expect(result)
        .toBe(65);
    });

    it('reports no icon for a look that has none yet', () =>
    {
      // Arrange.
      const result = ForecastIcons.indexFor(buildConfig(), 'fog');

      // Assert.
      expect(result)
        .toBe(0);
    });

    it('reports no icon for a look the config has never heard of', () =>
    {
      // Arrange - drawing its name is the most useful thing that can be said about it.
      const result = ForecastIcons.indexFor(buildConfig(), 'hurricane');

      // Assert.
      expect(result)
        .toBe(0);
    });
  });

  describe('hasIcon', () =>
  {
    it('confirms a look that has artwork', () =>
    {
      // Act.
      const result = ForecastIcons.hasIcon(buildConfig(), 'rain');

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('denies a look given an explicit zero', () =>
    {
      // Arrange - zero is what an unset numeric field reads as in the editor, so it has to mean
      // the same thing as the field being absent entirely.
      const result = ForecastIcons.hasIcon(buildConfig(), 'sakura');

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('missing', () =>
  {
    it('lists every look still waiting on artwork', () =>
    {
      // Arrange.
      const config = buildConfig();

      // Act.
      const result = ForecastIcons.missing(config);

      // Assert - the two drawn ones are absent, and the underscore-prefixed authoring note is not
      // mistaken for a preset.
      expect(result)
        .toEqual([ 'fog', 'sakura' ]);
    });

    it('lists nothing once everything is drawn', () =>
    {
      // Arrange.
      const config = buildConfig();
      config.presets.fog.iconIndex = 66;
      config.presets.sakura.iconIndex = 67;

      // Act.
      const result = ForecastIcons.missing(config);

      // Assert.
      expect(result)
        .toEqual([]);
    });
  });
});
//endregion plugins/weather/ext/time/core/forecast-icons.test.js