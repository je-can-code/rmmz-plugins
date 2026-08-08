//region plugins/_base/managers/trait-resolver.test.js
import { beforeAll, describe, expect, it } from 'vitest';

describe('TraitResolver (direct src import)', () =>
{
  let TraitResolver;
  let RPG_Trait;

  beforeAll(async () =>
  {
    ({ default: RPG_Trait } = await import('../../../../../src/plugins/_base/core/database/_data/RPG_Trait.js'));
    ({ default: TraitResolver } = await import('../../../../../src/plugins/_base/core/managers/TraitResolver.js'));
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

    it('strips only the base entry matching the overlay on both code and dataId', () =>
    {
      // Arrange- three base entries share pieces of the overlay's identity: one matches it exactly,
      // one shares only its dataId, and one carries the opposing code at a different dataId. Only
      // the exact match and a same-dataId opposing entry may go, so both survivors are load-bearing.
      const base = [ trait(41, 3, 1), trait(31, 3, 1), trait(42, 9, 1) ];
      const overlay = [ trait(41, 3, 2) ];

      // Act
      const result = shapes(TraitResolver.overlayTraits(base, overlay));

      // Assert
      expect(result).toEqual([
        { code: 31, dataId: 3, value: 1 },
        { code: 41, dataId: 3, value: 2 },
        { code: 42, dataId: 9, value: 1 },
      ]);
    });

    it('strips no opposing code for an overlay code that belongs to no pair', () =>
    {
      // Arrange- attack-element has no opposite, so the base's unlock entry at the same dataId is
      // not its business. A lookup that returned a pair member for an unpaired code would take it.
      const base = [ trait(41, 5, 1) ];
      const overlay = [ trait(31, 5, 1) ];

      // Act
      const result = shapes(TraitResolver.overlayTraits(base, overlay));

      // Assert
      expect(result).toEqual([
        { code: 31, dataId: 5, value: 1 },
        { code: 41, dataId: 5, value: 1 },
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

    it('cancels only the opposed dataId, leaving a same-code sibling in the base', () =>
    {
      // Arrange- cancellation is keyed on code AND dataId together. a base carrying two unlock
      // entries where only one is opposed is what tells those two keys apart: a cancellation keyed
      // on code alone takes the sibling with it.
      const base = [ trait(41, 3, 1), trait(41, 7, 1) ];
      const material = [ trait(42, 3, 1) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 41, dataId: 7, value: 1 } ]);
    });

    it('cancels only the opposed dataId when the base carries the "b" side', () =>
    {
      // Arrange- the same distinction from the other direction, so the reverse cross-list scan is
      // held to it too rather than inheriting the first one's evidence.
      const base = [ trait(42, 3, 1), trait(42, 8, 1) ];
      const material = [ trait(41, 3, 1) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 42, dataId: 8, value: 1 } ]);
    });

    it('cancels only the opposed dataId within the base list', () =>
    {
      // Arrange- a within-list opposition on dataId 2, plus an unopposed sibling on dataId 9 that
      // shares the learn-skill code and must outlive the cancellation.
      const base = [ trait(43, 2, 1), trait(44, 2, 1), trait(43, 9, 1) ];
      const material = [];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 43, dataId: 9, value: 1 } ]);
    });

    it('cancels only the opposed dataId within the material list', () =>
    {
      // Arrange- the within-list twin on the material side, which is scanned separately.
      const base = [];
      const material = [ trait(43, 2, 1), trait(44, 2, 1), trait(43, 9, 1) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 43, dataId: 9, value: 1 } ]);
    });

    it('does not let an unrelated code drag its dataId into the cancellation', () =>
    {
      // Arrange- only entries belonging to the opposing pair may contribute a conflicting dataId.
      // the base attack-element entry shares dataId 7 with a material lock entry, so a scan that
      // ignored codes would cancel that lock entry for a collision that means nothing.
      const base = [ trait(41, 3, 1), trait(31, 7, 1) ];
      const material = [ trait(42, 3, 1), trait(42, 7, 1) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([
        { code: 31, dataId: 7, value: 1 },
        { code: 42, dataId: 7, value: 1 },
      ]);
    });

    it('spares an unrelated code that happens to share a cancelled dataId', () =>
    {
      // Arrange- dataId 3 is cancelled for the opposing pair, and the attack-element entry happens
      // to carry that same dataId. only entries belonging to the pair may be stripped for it.
      const base = [ trait(41, 3, 1), trait(31, 3, 1) ];
      const material = [ trait(42, 3, 1) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([ { code: 31, dataId: 3, value: 1 } ]);
    });

    it('drops only the no-duplicate entry the base owns, keeping its unowned sibling', () =>
    {
      // Arrange- the base owns attack-element 5 but not 9, and separately carries an action-plus
      // entry at dataId 9. a dedupe keyed on either half of code+dataId alone takes the 9 entry.
      const base = [ trait(31, 5, 1), trait(34, 9, 1) ];
      const material = [ trait(31, 5, 1), trait(31, 9, 1) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([
        { code: 31, dataId: 5, value: 1 },
        { code: 31, dataId: 9, value: 1 },
        { code: 34, dataId: 9, value: 1 },
      ]);
    });

    it('leaves the base alone for an always-replace code the material does not carry', () =>
    {
      // Arrange- the material is non-empty but carries no basic-attack-skill entry, so there is
      // nothing to replace and the base entry must survive intact.
      const base = [ trait(35, 1, 1) ];
      const material = [ trait(31, 2, 1) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([
        { code: 31, dataId: 2, value: 1 },
        { code: 35, dataId: 1, value: 1 },
      ]);
    });

    it('strips only the replaced code from the base, not its unrelated neighbours', () =>
    {
      // Arrange- the material's basic-attack-skill entry replaces the base's, and the base's
      // attack-element entry has nothing to do with that and must be left where it is.
      const base = [ trait(35, 1, 1), trait(31, 4, 1) ];
      const material = [ trait(35, 2, 1) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([
        { code: 31, dataId: 4, value: 1 },
        { code: 35, dataId: 2, value: 1 },
      ]);
    });

    it('pairs keep-better entries by dataId, not merely by code', () =>
    {
      // Arrange- action-plus at dataId 1 has no material counterpart and must survive untouched,
      // while dataId 2 loses to the material's higher value. a pairing that matched on code alone
      // would judge dataId 1 against the wrong entry and drop it.
      const base = [ trait(61, 1, 3), trait(61, 2, 1) ];
      const material = [ trait(61, 2, 5), trait(22, 1, 0.5) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([
        { code: 22, dataId: 1, value: 0.5 },
        { code: 61, dataId: 1, value: 3 },
        { code: 61, dataId: 2, value: 5 },
      ]);
    });

    it('keeps a non-keep-better base code out of the comparison entirely', () =>
    {
      // Arrange- the ex-param entry sits at dataId 2, which is also where the material's action-plus
      // entry sits. Keep-better must reject it on its code before dataId is ever consulted, or it
      // gets judged against a value from a code it shares nothing with and loses.
      const base = [ trait(61, 1, 3), trait(22, 2, 0.5) ];
      const material = [ trait(61, 2, 5) ];

      // Act
      const result = shapes(TraitResolver.refineTraits(base, material));

      // Assert
      expect(result).toEqual([
        { code: 22, dataId: 2, value: 0.5 },
        { code: 61, dataId: 1, value: 3 },
        { code: 61, dataId: 2, value: 5 },
      ]);
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
