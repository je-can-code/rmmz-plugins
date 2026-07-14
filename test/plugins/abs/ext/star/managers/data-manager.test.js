//region plugins/abs/ext/star/managers/data-manager.test.js
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Star DataManager (unit, all downstream dependencies mocked)', () =>
{
  let originalCreateGameObjects;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { STAR: { Aliased: { DataManager: new Map() }, DefaultValues: { EnemyMap: 5 } } } } };
    globalThis.BattleManager = { enemyMap: null };

    // vanilla RMMZ core prototype extensions (rmmz_core.js), not part of this plugin- stubbed
    // explicitly rather than relying on another test file having already mutated the prototype.
    String.prototype.format = function(...args)
    {
      return this.replace(/%([0-9]+)/g, (_match, n) => args[Number(n) - 1]);
    };
    Number.prototype.padZero = function(length)
    {
      return String(this).padStart(length, '0');
    };

    originalCreateGameObjects = vi.fn();
    globalThis.DataManager = { createGameObjects: originalCreateGameObjects, gracefulFail: vi.fn() };

    await import('../../../../../../src/plugins/abs/ext/star/managers/DataManager.js');
  });

  beforeEach(() =>
  {
    originalCreateGameObjects.mockReset();
    globalThis.DataManager.gracefulFail.mockReset();
  });

  afterEach(() =>
  {
    // restore any spy installed on the shared DataManager singleton, so a later test never
    // observes a still-mocked method left behind by an earlier one.
    vi.restoreAllMocks();
  });

  describe('createGameObjects', () =>
  {
    it('performs the original logic then retrieves the enemy master map', () =>
    {
      // Arrange
      const getEnemyMasterMapSpy = vi.spyOn(globalThis.DataManager, 'getEnemyMasterMap').mockImplementation(() => {});

      // Act
      globalThis.DataManager.createGameObjects();

      // Assert
      expect(originalCreateGameObjects).toHaveBeenCalledTimes(1);
      expect(getEnemyMasterMapSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('getEnemyMasterMap', () =>
  {
    it('loads the enemy master map using the configured map id', () =>
    {
      // Arrange
      const loadEnemyMasterMapSpy = vi.spyOn(globalThis.DataManager, 'loadEnemyMasterMap').mockImplementation(() => {});

      // Act
      globalThis.DataManager.getEnemyMasterMap();

      // Assert
      expect(loadEnemyMasterMapSpy).toHaveBeenCalledWith('$dataMap', 'Map005.json');
    });

    it('throws when the configured map id is invalid', () =>
    {
      // Arrange
      globalThis.J.ABS.EXT.STAR.DefaultValues.EnemyMap = 0;

      // Act / Assert
      expect(() => globalThis.DataManager.getEnemyMasterMap()).toThrow('Missing enemy master map.');

      // Cleanup
      globalThis.J.ABS.EXT.STAR.DefaultValues.EnemyMap = 5;
    });
  });

  describe('onEnemyMapGet', () =>
  {
    it('parses and assigns the response onto BattleManager.enemyMap on success', () =>
    {
      // Arrange
      const xhr = { status: 200, responseText: '{"events":[null,{"id":1}]}' };

      // Act
      globalThis.DataManager.onEnemyMapGet(xhr, '$dataMap', 'Map005.json', 'data/Map005.json');

      // Assert
      expect(globalThis.BattleManager.enemyMap).toEqual({ events: [ null, { id: 1 } ] });
    });

    it('gracefully fails on a non-2xx/3xx status', () =>
    {
      // Arrange
      const xhr = { status: 404, responseText: '' };

      // Act
      globalThis.DataManager.onEnemyMapGet(xhr, '$dataMap', 'Map005.json', 'data/Map005.json');

      // Assert
      expect(globalThis.DataManager.gracefulFail).toHaveBeenCalledWith('$dataMap', 'Map005.json', 'data/Map005.json');
    });
  });
});
//endregion plugins/abs/ext/star/managers/data-manager.test.js
