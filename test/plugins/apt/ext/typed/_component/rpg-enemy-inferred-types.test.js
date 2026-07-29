//region plugins/apt/ext/typed/_component/rpg-enemy-inferred-types.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Enemy "types" are not authored directly — they are inferred from the element-rate traits already on
 * the database row, using naming conventions for the element list. That makes this file the closest
 * thing to a spec for what an enemy *is*, taxonomically, in play.
 */
describe('RPG_Enemy inferred typed elements (direct src import)', () =>
{
  /** @type {typeof import('../../../../../../src/plugins/apt/ext/typed/_models/ApTypeKey.js').default} */
  let ApTypeKey;

  beforeAll(async () =>
  {
    vi.resetModules();

    ({ default: globalThis.RPGManager } = await import('../../../../../../src/plugins/_base/managers/RPGManager.js'));
    ({ default: ApTypeKey } = await import('../../../../../../src/plugins/apt/ext/typed/_models/ApTypeKey.js'));

    globalThis.ApManager = { resolveDomainId: vi.fn(() => NaN) };

    function RPG_Enemy()
    {
    }

    globalThis.RPG_Enemy = RPG_Enemy;

    await import('../../../../../../src/plugins/apt/ext/typed/database/RPG_Enemy.js');
  });

  beforeEach(() =>
  {
    // the element list drives both the loop bounds and the naming-convention classification; index 0
    // is RMMZ's unused "no element" slot.
    globalThis.$dataSystem = {
      elements: [ '', 'Fire', 'Ice', 'Thunder', 'vs Undead', 'x Flying', 'tool-Axe', 'Physical' ],
    };

    globalThis.J = {
      APT: {
        EXT: {
          TYPED: {
            RegExp: { ApTypedReward: /<apTyped:[ ]?(\[\d+,[ ]?[A-Za-z]+,[ ]?[A-Za-z0-9_\- ]+])>/gi },
            Metadata: {
              ResistThreshold: 1.0,
              SlayerWeaknessThreshold: 1.0,
              ExcludedAlignmentElements: [],
            },
          },
        },
      },
    };

    globalThis.$gameTemp = {
      _cache: new Map(),
      getAptTypedInferredEnemyTypes(enemyId)
      {
        return this._cache.get(enemyId);
      },
      setAptTypedInferredEnemyTypes(enemyId, ids)
      {
        this._cache.set(enemyId, ids);
      },
    };
  });

  /**
   * Builds an enemy stand-in carrying the given element-rate traits.
   * @param {Array<{code: number, dataId: number, value: number}>} traits The database traits.
   * @param {number} [id] The enemy id.
   * @returns {object}
   */
  const buildEnemy = (traits, id = 1) => Object.assign(Object.create(globalThis.RPG_Enemy.prototype), {
    id,
    meta: {},
    note: '',
    traits,
  });

  /**
   * Builds an element-rate trait.
   * @param {number} elementId The element the rate applies to.
   * @param {number} rate The multiplicative rate.
   * @returns {{code: number, dataId: number, value: number}}
   */
  const elementRate = (elementId, rate) => ({ code: 11, dataId: elementId, value: rate });

  describe('computeInferredTypedElementIds', () =>
  {
    it('infers no types for an enemy with no element traits at all', () =>
    {
      // Arrange- every rate defaults to 1.0, which is neither resistant nor weak.
      const enemy = buildEnemy([]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('treats resistance to a standard element as an alignment with it', () =>
    {
      // Arrange- a creature that shrugs off fire is, in this system, aligned to fire.
      const enemy = buildEnemy([ elementRate(1, 0.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([ 1 ]);
    });

    it('does not treat weakness to a standard element as an alignment', () =>
    {
      // Arrange
      const enemy = buildEnemy([ elementRate(1, 2.0) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('does not treat an exactly-neutral rate as an alignment', () =>
    {
      // Arrange- the comparison is strict, so sitting exactly on the threshold infers nothing.
      const enemy = buildEnemy([ elementRate(1, 1.0) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('treats weakness to a "vs " element as slayer taxonomy', () =>
    {
      // Arrange- being vulnerable to "vs Undead" is what marks a creature as undead.
      const enemy = buildEnemy([ elementRate(4, 1.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([ 4 ]);
    });

    it('treats weakness to an "x " element as an attribute', () =>
    {
      // Arrange
      const enemy = buildEnemy([ elementRate(5, 1.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([ 5 ]);
    });

    it('treats weakness to a "tool-" element as a tool taxonomy', () =>
    {
      // Arrange
      const enemy = buildEnemy([ elementRate(6, 1.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([ 6 ]);
    });

    it('does not infer taxonomy from resistance to a prefixed element', () =>
    {
      // Arrange- the prefixed path is the mirror of the standard one: weakness marks membership,
      // resistance says nothing.
      const enemy = buildEnemy([ elementRate(4, 0.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('does not infer taxonomy from an exactly-neutral prefixed rate', () =>
    {
      // Arrange
      const enemy = buildEnemy([ elementRate(4, 1.0) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('multiplies several rate traits targeting the same element', () =>
    {
      // Arrange- two separate half-rate traits compound to a quarter, well under the threshold.
      const enemy = buildEnemy([ elementRate(1, 0.5), elementRate(1, 0.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([ 1 ]);
    });

    it('ignores traits that are not element rates', () =>
    {
      // Arrange- an enemy row carries many trait codes; only code 11 describes element rates.
      const enemy = buildEnemy([ { code: 22, dataId: 1, value: 0.1 } ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('tolerates a database row with no traits array at all', () =>
    {
      // Arrange- hand-edited or partially-migrated rows can be missing it entirely.
      const enemy = buildEnemy(undefined);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('skips a null entry in the traits array', () =>
    {
      // Arrange
      const enemy = buildEnemy([ null, elementRate(1, 0.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([ 1 ]);
    });

    it('skips element slots with no name', () =>
    {
      // Arrange- index 0 is RMMZ's empty "no element" entry and must never be inferred.
      const enemy = buildEnemy([ elementRate(0, 0.1) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('honours an exclusion given as an element id', () =>
    {
      // Arrange- "Physical" resistance is armour, not an elemental alignment, so it gets excluded.
      globalThis.J.APT.EXT.TYPED.Metadata.ExcludedAlignmentElements = [ 7 ];
      const enemy = buildEnemy([ elementRate(7, 0.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('honours an exclusion given as an element name', () =>
    {
      // Arrange- authoring by name is friendlier than by id, and matching is case-insensitive.
      globalThis.J.APT.EXT.TYPED.Metadata.ExcludedAlignmentElements = [ 'physical' ];
      const enemy = buildEnemy([ elementRate(7, 0.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('matches a name exclusion regardless of authored casing', () =>
    {
      // Arrange
      globalThis.J.APT.EXT.TYPED.Metadata.ExcludedAlignmentElements = [ '  PHYSICAL  ' ];
      const enemy = buildEnemy([ elementRate(7, 0.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('does not let exclusions suppress the prefixed taxonomy path', () =>
    {
      // Arrange- exclusions exist to stop armour reading as alignment; slayer tags are a different
      // concern and are deliberately left alone.
      globalThis.J.APT.EXT.TYPED.Metadata.ExcludedAlignmentElements = [ 4, 'vs undead' ];
      const enemy = buildEnemy([ elementRate(4, 1.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([ 4 ]);
    });

    it('collects alignments and taxonomy together in element order', () =>
    {
      // Arrange- a fire-aligned undead is both, and the output follows element-list order rather
      // than trait order.
      const enemy = buildEnemy([ elementRate(4, 1.5), elementRate(1, 0.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([ 1, 4 ]);
    });

    it('reports an element only once even when several rules would include it', () =>
    {
      // Arrange- a prefixed element that is both excluded by name and weak still enters the list once.
      // The de-duplication pass is what keeps a repeated id from multiplying the AP it grants.
      globalThis.$dataSystem.elements = [ '', 'Fire', 'Fire' ];
      const enemy = buildEnemy([ elementRate(1, 0.5), elementRate(2, 0.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert- two distinct slots sharing a name are still distinct ids.
      expect(ids).toEqual([ 1, 2 ]);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('honours a non-default resistance threshold', () =>
    {
      // Arrange- raising the bar means merely-slight resistance now counts as alignment.
      globalThis.J.APT.EXT.TYPED.Metadata.ResistThreshold = 0.9;
      const enemy = buildEnemy([ elementRate(1, 0.95) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });

    it('honours a non-default slayer weakness threshold', () =>
    {
      // Arrange- requiring a bigger weakness before taxonomy is inferred.
      globalThis.J.APT.EXT.TYPED.Metadata.SlayerWeaknessThreshold = 2.0;
      const enemy = buildEnemy([ elementRate(4, 1.5) ]);

      // Act
      const ids = enemy.computeInferredTypedElementIds();

      // Assert
      expect(ids).toEqual([]);
    });
  });

  describe('typedApRewards amount validation', () =>
  {
    it('discards an explicit reward authored with a zero amount', () =>
    {
      // Arrange- the tag regex only accepts digits, so a zero is the only way to author a
      // non-positive amount. Granting it would create a reward entry that awards nothing.
      globalThis.ApManager.resolveDomainId = vi.fn(() => 4);
      const enemy = Object.assign(Object.create(globalThis.RPG_Enemy.prototype), {
        id: 1,
        meta: {},
        note: '<apTyped:[0, element, fire]>',
        traits: [],
      });

      // Act
      const rewards = enemy.typedApRewards();

      // Assert
      expect(rewards).toEqual([]);
    });

    it('keeps an explicit reward authored with a positive amount', () =>
    {
      // Arrange
      globalThis.ApManager.resolveDomainId = vi.fn(() => 4);
      const enemy = Object.assign(Object.create(globalThis.RPG_Enemy.prototype), {
        id: 1,
        meta: {},
        note: '<apTyped:[6, element, fire]>',
        traits: [],
      });

      // Act
      const rewards = enemy.typedApRewards();

      // Assert
      expect(rewards).toHaveLength(1);
    });
  });

  describe('inferredTypedElements', () =>
  {
    it('wraps computed ids as element-domain type keys', () =>
    {
      // Arrange
      const enemy = buildEnemy([ elementRate(1, 0.5) ]);

      // Act
      const keys = enemy.inferredTypedElements();

      // Assert
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBeInstanceOf(ApTypeKey);
      expect(keys[0].domain).toBe(ApTypeKey.DomainType.Element);
      expect(keys[0].id).toBe(1);
    });

    it('caches the computed ids on first use', () =>
    {
      // Arrange- this runs per enemy encounter, so recomputing from traits every time would be waste.
      const enemy = buildEnemy([ elementRate(1, 0.5) ], 7);

      // Act
      enemy.inferredTypedElements();

      // Assert
      expect(globalThis.$gameTemp.getAptTypedInferredEnemyTypes(7)).toEqual([ 1 ]);
    });

    it('serves a repeat lookup from cache instead of recomputing', () =>
    {
      // Arrange
      const enemy = buildEnemy([ elementRate(1, 0.5) ], 7);
      enemy.inferredTypedElements();
      const computeSpy = vi.spyOn(enemy, 'computeInferredTypedElementIds');

      // Act
      const keys = enemy.inferredTypedElements();

      // Assert
      expect(computeSpy).not.toHaveBeenCalled();
      expect(keys[0].id).toBe(1);

      computeSpy.mockRestore();
    });

    it('caches per enemy id rather than globally', () =>
    {
      // Arrange- two different enemies must not share one inference result.
      const undead = buildEnemy([ elementRate(4, 1.5) ], 1);
      const fireAligned = buildEnemy([ elementRate(1, 0.5) ], 2);

      // Act
      const undeadKeys = undead.inferredTypedElements();
      const fireKeys = fireAligned.inferredTypedElements();

      // Assert
      expect(undeadKeys[0].id).toBe(4);
      expect(fireKeys[0].id).toBe(1);
    });

    it('returns an empty list for an enemy with no inferable types', () =>
    {
      // Arrange- an empty result still caches, so the empty computation is not repeated either.
      const enemy = buildEnemy([], 9);

      // Act
      const keys = enemy.inferredTypedElements();

      // Assert
      expect(keys).toEqual([]);
      expect(globalThis.$gameTemp.getAptTypedInferredEnemyTypes(9)).toEqual([]);
    });
  });
});
//endregion plugins/apt/ext/typed/_component/rpg-enemy-inferred-types.test.js
