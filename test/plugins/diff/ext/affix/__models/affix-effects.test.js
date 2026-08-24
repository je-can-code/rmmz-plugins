//region plugins/diff/ext/affix/__models/affix-effects.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

/**
 * Everything a layer declares about affixes passes through this model on its way in, so the shape
 * checks that belong at the boundary belong here: what an omitted field means, what a nonsense
 * value does, and the type coercion that keeps grant ids from arriving as strings.
 */
describe('AffixEffects (direct src import)', () =>
{
  let AffixEffects;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: AffixEffects } = await import('../../../../../../src/plugins/diff/ext/affix/__models/AffixEffects.js'));
  });

  describe('defaults', () =>
  {
    it('starts at identity for every effect', () =>
    {
      // Arrange & Act- an empty block is the shape a layer that names only one field produces for
      // all the others, so the defaults have to be the values that change nothing.
      const effects = AffixEffects.fromRaw('a-layer', {});

      // Assert
      expect(effects.prefixChance).toBe(100);
      expect(effects.suffixChance).toBe(100);
      expect(effects.flatten).toBe(0);
      expect(effects.rawGrants().size).toBe(0);
    });

    it('leaves both slot grant maps empty until something sorts them', () =>
    {
      // Arrange & Act- the slot a grant belongs to cannot be known this early, so the split maps
      // must start empty rather than start wrong.
      const effects = AffixEffects.fromRaw('a-layer', { grants: { '5': 25 } });

      // Assert
      expect(effects.rawGrants()
        .size).toBe(1);
      expect(effects.prefixGrants()
        .size).toBe(0);
      expect(effects.suffixGrants()
        .size).toBe(0);
    });
  });

  describe('fromRaw', () =>
  {
    it('reads an authored prefix chance', () =>
    {
      // Arrange & Act
      const effects = AffixEffects.fromRaw('a-layer', { prefixChance: 150 });

      // Assert- the other fields stay at identity, so "read prefixChance" and "read everything"
      // cannot look the same.
      expect(effects.prefixChance).toBe(150);
      expect(effects.suffixChance).toBe(100);
    });

    it('reads an authored suffix chance', () =>
    {
      // Arrange & Act
      const effects = AffixEffects.fromRaw('a-layer', { suffixChance: 250 });

      // Assert
      expect(effects.suffixChance).toBe(250);
      expect(effects.prefixChance).toBe(100);
    });

    it('reads an authored flatten', () =>
    {
      // Arrange & Act
      const effects = AffixEffects.fromRaw('a-layer', { flatten: 40 });

      // Assert
      expect(effects.flatten).toBe(40);
    });

    it('accepts a prefix chance of zero as a deliberate suppression', () =>
    {
      // Arrange & Act- zero is meaningfully different from the identity default of 100, and it
      // must survive rather than being mistaken for an absent field.
      const effects = AffixEffects.fromRaw('a-layer', { prefixChance: 0 });

      // Assert
      expect(effects.prefixChance).toBe(0);
    });

    it('accepts a suffix chance of zero as a deliberate suppression', () =>
    {
      // Arrange & Act
      const effects = AffixEffects.fromRaw('a-layer', { suffixChance: 0 });

      // Assert
      expect(effects.suffixChance).toBe(0);
    });

    it('accepts a flatten of exactly 100', () =>
    {
      // Arrange & Act- the upper boundary is inclusive; it means "every affix equally likely".
      const effects = AffixEffects.fromRaw('a-layer', { flatten: 100 });

      // Assert
      expect(effects.flatten).toBe(100);
    });

    it('accepts a granted weight of zero', () =>
    {
      // Arrange & Act- granting zero is a no-op rather than an error, and it is how a layer can
      // be authored with a grant it does not currently want to hand out.
      const effects = AffixEffects.fromRaw('a-layer', { grants: { '5': 0 } });

      // Assert
      expect(effects.rawGrants()
        .get(5)).toBe(0);
    });
  });

  describe('grant key coercion', () =>
  {
    it('converts every JSON string key into the numeric state id the pools use', () =>
    {
      // Arrange & Act- two grants rather than one, so "converted the keys" and "converted a key"
      // are distinguishable.
      const effects = AffixEffects.fromRaw('a-layer', {
        grants: {
          '306': 50,
          '307': 25,
        },
      });

      // Assert- numeric lookups hit and string lookups miss; a pool keyed by state.id would
      // otherwise gain a parallel entry rather than the one the author meant.
      const grants = effects.rawGrants();
      expect(grants.get(306)).toBe(50);
      expect(grants.get(307)).toBe(25);
      expect(grants.has('306')).toBe(false);
      expect(grants.size).toBe(2);
    });
  });

  describe('validation', () =>
  {
    it('throws on a negative prefix chance', () =>
    {
      // Arrange & Act & Assert- a negative multiplier would flip the sign of a percentage.
      expect(() => AffixEffects.fromRaw('bad-layer', { prefixChance: -1 }))
        .toThrow(/layer \[bad-layer\] has prefixChance:-1/);
    });

    it('throws on a negative suffix chance', () =>
    {
      // Arrange & Act & Assert
      expect(() => AffixEffects.fromRaw('bad-layer', { suffixChance: -50 }))
        .toThrow(/layer \[bad-layer\] has suffixChance:-50/);
    });

    it('throws on a flatten below zero', () =>
    {
      // Arrange & Act & Assert- below zero would exaggerate the pool rather than level it.
      expect(() => AffixEffects.fromRaw('bad-layer', { flatten: -1 }))
        .toThrow(/layer \[bad-layer\] has flatten:-1/);
    });

    it('throws on a flatten above one hundred', () =>
    {
      // Arrange & Act & Assert- above 100 would push weights past the mean and invert the pool.
      expect(() => AffixEffects.fromRaw('bad-layer', { flatten: 101 }))
        .toThrow(/layer \[bad-layer\] has flatten:101/);
    });

    it('throws on a negative granted weight', () =>
    {
      // Arrange & Act & Assert
      expect(() => AffixEffects.fromRaw('bad-layer', { grants: { '5': -10 } }))
        .toThrow(/layer \[bad-layer\] grants state \[5\] a weight of \[-10\]/);
    });
  });

  describe('slot assignment', () =>
  {
    it('records a prefix grant without touching the suffix side', () =>
    {
      // Arrange
      const effects = AffixEffects.fromRaw('a-layer', {});

      // Act
      effects.addPrefixGrant(306, 50);

      // Assert- asserting only the prefix map would let "records in both" pass as well.
      expect(effects.prefixGrants()
        .get(306)).toBe(50);
      expect(effects.suffixGrants()
        .has(306)).toBe(false);
    });

    it('records a suffix grant without touching the prefix side', () =>
    {
      // Arrange
      const effects = AffixEffects.fromRaw('a-layer', {});

      // Act
      effects.addSuffixGrant(356, 25);

      // Assert
      expect(effects.suffixGrants()
        .get(356)).toBe(25);
      expect(effects.prefixGrants()
        .has(356)).toBe(false);
    });
  });

  describe('setRawGrants', () =>
  {
    it('replaces the unsorted grants wholesale', () =>
    {
      // Arrange
      const effects = AffixEffects.fromRaw('a-layer', { grants: { '5': 10 } });

      // Act
      effects.setRawGrants(new Map([ [ 9, 30 ] ]));

      // Assert- the previous contents are gone rather than merged.
      expect(effects.rawGrants()
        .has(5)).toBe(false);
      expect(effects.rawGrants()
        .get(9)).toBe(30);
    });
  });
});
//endregion plugins/diff/ext/affix/__models/affix-effects.test.js