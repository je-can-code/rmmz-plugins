//region plugins/abs/core/managers/jabs-enemy-pool.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * JABS_EnemyPool's only same-ship import is JABS_Engine, and all it wants from there is the enemy
 * clone list, so the engine is mocked down to that one static. RPGManager is a J-Base global: the
 * weighted roll itself is covered in J-Base, and what matters here is what gets handed to it.
 */
describe('JABS_EnemyPool (unit, the engine mocked down to its clone list)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/abs/core/managers/JABS_EnemyPool.js').default} */
  let JABS_EnemyPool;
  let getEnemyCloneList;
  let warnSpy;
  let noteWeights;

  beforeAll(async () =>
  {
    vi.resetModules();

    getEnemyCloneList = vi.fn();
    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_Engine.js', () => ({
      default: { getEnemyCloneList },
    }));

    globalThis.J = {
      ABS: {
        Metadata: { DefaultEnemyPoolHomeWeight: 85 },
        RegExp: { EnemyWeightOverride: 'the-override-regex' },
      },
    };

    ({ default: JABS_EnemyPool } = await import(
      '../../../../../src/plugins/abs/core/managers/JABS_EnemyPool.js'));
  });

  beforeEach(() =>
  {
    // the enemy map is keyed by event id: 302 and 303 have events here, and 304 deliberately does not.
    const clones = [];
    clones[301] = { pages: [ 'page-301' ] };
    clones[302] = { pages: [ 'page-302' ] };
    clones[303] = { pages: [ 'page-303' ] };
    getEnemyCloneList.mockReset();
    getEnemyCloneList.mockReturnValue(clones);

    // what each enemy's own note says about it.
    noteWeights = { 301: 85, 302: 8, 303: 4 };
    globalThis.$gameEnemies = { enemy: vi.fn(enemyId => ({ enemyWeight: () => noteWeights[enemyId] })) };
    globalThis.$dataMap = { note: 'the-map-note' };
    globalThis.RPGManager = {
      weightedMapChoice: vi.fn(() => 302),
      getArraysFromNotesByRegex: vi.fn(() => []),
    };

    // Diagnostics is installed globally by test setup; per-repo convention the spy is restored
    // manually per test rather than via restoreAllMocks.
    warnSpy = vi.spyOn(globalThis.Diagnostics, 'warn')
      .mockImplementation(() => {});
  });

  afterEach(() =>
  {
    warnSpy.mockRestore();
  });

  describe('constructor', () =>
  {
    it('refuses to be instantiated, because this is a static class', () =>
    {
      // Act & Assert
      expect(() => new JABS_EnemyPool()).toThrow('This is a static class.');
    });
  });

  describe('roll()', () =>
  {
    it('leaves the spot as itself when the enemy map has not arrived yet', () =>
    {
      // Arrange
      getEnemyCloneList.mockReturnValue(null);

      // Act
      const result = JABS_EnemyPool.roll(301, [ 301, 302 ]);

      // Assert
      expect(result).toBe(301);
      expect(globalThis.RPGManager.weightedMapChoice).not.toHaveBeenCalled();
    });

    it('rolls the pool against the sum of its weights and returns who it chose', () =>
    {
      // Act
      const result = JABS_EnemyPool.roll(301, [ 301, 302, 303 ]);

      // Assert
      expect(result).toBe(302);
      const [ [ weights, totalWeight ] ] = globalThis.RPGManager.weightedMapChoice.mock.calls;
      expect([ ...weights.entries() ]).toEqual([ [ 301, 85 ], [ 302, 8 ], [ 303, 4 ] ]);
      expect(totalWeight).toBe(97);
    });

    it('leaves the spot as itself when nobody in the pool could be drawn', () =>
    {
      // Arrange
      globalThis.RPGManager.weightedMapChoice.mockReturnValue(null);

      // Act
      const result = JABS_EnemyPool.roll(301, [ 302, 303 ]);

      // Assert
      expect(result).toBe(301);
    });
  });

  describe('weightsFor()', () =>
  {
    it('leaves out and reports an enemy with no event on the enemy map, keeping everyone else', () =>
    {
      // Act
      const result = JABS_EnemyPool.weightsFor(301, [ 301, 302, 304 ]);

      // Assert
      expect([ ...result.keys() ]).toEqual([ 301, 302 ]);
      expect(warnSpy).toHaveBeenCalledOnce();
      const [ [ , message ] ] = warnSpy.mock.calls;
      expect(message).toContain('[ 304 ]');
    });

    it('keeps the spot\'s own enemy even when the enemy map has no event for it', () =>
    {
      // Act
      const result = JABS_EnemyPool.weightsFor(304, [ 304, 302 ]);

      // Assert
      expect([ ...result.entries() ]).toEqual([ [ 304, 85 ], [ 302, 8 ] ]);
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('weightOf()', () =>
  {
    it('prefers the map\'s opinion of an enemy over its note', () =>
    {
      // Arrange
      const overrides = new Map([ [ 302, 30 ], [ 303, 0 ] ]);

      // Act
      const result = JABS_EnemyPool.weightOf(302, 301, overrides);

      // Assert
      expect(result).toBe(30);
    });

    it('prefers the map\'s opinion of the spot\'s own enemy over the home weight', () =>
    {
      // Arrange
      const overrides = new Map([ [ 301, 0 ] ]);

      // Act
      const result = JABS_EnemyPool.weightOf(301, 301, overrides);

      // Assert
      expect(result).toBe(0);
    });

    it('counts the spot\'s own enemy for the home weight, whatever its note says', () =>
    {
      // Arrange
      noteWeights[303] = 4;

      // Act
      const result = JABS_EnemyPool.weightOf(303, 303, new Map());

      // Assert
      expect(result).toBe(85);
    });

    it('counts everyone else for what their note says', () =>
    {
      // Act
      const result = JABS_EnemyPool.weightOf(303, 301, new Map());

      // Assert
      expect(result).toBe(4);
    });
  });

  describe('mapOverrides()', () =>
  {
    it('builds a lookup from the pairs on the current map\'s note', () =>
    {
      // Arrange
      globalThis.RPGManager.getArraysFromNotesByRegex.mockReturnValue([ [ 302, 30 ], [ 303, 0 ] ]);

      // Act
      const result = JABS_EnemyPool.mapOverrides();

      // Assert
      expect([ ...result.entries() ]).toEqual([ [ 302, 30 ], [ 303, 0 ] ]);
      expect(globalThis.RPGManager.getArraysFromNotesByRegex)
        .toHaveBeenCalledWith(globalThis.$dataMap, 'the-override-regex');
    });
  });

  describe('hasPage()', () =>
  {
    it('returns true for an enemy with an event on the enemy map', () =>
    {
      // Act
      const result = JABS_EnemyPool.hasPage(302);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false for an enemy with no event on the enemy map', () =>
    {
      // Act
      const result = JABS_EnemyPool.hasPage(304);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('pageOf()', () =>
  {
    it('returns the only page of that enemy\'s event, not a neighbour\'s', () =>
    {
      // Act
      const result = JABS_EnemyPool.pageOf(303);

      // Assert
      expect(result).toBe('page-303');
    });
  });
});
//endregion plugins/abs/core/managers/jabs-enemy-pool.test.js