//region plugins/passive/ext/difficulty/_metadata/passive-affix-metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The alias installed here is the load-bearing seam of the difficulty's affix biasing, and it rests on
 * a subtlety worth pinning: the metadata instance it has to affect was constructed by another ship
 * long before this file ran. Replacing a prototype method after the fact reaches that instance
 * because methods live on the prototype and dispatch resolves at call time - but only so long as the
 * seam stays a prototype method. Were it ever authored as a class field it would become an own
 * property, the alias would be shadowed, and the biasing would silently do nothing at all.
 */
describe('JPassiveAffix_PluginMetadata affix pool alias (direct src import)', () =>
{
  let affixMetadataInstance;
  let FakeDifficultyAffixManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      PASSIVE: { EXT: { AFFIX: {}, DIFFICULTY: { Aliased: { JPassiveAffix_PluginMetadata: new Map() } } } },
    };

    // stands in for the class the passive ship exposes as a bare global, seams and all.
    globalThis.JPassiveAffix_PluginMetadata = function JPassiveAffix_PluginMetadata()
    {
    };

    globalThis.JPassiveAffix_PluginMetadata.prototype.effectivePrefixPool = function()
    {
      return {
        map: this.prefixMap,
        totalWeight: this.totalPrefixWeight,
      };
    };

    globalThis.JPassiveAffix_PluginMetadata.prototype.effectiveSuffixPool = function()
    {
      return {
        map: this.suffixMap,
        totalWeight: this.totalSuffixWeight,
      };
    };

    // constructed before the alias is installed, exactly as the real load order does it.
    affixMetadataInstance = new globalThis.JPassiveAffix_PluginMetadata();
    affixMetadataInstance.prefixMap = new Map([ [ 1, 500 ] ]);
    affixMetadataInstance.totalPrefixWeight = 500;
    affixMetadataInstance.suffixMap = new Map([ [ 5, 90 ] ]);
    affixMetadataInstance.totalSuffixWeight = 90;

    // the adjusted pools belong to the manager, whose arithmetic has its own suite.
    FakeDifficultyAffixManager = {};
    vi.doMock('../../../../../../src/plugins/passive/ext/difficulty/managers/DifficultyAffixManager.js',
      () => ({ default: FakeDifficultyAffixManager }));

    await import('../../../../../../src/plugins/passive/ext/difficulty/_metadata/JPassiveAffix_PluginMetadata.js');
  });

  beforeEach(() =>
  {
    FakeDifficultyAffixManager.effectivePrefixPool = () => null;
    FakeDifficultyAffixManager.effectiveSuffixPool = () => null;
  });

  describe('effectivePrefixPool', () =>
  {
    it('hands back the authored pool while the cache is cold', () =>
    {
      // Arrange- a cold cache means no layer has been evaluated yet, which is not the same as
      // every layer having no effect. The authored pool is the honest answer until then.

      // Act
      const pool = affixMetadataInstance.effectivePrefixPool();

      // Assert- reference identity, since the base seam returns a fresh wrapper every call.
      expect(pool.map).toBe(affixMetadataInstance.prefixMap);
      expect(pool.totalWeight).toBe(500);
    });

    it('substitutes the difficulty-adjusted pool once one exists', () =>
    {
      // Arrange- deliberately different values, so "substituted" and "passed through" differ.
      const adjusted = {
        map: new Map([ [ 1, 372 ], [ 2, 50 ] ]),
        totalWeight: 422,
      };
      FakeDifficultyAffixManager.effectivePrefixPool = () => adjusted;

      // Act
      const pool = affixMetadataInstance.effectivePrefixPool();

      // Assert
      expect(pool).toBe(adjusted);
    });
  });

  describe('effectiveSuffixPool', () =>
  {
    it('hands back the authored pool while the cache is cold', () =>
    {
      // Act
      const pool = affixMetadataInstance.effectiveSuffixPool();

      // Assert- the suffix map, not the prefix one; a slot-confused alias would be invisible if
      // both slots were checked against the same fixture.
      expect(pool.map).toBe(affixMetadataInstance.suffixMap);
      expect(pool.totalWeight).toBe(90);
    });

    it('substitutes the difficulty-adjusted pool once one exists', () =>
    {
      // Arrange
      const adjusted = {
        map: new Map([ [ 5, 70 ], [ 6, 25 ] ]),
        totalWeight: 95,
      };
      FakeDifficultyAffixManager.effectiveSuffixPool = () => adjusted;

      // Act
      const pool = affixMetadataInstance.effectiveSuffixPool();

      // Assert
      expect(pool).toBe(adjusted);
    });

    it('substitutes each slot independently of the other', () =>
    {
      // Arrange- only the prefix slot is adjusted, so an alias reading the wrong cache would give
      // the suffix slot the prefix pool.
      FakeDifficultyAffixManager.effectivePrefixPool = () => ({
        map: new Map([ [ 1, 372 ] ]),
        totalWeight: 372,
      });

      // Act
      const suffixPool = affixMetadataInstance.effectiveSuffixPool();

      // Assert
      expect(suffixPool.map).toBe(affixMetadataInstance.suffixMap);
    });
  });

  describe('the alias reaching an already-constructed instance', () =>
  {
    it('affects an instance built before the alias was installed', () =>
    {
      // Arrange- this instance predates the import in beforeAll, which is the real load order.
      FakeDifficultyAffixManager.effectivePrefixPool = () => ({
        map: new Map(),
        totalWeight: 0,
      });

      // Act
      const pool = affixMetadataInstance.effectivePrefixPool();

      // Assert- an own-property seam would have shadowed the alias and returned the authored pool.
      expect(pool.map).not.toBe(affixMetadataInstance.prefixMap);
      expect(Object.hasOwn(affixMetadataInstance, 'effectivePrefixPool')).toBe(false);
    });
  });
});

describe('JPassiveAffix_PluginMetadata without J-Passive-Affix (direct src import)', () =>
{
  it('leaves both pool seams untouched', async () =>
  {
    // Arrange- the pools belong to J-Passive-Affix; without it there is nothing to substitute.
    vi.resetModules();
    globalThis.J = { PASSIVE: { EXT: { DIFFICULTY: { Aliased: { JPassiveAffix_PluginMetadata: new Map() } } } } };
    const prefixSeam = () => null;
    const suffixSeam = () => null;
    globalThis.JPassiveAffix_PluginMetadata = function JPassiveAffix_PluginMetadata()
    {
    };
    globalThis.JPassiveAffix_PluginMetadata.prototype.effectivePrefixPool = prefixSeam;
    globalThis.JPassiveAffix_PluginMetadata.prototype.effectiveSuffixPool = suffixSeam;

    // Act
    await import('../../../../../../src/plugins/passive/ext/difficulty/_metadata/JPassiveAffix_PluginMetadata.js');

    // Assert
    expect(globalThis.JPassiveAffix_PluginMetadata.prototype.effectivePrefixPool).toBe(prefixSeam);
    expect(globalThis.JPassiveAffix_PluginMetadata.prototype.effectiveSuffixPool).toBe(suffixSeam);
  });
});
//endregion plugins/passive/ext/difficulty/_metadata/passive-affix-metadata.test.js
