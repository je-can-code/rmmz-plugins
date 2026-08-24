//region plugins/diff/ext/affix/_metadata/difficulty-affix-metadata.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  affixState,
  buildDiffAffixMetadata,
  installDiffAffixHostGlobals,
  installDifficultyMetadata,
  installGameSystemWithEnabledLayers,
  installPassiveAffixMetadata,
} from '../fixtures/install-diff-affix-host-globals.js';

/**
 * The whole of this extension's arithmetic lives here, and every piece of it fails quietly when it
 * fails at all - a mis-flattened pool still rolls, a dropped grant still spawns enemies, a drifting
 * total just returns no affix a little more often. So the assertions are pinned to observed values
 * rather than recomputed from the formulas, and each fixture is built so that a do-nothing
 * implementation produces a different number than the right one.
 */
describe('JDifficultyAffix_PluginMetadata (direct src import)', () =>
{
  let JDifficultyAffix_PluginMetadata;
  let AffixEffects;

  beforeAll(async () =>
  {
    vi.resetModules();

    installDiffAffixHostGlobals();

    ({ default: AffixEffects } = await import('../../../../../../src/plugins/diff/ext/affix/__models/AffixEffects.js'));
    await import('../../../../../../src/plugins/diff/ext/affix/__models/DifficultyMetadata.js');
    ({ default: JDifficultyAffix_PluginMetadata } =
      await import('../../../../../../src/plugins/diff/ext/affix/_metadata/_pluginMetadata.js'));
  });

  /**
   * A stand-in for one of J-Difficulty's built layer metadatas, carrying only the accessor pair this
   * extension installs on it.
   * @returns {object}
   */
  function difficultyLayer()
  {
    return Object.create(globalThis.DifficultyMetadata.prototype);
  }

  /**
   * Wires up a difficulty world: one layer per raw config, decorated by constructing the metadata.
   * @param {object} rawConfigsByKey Layer key to that layer's raw configuration blob.
   * @param {string} defaultKey Which layer is the default.
   * @returns {object} The constructed extension metadata.
   */
  function metadataForLayers(rawConfigsByKey, defaultKey = 'default')
  {
    const allRawConfigs = new Map(Object.entries(rawConfigsByKey));
    const allMetadatas = new Map(Object.keys(rawConfigsByKey)
      .map(key => [ key, difficultyLayer() ]));

    installDifficultyMetadata(allRawConfigs, allMetadatas, defaultKey);

    return buildDiffAffixMetadata(JDifficultyAffix_PluginMetadata);
  }

  beforeEach(() =>
  {
    // every scenario builds its own difficulty world; nothing should survive between them.
    delete globalThis.$gameSystem;
    delete globalThis.$dataStates;
  });

  //region decoration
  describe('decorateDifficultyMetadatas', () =>
  {
    it('attaches the effects of a layer that declared a block', () =>
    {
      // Arrange & Act
      const metadata = metadataForLayers({
        default: { key: 'default' },
        drive: {
          key: 'drive',
          affixEffects: { prefixChance: 150 },
        },
      });

      // Assert
      const layer = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('drive');
      expect(layer.getAffixEffects().prefixChance).toBe(150);
    });

    it('leaves a layer that declared no block at null', () =>
    {
      // Arrange & Act- the near-miss: an undecorated layer sitting beside a decorated one.
      metadataForLayers({
        plain: { key: 'plain' },
        drive: {
          key: 'drive',
          affixEffects: { prefixChance: 150 },
        },
      });

      // Assert
      const plainLayer = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('plain');
      expect(plainLayer.getAffixEffects()).toBe(null);
    });
  });
  //endregion decoration

  //region enabled layers
  describe('enabledAffixEffects', () =>
  {
    it('collects the effects of enabled layers and skips disabled ones', () =>
    {
      // Arrange- both layers declare a block, so only enabled-ness can separate them.
      const metadata = metadataForLayers({
        default: { key: 'default' },
        on: {
          key: 'on',
          affixEffects: { prefixChance: 150 },
        },
        off: {
          key: 'off',
          affixEffects: { prefixChance: 900 },
        },
      });
      installGameSystemWithEnabledLayers([ 'on' ], [ 'off' ]);

      // Act
      const effects = metadata.enabledAffixEffects();

      // Assert
      expect(effects.length).toBe(1);
      expect(effects[0].prefixChance).toBe(150);
    });

    it('skips an enabled layer that declared no block', () =>
    {
      // Arrange
      const metadata = metadataForLayers({
        default: { key: 'default' },
        plain: { key: 'plain' },
        drive: {
          key: 'drive',
          affixEffects: { flatten: 40 },
        },
      });
      installGameSystemWithEnabledLayers([ 'plain', 'drive' ]);

      // Act
      const effects = metadata.enabledAffixEffects();

      // Assert- contributing nothing, rather than contributing an identity block.
      expect(effects.length).toBe(1);
      expect(effects[0].flatten).toBe(40);
    });

    it('falls back to the default layer when nothing at all is enabled', () =>
    {
      // Arrange- mirrors buildAppliedDifficulty, which applies the default layer's parameter
      // effects in exactly this situation. Diverging would stop the affix half while the stat
      // half kept going.
      const metadata = metadataForLayers({
        default: {
          key: 'default',
          affixEffects: { prefixChance: 120 },
        },
        drive: {
          key: 'drive',
          affixEffects: { prefixChance: 900 },
        },
      });
      installGameSystemWithEnabledLayers([], [ 'drive' ]);

      // Act
      const effects = metadata.enabledAffixEffects();

      // Assert
      expect(effects.length).toBe(1);
      expect(effects[0].prefixChance).toBe(120);
    });

    it('yields nothing when nothing is enabled and the default declared no block', () =>
    {
      // Arrange
      const metadata = metadataForLayers({ default: { key: 'default' } });
      installGameSystemWithEnabledLayers([]);

      // Act
      const effects = metadata.enabledAffixEffects();

      // Assert
      expect(effects.length).toBe(0);
    });
  });
  //endregion enabled layers

  //region combination
  describe('combinedPrefixChanceFactor', () =>
  {
    it('is identity when no layer contributes', () =>
    {
      // Arrange
      const metadata = metadataForLayers({ default: { key: 'default' } });

      // Act
      const factor = metadata.combinedPrefixChanceFactor([]);

      // Assert
      expect(factor).toBe(1);
    });

    it('converts a single percent into a factor', () =>
    {
      // Arrange
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = [ AffixEffects.fromRaw('a', { prefixChance: 150 }) ];

      // Act
      const factor = metadata.combinedPrefixChanceFactor(effects);

      // Assert
      expect(factor).toBe(1.5);
    });

    it('multiplies across layers rather than adding them', () =>
    {
      // Arrange- 1.5 x 1.5 is 2.25; summing would give 2, and averaging would give 1.5.
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = [
        AffixEffects.fromRaw('a', { prefixChance: 150 }),
        AffixEffects.fromRaw('b', { prefixChance: 150 }),
      ];

      // Act
      const factor = metadata.combinedPrefixChanceFactor(effects);

      // Assert
      expect(factor).toBe(2.25);
    });
  });

  describe('combinedSuffixChanceFactor', () =>
  {
    it('reads the suffix field rather than the prefix one', () =>
    {
      // Arrange- the two fields differ, so a method reading the wrong one gives the wrong answer.
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = [ AffixEffects.fromRaw('a', {
        prefixChance: 900,
        suffixChance: 200,
      }) ];

      // Act
      const factor = metadata.combinedSuffixChanceFactor(effects);

      // Assert
      expect(factor).toBe(2);
    });

    it('multiplies across layers', () =>
    {
      // Arrange
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = [
        AffixEffects.fromRaw('a', { suffixChance: 200 }),
        AffixEffects.fromRaw('b', { suffixChance: 50 }),
      ];

      // Act
      const factor = metadata.combinedSuffixChanceFactor(effects);

      // Assert
      expect(factor).toBe(1);
    });
  });

  describe('combinedFlatten', () =>
  {
    it('is zero when no layer contributes', () =>
    {
      // Arrange
      const metadata = metadataForLayers({ default: { key: 'default' } });

      // Act
      const flatten = metadata.combinedFlatten([]);

      // Assert
      expect(flatten).toBe(0);
    });

    it('converts a single percent into a factor', () =>
    {
      // Arrange
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = [ AffixEffects.fromRaw('a', { flatten: 40 }) ];

      // Act
      const flatten = metadata.combinedFlatten(effects);

      // Assert
      expect(flatten).toBeCloseTo(0.4, 10);
    });

    it('combines two layers as a complement product rather than a sum', () =>
    {
      // Arrange- each layer closes part of the remaining distance to the mean, so what survives
      // both is 60% of 60%. Summing gives 0.8 and averaging gives 0.4; only 0.64 is right.
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = [
        AffixEffects.fromRaw('a', { flatten: 40 }),
        AffixEffects.fromRaw('b', { flatten: 40 }),
      ];

      // Act
      const flatten = metadata.combinedFlatten(effects);

      // Assert
      expect(flatten).toBeCloseTo(0.64, 10);
    });

    it('saturates at one when any layer flattens completely', () =>
    {
      // Arrange- a full flatten leaves no distance for a later layer to close, and the result
      // must not exceed 1 no matter what accompanies it.
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = [
        AffixEffects.fromRaw('a', { flatten: 100 }),
        AffixEffects.fromRaw('b', { flatten: 50 }),
      ];

      // Act
      const flatten = metadata.combinedFlatten(effects);

      // Assert
      expect(flatten).toBe(1);
    });
  });

  describe('combinedPrefixGrants / combinedSuffixGrants', () =>
  {
    /**
     * Builds effects whose prefix grants are already split, as they would be after boot validation.
     * @param {Array<[number, number]>} pairs State id and weight pairs.
     * @returns {AffixEffects}
     */
    function withPrefixGrants(pairs)
    {
      const effects = AffixEffects.fromRaw('a-layer', {});
      pairs.forEach(([ stateId, weight ]) => effects.addPrefixGrant(stateId, weight));
      return effects;
    }

    it('unions grants from separate layers', () =>
    {
      // Arrange
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = [ withPrefixGrants([ [ 306, 50 ] ]), withPrefixGrants([ [ 307, 25 ] ]) ];

      // Act
      const grants = metadata.combinedPrefixGrants(effects);

      // Assert
      expect(grants.get(306)).toBe(50);
      expect(grants.get(307)).toBe(25);
      expect(grants.size).toBe(2);
    });

    it('keeps the larger weight when two layers grant the same state', () =>
    {
      // Arrange- summing would give 75, and last-wins would give 25.
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = [ withPrefixGrants([ [ 306, 50 ] ]), withPrefixGrants([ [ 306, 25 ] ]) ];

      // Act
      const grants = metadata.combinedPrefixGrants(effects);

      // Assert
      expect(grants.get(306)).toBe(50);
      expect(grants.size).toBe(1);
    });

    it('keeps the larger weight regardless of which layer came first', () =>
    {
      // Arrange- the reversed order of the previous case, so "kept the max" and "kept the first"
      // cannot both pass.
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = [ withPrefixGrants([ [ 306, 25 ] ]), withPrefixGrants([ [ 306, 50 ] ]) ];

      // Act
      const grants = metadata.combinedPrefixGrants(effects);

      // Assert
      expect(grants.get(306)).toBe(50);
    });

    it('reads the suffix side rather than the prefix side', () =>
    {
      // Arrange- one layer carrying a grant in each slot at different weights.
      const metadata = metadataForLayers({ default: { key: 'default' } });
      const effects = AffixEffects.fromRaw('a-layer', {});
      effects.addPrefixGrant(306, 50);
      effects.addSuffixGrant(356, 25);

      // Act
      const grants = metadata.combinedSuffixGrants([ effects ]);

      // Assert
      expect(grants.get(356)).toBe(25);
      expect(grants.has(306)).toBe(false);
    });
  });
  //endregion combination

  //region flattening
  describe('flattenPool', () =>
  {
    it('leaves the pool untouched at a flatten of zero', () =>
    {
      // Arrange
      const pool = new Map([ [ 1, 500 ], [ 2, 10 ] ]);

      // Act
      JDifficultyAffix_PluginMetadata.flattenPool(pool, 0);

      // Assert
      expect(pool.get(1)).toBe(500);
      expect(pool.get(2)).toBe(10);
    });

    it('pulls weights above the mean down, below the mean up, and leaves the mean itself alone', () =>
    {
      // Arrange- three entries averaging exactly 300, so one sits above the mean, one below, and
      // one on it. Without the at-mean entry, "interpolate toward the mean" and "swap the two
      // extremes" produce identical results and no assertion can tell them apart.
      const pool = new Map([ [ 1, 500 ], [ 2, 300 ], [ 3, 100 ] ]);

      // Act
      JDifficultyAffix_PluginMetadata.flattenPool(pool, 0.5);

      // Assert- observed values, pinned: 500 -> 400, 300 -> 300, 100 -> 200.
      expect(pool.get(1)).toBe(400);
      expect(pool.get(2)).toBe(300);
      expect(pool.get(3)).toBe(200);
    });

    it('makes every drawable weight equal at a full flatten', () =>
    {
      // Arrange
      const pool = new Map([ [ 1, 500 ], [ 2, 200 ], [ 3, 100 ] ]);

      // Act
      JDifficultyAffix_PluginMetadata.flattenPool(pool, 1);

      // Assert
      expect(pool.get(1))
        .toBeCloseTo(266.667, 3);
      expect(pool.get(2))
        .toBeCloseTo(266.667, 3);
      expect(pool.get(3))
        .toBeCloseTo(266.667, 3);
    });

    it('preserves the pool total', () =>
    {
      // Arrange- sum preservation is what makes the mean invariant, which is in turn what makes
      // combining layers order-independent. If this stops holding, the complement product is wrong.
      const pool = new Map([ [ 1, 500 ], [ 2, 200 ], [ 3, 100 ] ]);

      // Act
      JDifficultyAffix_PluginMetadata.flattenPool(pool, 0.4);

      // Assert
      let total = 0;
      pool.forEach(weight => total += weight);
      expect(total)
        .toBeCloseTo(800, 10);
    });

    it('excludes reserved zero-weight entries from the interpolation entirely', () =>
    {
      // Arrange- were the zero included, the mean would drop and it would itself be lifted off
      // zero, unlocking a reserved affix that no layer granted.
      const pool = new Map([ [ 1, 300 ], [ 2, 100 ], [ 3, 0 ] ]);

      // Act
      JDifficultyAffix_PluginMetadata.flattenPool(pool, 1);

      // Assert- mean of the two drawable entries is 200, and the reserved entry stays at zero.
      expect(pool.get(1)).toBe(200);
      expect(pool.get(2)).toBe(200);
      expect(pool.get(3)).toBe(0);
    });

    it('leaves a pool with nothing drawable alone rather than producing NaN', () =>
    {
      // Arrange- an all-reserved pool has no mean. Dividing anyway poisons every weight, and the
      // roll then returns null forever with nothing reporting a problem.
      const pool = new Map([ [ 1, 0 ], [ 2, 0 ] ]);

      // Act
      JDifficultyAffix_PluginMetadata.flattenPool(pool, 1);

      // Assert
      expect(pool.get(1)).toBe(0);
      expect(pool.get(2)).toBe(0);
    });
  });
  //endregion flattening

  //region pool assembly
  describe('buildPool', () =>
  {
    it('copies the base pool rather than editing it', () =>
    {
      // Arrange- the base pool belongs to J-Passive-Affix and is its only record of how the
      // affixes were authored; flattening it in place would compound on every rebuild.
      const basePool = new Map([ [ 1, 500 ], [ 2, 100 ] ]);

      // Act
      JDifficultyAffix_PluginMetadata.buildPool(basePool, 0.5, new Map());

      // Assert
      expect(basePool.get(1)).toBe(500);
      expect(basePool.get(2)).toBe(100);
    });

    it('overlays a granted weight onto a reserved entry', () =>
    {
      // Arrange- an ungranted reserved sibling sits alongside, so "granted this one" and
      // "granted everything" cannot look the same.
      const basePool = new Map([ [ 1, 100 ], [ 2, 0 ], [ 3, 0 ] ]);

      // Act
      const pool = JDifficultyAffix_PluginMetadata.buildPool(basePool, 0, new Map([ [ 2, 50 ] ]));

      // Assert
      expect(pool.map.get(2)).toBe(50);
      expect(pool.map.get(3)).toBe(0);
    });

    it('does not flatten a granted weight', () =>
    {
      // Arrange- a full flatten alongside a grant. Were grants part of the interpolation, the
      // granted weight would be dragged to the mean instead of standing at what was declared.
      const basePool = new Map([ [ 1, 300 ], [ 2, 100 ], [ 3, 0 ] ]);

      // Act
      const pool = JDifficultyAffix_PluginMetadata.buildPool(basePool, 1, new Map([ [ 3, 25 ] ]));

      // Assert
      expect(pool.map.get(1)).toBe(200);
      expect(pool.map.get(2)).toBe(200);
      expect(pool.map.get(3)).toBe(25);
    });

    it('sums the finished map for the total rather than carrying the base total forward', () =>
    {
      // Arrange- a grant changes the sum, and any drift between the map and its total lets the
      // roll overshoot the entries and return nothing at all.
      const basePool = new Map([ [ 1, 100 ], [ 2, 0 ] ]);

      // Act
      const pool = JDifficultyAffix_PluginMetadata.buildPool(basePool, 0, new Map([ [ 2, 50 ] ]));

      // Assert
      expect(pool.totalWeight).toBe(150);
    });

    it('keeps the total consistent with a flattened map', () =>
    {
      // Arrange
      const basePool = new Map([ [ 1, 500 ], [ 2, 200 ], [ 3, 100 ] ]);

      // Act
      const pool = JDifficultyAffix_PluginMetadata.buildPool(basePool, 0.4, new Map());

      // Assert
      expect(pool.totalWeight)
        .toBeCloseTo(800, 10);
    });
  });
  //endregion pool assembly

  //region caching
  describe('buildEffectivePools', () =>
  {
    it('starts with both caches cold', () =>
    {
      // Arrange & Act- a cold cache is what tells the seam to hand back the untouched base pool,
      // which is the honest answer before any layer has been evaluated.
      const metadata = metadataForLayers({ default: { key: 'default' } });

      // Assert
      expect(metadata.effectivePrefixPool()).toBe(null);
      expect(metadata.effectiveSuffixPool()).toBe(null);
    });

    it('builds both slots from the currently enabled layers', () =>
    {
      // Arrange- the prefix and suffix pools differ, so a build that filled one from the other
      // would produce the wrong numbers rather than the same ones.
      const metadata = metadataForLayers({
        default: { key: 'default' },
        drive: {
          key: 'drive',
          affixEffects: { flatten: 100 },
        },
      });
      installGameSystemWithEnabledLayers([ 'drive' ]);
      installPassiveAffixMetadata(
        new Map([ [ 1, 300 ], [ 2, 100 ] ]),
        new Map([ [ 5, 90 ], [ 6, 10 ] ]));

      // Act
      metadata.buildEffectivePools();

      // Assert
      expect(metadata.effectivePrefixPool().map.get(1)).toBe(200);
      expect(metadata.effectiveSuffixPool().map.get(5)).toBe(50);
    });

    it('applies each slot its own grants', () =>
    {
      // Arrange- one reserved state per slot, granted at different weights.
      const metadata = metadataForLayers({
        default: { key: 'default' },
        drive: {
          key: 'drive',
          affixEffects: {},
        },
      });

      const driveEffects = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('drive')
        .getAffixEffects();
      driveEffects.addPrefixGrant(2, 50);
      driveEffects.addSuffixGrant(6, 25);

      installGameSystemWithEnabledLayers([ 'drive' ]);
      installPassiveAffixMetadata(
        new Map([ [ 1, 100 ], [ 2, 0 ] ]),
        new Map([ [ 5, 100 ], [ 6, 0 ] ]));

      // Act
      metadata.buildEffectivePools();

      // Assert- neither slot picked up the other's grant.
      expect(metadata.effectivePrefixPool().map.get(2)).toBe(50);
      expect(metadata.effectivePrefixPool().map.has(6)).toBe(false);
      expect(metadata.effectiveSuffixPool().map.get(6)).toBe(25);
      expect(metadata.effectiveSuffixPool().map.has(2)).toBe(false);
    });
  });
  //endregion caching

  //region validation
  describe('assertGrantsAreValid', () =>
  {
    it('sorts a prefix grant into the prefix slot and no other', () =>
    {
      // Arrange
      const metadata = metadataForLayers({
        default: { key: 'default' },
        drive: {
          key: 'drive',
          affixEffects: { grants: { '306': 50 } },
        },
      });
      globalThis.$dataStates = [ null, affixState(1, true, false, 100) ];
      globalThis.$dataStates[306] = affixState(306, true, false, 0);

      // Act
      metadata.assertGrantsAreValid();

      // Assert- asserting only the prefix map would let "sorted into both" pass too.
      const effects = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('drive')
        .getAffixEffects();
      expect(effects.prefixGrants()
        .get(306)).toBe(50);
      expect(effects.suffixGrants()
        .has(306)).toBe(false);
    });

    it('sorts a suffix grant into the suffix slot and no other', () =>
    {
      // Arrange
      const metadata = metadataForLayers({
        default: { key: 'default' },
        drive: {
          key: 'drive',
          affixEffects: { grants: { '356': 25 } },
        },
      });
      globalThis.$dataStates = [ null ];
      globalThis.$dataStates[356] = affixState(356, false, true, 0);

      // Act
      metadata.assertGrantsAreValid();

      // Assert
      const effects = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('drive')
        .getAffixEffects();
      expect(effects.suffixGrants()
        .get(356)).toBe(25);
      expect(effects.prefixGrants()
        .has(356)).toBe(false);
    });

    it('sorts a dual-tagged grant into both slots', () =>
    {
      // Arrange- a state carrying both tags is genuinely a member of both pools, so a grant
      // naming it means to unlock it wherever it lives.
      const metadata = metadataForLayers({
        default: { key: 'default' },
        drive: {
          key: 'drive',
          affixEffects: { grants: { '400': 30 } },
        },
      });
      globalThis.$dataStates = [ null ];
      globalThis.$dataStates[400] = affixState(400, true, true, 0);

      // Act
      metadata.assertGrantsAreValid();

      // Assert
      const effects = globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('drive')
        .getAffixEffects();
      expect(effects.prefixGrants()
        .get(400)).toBe(30);
      expect(effects.suffixGrants()
        .get(400)).toBe(30);
    });

    it('skips a layer that declared no affix block', () =>
    {
      // Arrange
      const metadata = metadataForLayers({
        default: { key: 'default' },
        plain: { key: 'plain' },
      });
      globalThis.$dataStates = [ null ];

      // Act
      metadata.assertGrantsAreValid();

      // Assert- nothing to sort, and nothing decorated.
      expect(globalThis.J.DIFFICULTY.Metadata.allMetadatas.get('plain')
        .getAffixEffects()).toBe(null);
    });

    it('validates layers that are not enabled', () =>
    {
      // Arrange- a broken grant on a layer nobody turns on is exactly as broken as one on a layer
      // everybody uses, and the value of a boot throw is that it fires before anyone plays.
      const metadata = metadataForLayers({
        default: { key: 'default' },
        never_used: {
          key: 'never_used',
          affixEffects: { grants: { '999': 50 } },
        },
      });
      globalThis.$dataStates = [ null ];
      installGameSystemWithEnabledLayers([], [ 'never_used' ]);

      // Act & Assert
      expect(() => metadata.assertGrantsAreValid())
        .toThrow(/layer \[never_used\] grants state \[999\], which does not exist/);
    });

    it('throws on a grant naming a state that does not exist', () =>
    {
      // Arrange
      const metadata = metadataForLayers({
        default: { key: 'default' },
        drive: {
          key: 'drive',
          affixEffects: { grants: { '999': 50 } },
        },
      });
      globalThis.$dataStates = [ null, affixState(1, true, false, 0) ];

      // Act & Assert
      expect(() => metadata.assertGrantsAreValid())
        .toThrow(/layer \[drive\] grants state \[999\], which does not exist/);
    });

    it('throws on a grant naming a state that is neither a prefix nor a suffix', () =>
    {
      // Arrange- an ordinary passive state has no pool for the weight to land in.
      const metadata = metadataForLayers({
        default: { key: 'default' },
        drive: {
          key: 'drive',
          affixEffects: { grants: { '2': 50 } },
        },
      });
      globalThis.$dataStates = [ null, affixState(1, true, false, 0), affixState(2, false, false, 0) ];

      // Act & Assert
      expect(() => metadata.assertGrantsAreValid())
        .toThrow(/grants state \[2\], which is neither <enemy-prefix> nor <enemy-suffix>/);
    });

    it('throws on a grant naming a state that already rolls at its own weight', () =>
    {
      // Arrange- granting is how a reserved affix becomes reachable. Applied to one that already
      // rolls, it would silently overwrite an authored weight instead.
      const metadata = metadataForLayers({
        default: { key: 'default' },
        drive: {
          key: 'drive',
          affixEffects: { grants: { '1': 50 } },
        },
      });
      globalThis.$dataStates = [ null, affixState(1, true, false, 500) ];

      // Act & Assert
      expect(() => metadata.assertGrantsAreValid())
        .toThrow(/grants state \[1\], which already has <affix-weight:500>/);
    });
  });
  //endregion validation
});
//endregion plugins/diff/ext/affix/_metadata/difficulty-affix-metadata.test.js