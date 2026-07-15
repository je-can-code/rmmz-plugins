//region plugins/sdp/core/objects/game-enemy.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_Enemy ext/sdp augments (direct src import)', () =>
{
  let Game_Enemy;

  beforeAll(async () =>
  {
    String.empty = '';

    globalThis.J = {
      SDP: {
        Aliased: { Game_Enemy: new Map() },
        Metadata: { panelsMap: new Map(), sdpIconIndex: 99 },
      },
    };

    function StubGameEnemy()
    {
    }

    StubGameEnemy.prototype.extraDrops = vi.fn();
    StubGameEnemy.prototype.findLoot = vi.fn();
    globalThis.Game_Enemy = StubGameEnemy;

    globalThis.RPG_DropItemBuilder = function()
    {
      this.itemLoot = vi.fn((itemId, chance) =>
      {
        const drop = { itemId, chance };
        drop.setSdpKey = vi.fn(key =>
        {
          drop.sdpKey = key;
        });
        return drop;
      });
    };

    await import('../../../../../src/plugins/sdp/core/objects/Game_Enemy.js');
    ({ Game_Enemy } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
    globalThis.J.SDP.Metadata.panelsMap.clear();
    globalThis.$gameParty = { isSdpUnlocked: vi.fn().mockReturnValue(false) };
    globalThis.$gameSystem = { shouldForceDropSdp: vi.fn().mockReturnValue(false) };
  });

  function makeEnemy({ sdpDropKey = 'panel-1', sdpDropData = [ 'panel-1', 50, 7 ], sdpPoints = 10 } = {})
  {
    const enemy = new Game_Enemy();
    enemy.enemy = vi.fn().mockReturnValue({ sdpDropKey, sdpDropData, sdpPoints });
    return enemy;
  }

  describe('extraDrops', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const enemy = makeEnemy({ sdpDropData: [ String.empty, 0, 0 ] });
      globalThis.J.SDP.Aliased.Game_Enemy.get('extraDrops').mockReturnValue([]);

      // Act
      enemy.extraDrops();

      // Assert
      expect(globalThis.J.SDP.Aliased.Game_Enemy.get('extraDrops')).toHaveBeenCalled();
    });

    it('returns the original drop list unmodified when there is no sdp to drop', () =>
    {
      // Arrange
      const enemy = makeEnemy({ sdpDropData: [ String.empty, 0, 0 ] });
      globalThis.J.SDP.Aliased.Game_Enemy.get('extraDrops').mockReturnValue([ 'existing-drop' ]);

      // Act
      const result = enemy.extraDrops();

      // Assert
      expect(result).toEqual([ 'existing-drop' ]);
    });

    it('appends a generated sdp drop when eligible', () =>
    {
      // Arrange
      const enemy = makeEnemy();
      globalThis.J.SDP.Metadata.panelsMap.set('panel-1', { key: 'panel-1', name: 'Panel' });
      globalThis.J.SDP.Aliased.Game_Enemy.get('extraDrops').mockReturnValue([ 'existing-drop' ]);

      // Act
      const result = enemy.extraDrops();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual('existing-drop');
    });
  });

  describe('canDropSdp', () =>
  {
    it('returns false when the enemy has no sdp drop data', () =>
    {
      // Arrange
      const enemy = makeEnemy({ sdpDropData: [ String.empty, 0, 0 ] });

      // Act
      const result = enemy.canDropSdp();

      // Assert
      expect(result).toEqual(false);
    });

    it('returns false and warns when the panel key is not registered', () =>
    {
      // Arrange
      const enemy = makeEnemy();

      // Act
      const result = enemy.canDropSdp();

      // Assert
      expect(result).toEqual(false);
    });

    it('returns false when the panel is already unlocked', () =>
    {
      // Arrange
      const enemy = makeEnemy();
      globalThis.J.SDP.Metadata.panelsMap.set('panel-1', { key: 'panel-1' });
      globalThis.$gameParty.isSdpUnlocked.mockReturnValue(true);

      // Act
      const result = enemy.canDropSdp();

      // Assert
      expect(result).toEqual(false);
    });

    it('returns true when the panel exists and is not yet unlocked', () =>
    {
      // Arrange
      const enemy = makeEnemy();
      globalThis.J.SDP.Metadata.panelsMap.set('panel-1', { key: 'panel-1' });

      // Act
      const result = enemy.canDropSdp();

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('makeSdpDrop', () =>
  {
    it('builds a drop item with the panel key and normal chance when not force-dropping', () =>
    {
      // Arrange
      const enemy = makeEnemy({ sdpDropData: [ 'panel-1', 25, 7 ] });

      // Act
      const drop = enemy.makeSdpDrop();

      // Assert
      expect(drop.chance).toEqual(25);
      expect(drop.itemId).toEqual(7);
      expect(drop.sdpKey).toEqual('panel-1');
    });

    it('forces a guaranteed drop chance when the debug force-drop flag is set', () =>
    {
      // Arrange
      const enemy = makeEnemy({ sdpDropData: [ 'panel-1', 25, 7 ] });
      globalThis.$gameSystem.shouldForceDropSdp.mockReturnValue(true);

      // Act
      const drop = enemy.makeSdpDrop();

      // Assert
      expect(drop.chance).toEqual(10000000);
    });
  });

  describe('getSdpDropData/hasSdpDropData/sdpPoints', () =>
  {
    it('returns the raw sdp drop data tuple', () =>
    {
      // Arrange
      const enemy = makeEnemy({ sdpDropData: [ 'panel-1', 25, 7 ] });

      // Act
      const result = enemy.getSdpDropData();

      // Assert
      expect(result).toEqual([ 'panel-1', 25, 7 ]);
    });

    it('reports no drop data when the key is empty', () =>
    {
      // Arrange
      const enemy = makeEnemy({ sdpDropData: [ String.empty, 0, 0 ] });

      // Act
      const result = enemy.hasSdpDropData();

      // Assert
      expect(result).toEqual(false);
    });

    it('reports drop data present when the key is non-empty', () =>
    {
      // Arrange
      const enemy = makeEnemy();

      // Act
      const result = enemy.hasSdpDropData();

      // Assert
      expect(result).toEqual(true);
    });

    it('returns the base sdp points from the enemy database entry', () =>
    {
      // Arrange
      const enemy = makeEnemy({ sdpPoints: 42 });

      // Act
      const result = enemy.sdpPoints();

      // Assert
      expect(result).toEqual(42);
    });
  });

  describe('findLoot', () =>
  {
    it('calls through to the original implementation for a non-sdp drop', () =>
    {
      // Arrange
      const enemy = makeEnemy();
      const drop = { isSdpDrop: () => false };
      const itemsFound = [];

      // Act
      enemy.findLoot(drop, itemsFound);

      // Assert
      expect(globalThis.J.SDP.Aliased.Game_Enemy.get('findLoot')).toHaveBeenCalledWith(drop, itemsFound);
    });

    it('builds and pushes dynamic sdp loot without calling through for an sdp drop', () =>
    {
      // Arrange
      const enemy = makeEnemy();
      globalThis.J.SDP.Metadata.panelsMap.set('panel-1', { key: 'panel-1', name: 'Panel' });
      const drop = { isSdpDrop: () => true, sdpKey: 'panel-1' };
      const itemsFound = [];

      // Act
      enemy.findLoot(drop, itemsFound);

      // Assert
      expect(itemsFound).toHaveLength(1);
      expect(itemsFound[0].sdpKey).toEqual('panel-1');
      expect(globalThis.J.SDP.Aliased.Game_Enemy.get('findLoot')).not.toHaveBeenCalled();
    });
  });

  describe('buildSdpLoot', () =>
  {
    it('builds a dynamic loot record with the panel name/icon/description', () =>
    {
      // Arrange
      const enemy = makeEnemy();
      globalThis.J.SDP.Metadata.panelsMap.set('panel-1', { key: 'panel-1', name: 'Panel', iconIndex: 5, description: 'desc' });
      const drop = { sdpKey: 'panel-1' };

      // Act
      const loot = enemy.buildSdpLoot(drop);

      // Assert
      expect(loot.name).toEqual('Panel');
      expect(loot.iconIndex).toEqual(5);
      expect(loot.description).toEqual('desc');
      expect(loot.sdpKey).toEqual('panel-1');
      expect(loot.jabsUseOnPickup).toEqual(true);
    });

    it('falls back to the default sdp icon index when the panel has none', () =>
    {
      // Arrange
      const enemy = makeEnemy();
      globalThis.J.SDP.Metadata.panelsMap.set('panel-1', { key: 'panel-1', name: 'Panel' });
      const drop = { sdpKey: 'panel-1' };

      // Act
      const loot = enemy.buildSdpLoot(drop);

      // Assert
      expect(loot.iconIndex).toEqual(99);
      expect(loot.description).toEqual('');
    });
  });
});
//endregion plugins/sdp/core/objects/game-enemy.test.js
