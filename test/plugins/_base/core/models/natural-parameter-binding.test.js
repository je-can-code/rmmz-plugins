//region plugins/_base/models/natural-parameter-binding.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * A binding is plain data: the four tags one parameter answers to, and how to find that parameter's
 * base. Everything that reads it lives in J-NaturalGrowth, so the only thing worth pinning here is that
 * each argument lands on the field it names- four regexes in a row are easy to transpose.
 */
describe('NaturalParameterBinding (direct src import)', () =>
{
  let NaturalParameterBinding;

  beforeAll(async () =>
  {
    ({ default: NaturalParameterBinding } = await import('../../../../../src/plugins/_base/core/models/NaturalParameterBinding.js'));
  });

  describe('constructor', () =>
  {
    it('keeps every tag and the base resolver on the field it names', () =>
    {
      // Arrange- four distinct tags, so a swap between any two of them is visible.
      const buffPlus = /<lstBuffPlus:\[(.+)]>/gi;
      const buffRate = /<lstBuffRate:\[(.+)]>/gi;
      const growthPlus = /<lstGrowthPlus:\[(.+)]>/gi;
      const growthRate = /<lstGrowthRate:\[(.+)]>/gi;
      const getBase = battler => battler.baseLstRate();

      // Act
      const binding = new NaturalParameterBinding(buffPlus, buffRate, growthPlus, growthRate, getBase);

      // Assert
      expect(binding.buffPlus).toBe(buffPlus);
      expect(binding.buffRate).toBe(buffRate);
      expect(binding.growthPlus).toBe(growthPlus);
      expect(binding.growthRate).toBe(growthRate);
      expect(binding.getBase).toBe(getBase);
    });
  });
});
//endregion plugins/_base/models/natural-parameter-binding.test.js