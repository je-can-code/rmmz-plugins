//region plugins/_base/managers/trait-resolver.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('TraitResolver (direct src import)', () =>
{
  let TraitResolver;
  let RPG_Trait;

  beforeAll(async () =>
  {
    ({ default: RPG_Trait } = await import('../../../../src/plugins/_base/database/_data/RPG_Trait.js'));
    ({ default: TraitResolver } = await import('../../../../src/plugins/_base/managers/TraitResolver.js'));
  });

  function trait(code, dataId, value)
  {
    return RPG_Trait.fromValues(code, dataId, value);
  }

  function shapes(traits)
  {
    return traits
      .map(t => ({ code: t.code, dataId: t.dataId, value: t.value }))
      .sort((a, b) => (a.code - b.code) || (a.dataId - b.dataId));
  }

  describe('constructor', () =>
  {
    it('throws because it is a static class', () =>
    {
      // Arrange & Act
      const attempt = () => new TraitResolver();

      // Assert
      expect(attempt).toThrow('This is a static class.');
    });
  });

  describe('overlayTraits', () =>
  {
    it('appends non-conflicting overlay traits alongside the untouched base', () =>
    {
      // Arrange
      const base = [ trait(21, 1, 1.1) ];
      const overlay = [ trait(21, 2, 1.2) ];

      // Act
      const result = shapes(TraitResolver.overlayTraits(base, overlay));

      // Assert
      expect(result).toEqual([
        { code: 21, dataId: 1, value: 1.1 },
        { code: 21, dataId: 2, value: 1.2 },
      ]);
    });

    it('lets the overlay replace a base entry sharing the same code+dataId', () =>
    {
      // Arrange
      const base = [ trait(21, 1, 1.1) ];
      const overlay = [ trait(21, 1, 1.5) ];

      // Act
      const result = shapes(TraitResolver.overlayTraits(base, overlay));

      // Assert
      expect(result).toEqual([ { code: 21, dataId: 1, value: 1.5 } ]);
    });

    it('strips the opposing base code sharing the overlay\'s dataId', () =>
    {
      // Arrange- 41 (unlock skill type) / 42 (lock skill type) are an opposing pair.
      const base = [ trait(41, 3, 1) ];
      const overlay = [ trait(42, 3, 1) ];

      // Act
      const result = shapes(TraitResolver.overlayTraits(base, overlay));

      // Assert- only the overlay's lock survives; the base's unlock was stripped by opposition.
      expect(result).toEqual([ { code: 42, dataId: 3, value: 1 } ]);
    });

    it('strips the opposing base code when the overlay carries the other side of the pair', () =>
    {
      // Arrange- overlay carries 41 (the "a" side); base carries 42 (the "b" side)- the reverse
      // direction from the earlier test, to exercise #opposingCode's other return branch.
      const base = [ trait(42, 3, 1) ];
      const overlay = [ trait(41, 3, 1) ];

      // Act
      const result = shapes(TraitResolver.overlayTraits(base, overlay));

      // Assert
      expect(result).toEqual([ { code: 41, dataId: 3, value: 1 } ]);
    });

    it('leaves unrelated base codes untouched by an opposing overlay code', () =>
    {
      // Arrange
      const base = [ trait(41, 3, 1), trait(21, 9, 1.1) ];
      const overlay = [ trait(42, 3, 1) ];

      // Act
      const result = shapes(TraitResolver.overlayTraits(base, overlay));

      // Assert
      expect(result).toEqual([
        { code: 21, dataId: 9, value: 1.1 },
        { code: 42, dataId: 3, value: 1 },
      ]);
    });

    it('returns a clone of base (not the same array or trait instances) when overlay is empty', () =>
    {
      // Arrange
      const base = [ trait(21, 1, 1.1) ];

      // Act
      const result = TraitResolver.overlayTraits(base, []);

      // Assert
      expect(result).not.toBe(base);
      expect(result[0]).not.toBe(base[0]);
      expect(shapes(result)).toEqual([ { code: 21, dataId: 1, value: 1.1 } ]);
    });
  });

  describe('consolidate', () =>
  {
    it('additively combines same-dataId code 11 (rate, neutral 1.0) traits', () =>
    {
      // Arrange
      const traits = [ trait(11, 5, 1.2), trait(11, 5, 1.3) ];

      // Act
      const result = shapes(TraitResolver.consolidate(traits));

      // Assert- (1.2-1) + (1.3-1) + 1 = 1.5.
      expect(result).toEqual([ { code: 11, dataId: 5, value: 1.5 } ]);
    });

    it('additively combines same-dataId code 22 (straight additive, neutral 0.0) traits', () =>
    {
      // Arrange
      const traits = [ trait(22, 3, 0.1), trait(22, 3, 0.2) ];

      // Act
      const result = shapes(TraitResolver.consolidate(traits));

      // Assert
      expect(result[0].value).toBeCloseTo(0.3);
    });

    it('drops a combined entry that resolves back to the neutral value', () =>
    {
      // Arrange- a single 1.0-valued code-11 entry combines to exactly the 1.0 neutral.
      const traits = [ trait(11, 7, 1.0) ];

      // Act
      const result = TraitResolver.consolidate(traits);

      // Assert
      expect(result).toEqual([]);
    });

    it('leaves non-stackable codes untouched', () =>
    {
      // Arrange
      const traits = [ trait(35, 0, 12) ];

      // Act
      const result = shapes(TraitResolver.consolidate(traits));

      // Assert
      expect(result).toEqual([ { code: 35, dataId: 0, value: 12 } ]);
    });
  });

  describe('refineTraits', () =>
  {
    it('additively combines duplicate parameter-trait entries within the material before merging', () =>
    {
      // Arrange
      const base = [];
      const material = [ trait(21, 4, 1.1), trait(21, 4, 1.2) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert- (1.1-1) + (1.2-1) + 1 = 1.3.
      expect(result).toEqual([ { code: 21, dataId: 4, value: 1.3 } ]);
    });

    it('cancels an opposing pair that spans base and material', () =>
    {
      // Arrange
      const base = [ trait(41, 3, 1) ];
      const material = [ trait(42, 3, 1) ];

      // Act
      const result = TraitResolver.refineTraits(base, material);

      // Assert- both sides of the opposition are cancelled outright.
      expect(result).toEqual([]);
    });

    it('cancels an opposing pair that exists entirely within the base list', () =>
    {
      // Arrange
      const base = [ trait(43, 2, 1), trait(44, 2, 1) ];
      const material = [];

      // Act
      const result = TraitResolver.refineTraits(base, material);

      // Assert
      expect(result).toEqual([]);
    });

    it('cancels an opposing pair that exists entirely within the material list', () =>
    {
      // Arrange
      const base = [];
      const material = [ trait(43, 2, 1), trait(44, 2, 1) ];

      // Act
      const result = TraitResolver.refineTraits(base, material);

      // Assert
      expect(result).toEqual([]);
    });

    it('cancels an opposing pair where the base carries the "b" side and material carries the "a" side', () =>
    {
      // Arrange- the reverse direction from the earlier cross-list cancellation test.
      const base = [ trait(42, 3, 1) ];
      const material = [ trait(41, 3, 1) ];

      // Act
      const result = TraitResolver.refineTraits(base, material);

      // Assert
      expect(result).toEqual([]);
    });

    it('leaves an unrelated trait untouched by opposing-pair cancellation elsewhere in the list', () =>
    {
      // Arrange- the 41/3 vs 42/3 conflict cancels, but the unrelated 21/9 entry must survive.
      const base = [ trait(41, 3, 1), trait(21, 9, 1.1) ];
      const material = [ trait(42, 3, 1) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 21, dataId: 9, value: 1.1 } ]);
    });

    it('drops a no-duplicate-code material entry the base already owns', () =>
    {
      // Arrange- code 31 (attack element) is a no-duplicate code.
      const base = [ trait(31, 5, 1) ];
      const material = [ trait(31, 5, 1) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert- only the base's copy survives; the material's duplicate was dropped.
      expect(result).toEqual([ { code: 31, dataId: 5, value: 1 } ]);
    });

    it('lets an always-replace code from material overwrite the base entry', () =>
    {
      // Arrange- code 35 (basic attack skill) always replaces.
      const base = [ trait(35, 0, 10) ];
      const material = [ trait(35, 0, 20) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert- only the material's replacement value survives.
      expect(result).toEqual([ { code: 35, dataId: 0, value: 20 } ]);
    });

    it('keeps the base entry for a higher-is-better code when the base value is higher', () =>
    {
      // Arrange- code 32 (apply state chance) is higher-is-better.
      const base = [ trait(32, 1, 0.5) ];
      const material = [ trait(32, 1, 0.3) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 32, dataId: 1, value: 0.5 } ]);
    });

    it('keeps the material entry for a higher-is-better code when the material value is higher', () =>
    {
      // Arrange
      const base = [ trait(32, 1, 0.3) ];
      const material = [ trait(32, 1, 0.5) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 32, dataId: 1, value: 0.5 } ]);
    });

    it('keeps the base entry for a lower-is-better code when the base value is lower', () =>
    {
      // Arrange- code 11 (elemental damage rate) is lower-is-better.
      const base = [ trait(11, 2, 1.2) ];
      const material = [ trait(11, 2, 1.5) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 11, dataId: 2, value: 1.2 } ]);
    });

    it('keeps the material entry for a lower-is-better code when the material value is lower', () =>
    {
      // Arrange
      const base = [ trait(11, 2, 1.5) ];
      const material = [ trait(11, 2, 1.2) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 11, dataId: 2, value: 1.2 } ]);
    });

    it('leaves a keep-better base entry untouched when there is no matching material entry', () =>
    {
      // Arrange- code 32 is higher-is-better, but the material has no entry at this dataId.
      const base = [ trait(32, 1, 0.5) ];
      const material = [];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 32, dataId: 1, value: 0.5 } ]);
    });

    it('concats non-conflicting base and material traits unchanged', () =>
    {
      // Arrange
      const base = [ trait(21, 1, 1.1) ];
      const material = [ trait(21, 2, 1.2) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([
        { code: 21, dataId: 1, value: 1.1 },
        { code: 21, dataId: 2, value: 1.2 },
      ]);
    });
  });
});
//endregion plugins/_base/managers/trait-resolver.test.js
