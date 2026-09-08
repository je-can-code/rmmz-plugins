//region plugins/_base/core/core/parameter-trait-map.test.js
import { beforeAll, describe, expect, it } from 'vitest';

/**
 * The map's whole job is to say which of three trait codes encodes a key, and at which index. Each
 * family is checked with a key that is NOT first in its list, because an index of zero would pass
 * even if the lookup ignored the key entirely.
 */
describe('ParameterTraitMap (direct src import)', () =>
{
  let ParameterTraitMap;

  beforeAll(async () =>
  {
    ({ default: ParameterTraitMap } = await import(
      '../../../../../src/plugins/_base/core/core/ParameterTraitMap.js'));
  });

  //region forKey
  describe('forKey', () =>
  {
    it('maps a base parameter onto trait code 21 at its own index', () =>
    {
      // Arrange & Act
      const result = ParameterTraitMap.forKey('def');

      // Assert
      expect(result).toEqual({ code: 21, dataId: 3 });
    });

    it('maps an ex-parameter onto trait code 22 at its own index', () =>
    {
      // Arrange & Act
      const result = ParameterTraitMap.forKey('hrg');

      // Assert
      expect(result).toEqual({ code: 22, dataId: 7 });
    });

    it('maps an sp-parameter onto trait code 23 at its own index', () =>
    {
      // Arrange & Act
      const result = ParameterTraitMap.forKey('pdr');

      // Assert
      expect(result).toEqual({ code: 23, dataId: 6 });
    });

    it('answers null for a key no trait encodes', () =>
    {
      // Arrange: crit block is a real parameter, stored in a notetag rather than a trait.
      const result = ParameterTraitMap.forKey('ctr');

      // Assert
      expect(result).toBeNull();
    });
  });
  //endregion forKey

  //region hasKey
  describe('hasKey', () =>
  {
    it('reports true for a key a trait encodes', () =>
    {
      // Arrange & Act
      const result = ParameterTraitMap.hasKey('mhp');

      // Assert
      expect(result).toBe(true);
    });

    it('reports false for a key no trait encodes', () =>
    {
      // Arrange & Act
      const result = ParameterTraitMap.hasKey('lst');

      // Assert
      expect(result).toBe(false);
    });
  });
  //endregion hasKey

  //region construction
  describe('construction', () =>
  {
    it('refuses to be instantiated, being a static class', () =>
    {
      // Arrange & Act & Assert
      expect(() => new ParameterTraitMap()).toThrow('This is a static class.');
    });
  });
  //endregion construction
});
//endregion plugins/_base/core/core/parameter-trait-map.test.js