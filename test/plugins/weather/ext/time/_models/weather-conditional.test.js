//region plugins/weather/ext/time/_models/weather-conditional.test.js
import { describe, expect, it } from 'vitest';
import WeatherConditional
  from '../../../../../../src/plugins/weather/ext/time/_models/WeatherConditional.js';

/**
 * One requirement an event page places on the weather.
 *
 * **Zero is a real answer here, not an absence.** It is what the weather reports when there is
 * none, so a requirement that treated zero as "unconstrained" would let a rain-gated page fire in
 * a dry cave. That is why the unconstrained sentinel is -1, and why several cases below check
 * against zero specifically.
 */
describe('WeatherConditional', () =>
{
  // rain 1, snow 2, fog 3 - and light 1, moderate 2, heavy 3, matching the shipped config.
  const rain = 1;
  const snow = 2;
  const none = 0;
  const light = 1;
  const moderate = 2;
  const heavy = 3;

  describe('forType', () =>
  {
    it('is met by the look it names', () =>
    {
      // Arrange.
      const conditional = WeatherConditional.forType(rain);

      // Act.
      const result = conditional.isMet(rain, moderate);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('is not met by a different look', () =>
    {
      // Arrange - snow rather than nothing, so this cannot pass by only rejecting absence.
      const conditional = WeatherConditional.forType(rain);

      // Act.
      const result = conditional.isMet(snow, moderate);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('is not met where there is no weather at all', () =>
    {
      // Arrange - the case an unconstrained-means-zero sentinel would get wrong, and the one an
      // author notices first: a rain creature standing in a cave.
      const conditional = WeatherConditional.forType(rain);

      // Act.
      const result = conditional.isMet(none, none);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('says nothing about the strength', () =>
    {
      // Arrange - the same look at both ends of the ladder, because a type requirement that
      // quietly also pinned the strength would pass every case above.
      const conditional = WeatherConditional.forType(rain);

      // Act.
      const atLight = conditional.isMet(rain, light);
      const atHeavy = conditional.isMet(rain, heavy);

      // Assert.
      expect(atLight)
        .toBe(true);
      expect(atHeavy)
        .toBe(true);
    });
  });

  describe('forIntensity', () =>
  {
    it('is met at exactly the strength it names', () =>
    {
      // Arrange.
      const conditional = WeatherConditional.forIntensity(heavy);

      // Act.
      const result = conditional.isMet(rain, heavy);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('is not met below it', () =>
    {
      // Arrange.
      const conditional = WeatherConditional.forIntensity(heavy);

      // Act.
      const result = conditional.isMet(rain, moderate);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('is not met above it', () =>
    {
      // Arrange - the other side of the same boundary; a single strength is a span with equal
      // ends, and only checking both sides proves the upper bound exists.
      const conditional = WeatherConditional.forIntensity(light);

      // Act.
      const result = conditional.isMet(rain, moderate);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('says nothing about the look', () =>
    {
      // Arrange.
      const conditional = WeatherConditional.forIntensity(heavy);

      // Act.
      const asRain = conditional.isMet(rain, heavy);
      const asSnow = conditional.isMet(snow, heavy);

      // Assert.
      expect(asRain)
        .toBe(true);
      expect(asSnow)
        .toBe(true);
    });
  });

  describe('forIntensityRange', () =>
  {
    it('is met inside the span', () =>
    {
      // Arrange.
      const conditional = WeatherConditional.forIntensityRange(light, heavy);

      // Act.
      const result = conditional.isMet(rain, moderate);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('is met at the weaker end of the span', () =>
    {
      // Arrange - inclusive at both ends, which is the kind of boundary a reader has to be told.
      const conditional = WeatherConditional.forIntensityRange(moderate, heavy);

      // Act.
      const result = conditional.isMet(rain, moderate);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('is met at the stronger end of the span', () =>
    {
      // Arrange.
      const conditional = WeatherConditional.forIntensityRange(light, moderate);

      // Act.
      const result = conditional.isMet(rain, moderate);

      // Assert.
      expect(result)
        .toBe(true);
    });

    it('is not met below the span', () =>
    {
      // Arrange.
      const conditional = WeatherConditional.forIntensityRange(moderate, heavy);

      // Act.
      const result = conditional.isMet(rain, light);

      // Assert.
      expect(result)
        .toBe(false);
    });

    it('is not met above the span', () =>
    {
      // Arrange.
      const conditional = WeatherConditional.forIntensityRange(light, moderate);

      // Act.
      const result = conditional.isMet(rain, heavy);

      // Assert.
      expect(result)
        .toBe(false);
    });
  });

  describe('the bounds it was built with', () =>
  {
    it('reports the look a type requirement pinned', () =>
    {
      // Arrange & Act.
      const conditional = WeatherConditional.forType(snow);

      // Assert.
      expect(conditional.typeId())
        .toBe(snow);
    });

    it('leaves both strength bounds open on a type requirement', () =>
    {
      // Arrange & Act.
      const conditional = WeatherConditional.forType(snow);

      // Assert.
      expect(conditional.minIntensity())
        .toBe(-1);
      expect(conditional.maxIntensity())
        .toBe(-1);
    });

    it('reports a span as the two bounds it was given', () =>
    {
      // Arrange & Act.
      const conditional = WeatherConditional.forIntensityRange(moderate, heavy);

      // Assert.
      expect(conditional.minIntensity())
        .toBe(moderate);
      expect(conditional.maxIntensity())
        .toBe(heavy);
      expect(conditional.typeId())
        .toBe(-1);
    });
  });
});
//endregion plugins/weather/ext/time/_models/weather-conditional.test.js