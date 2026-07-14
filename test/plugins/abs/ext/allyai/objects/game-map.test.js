//region plugins/abs/ext/allyai/objects/game-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-AllyAI Game_Map (unit, all downstream dependencies mocked)', () =>
{
  let originalParseBattlers;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { ALLYAI: { Aliased: { Game_Map: new Map() } } } } };

    function Game_Map()
    {
    }

    originalParseBattlers = vi.fn();
    Game_Map.prototype.parseBattlers = originalParseBattlers;
    globalThis.Game_Map = Game_Map;

    await import('../../../../../../src/plugins/abs/ext/allyai/objects/Game_Map.js');
  });

  beforeEach(() =>
  {
    originalParseBattlers.mockReset();
    globalThis.JABS_AiManager = {
      convertFollowersToBattlers: vi.fn(),
      getAllBattlers: vi.fn(() => []),
      addOrUpdateBattlers: vi.fn(),
      removeBattlers: vi.fn(),
    };
    globalThis.$gamePlayer = { followers: () => ({ data: () => [ 'follower1' ] }) };
  });

  function buildMap()
  {
    return Object.create(globalThis.Game_Map.prototype);
  }

  describe('parseBattlers', () =>
  {
    it('combines the original parsed battlers with the parsed ally battlers', () =>
    {
      // Arrange
      originalParseBattlers.mockReturnValue([ 'original1' ]);
      const map = buildMap();
      map.parseAllyBattlers = () => [ 'ally1' ];

      // Act
      const result = map.parseBattlers();

      // Assert
      expect(result).toEqual([ 'original1', 'ally1' ]);
    });
  });

  describe('parseAllyBattlers', () =>
  {
    it('converts the player\'s followers into battlers via JABS_AiManager', () =>
    {
      // Arrange
      globalThis.JABS_AiManager.convertFollowersToBattlers.mockReturnValue([ 'ally-battler' ]);
      const map = buildMap();

      // Act
      const result = map.parseAllyBattlers();

      // Assert
      expect(globalThis.JABS_AiManager.convertFollowersToBattlers).toHaveBeenCalledWith([ 'follower1' ]);
      expect(result).toEqual([ 'ally-battler' ]);
    });
  });

  describe('getFollowerBattlers', () =>
  {
    it('filters the tracked battlers down to followers only', () =>
    {
      // Arrange
      const followerBattler = { isFollower: () => true };
      const nonFollowerBattler = { isFollower: () => false };
      globalThis.JABS_AiManager.getAllBattlers.mockReturnValue([ followerBattler, nonFollowerBattler ]);
      const map = buildMap();

      // Act
      const result = map.getFollowerBattlers();

      // Assert
      expect(result).toEqual([ followerBattler ]);
    });
  });

  describe('updateAllies', () =>
  {
    it('removes existing ally battlers then re-adds the freshly parsed ones', () =>
    {
      // Arrange
      const map = buildMap();
      const existingAllies = [ 'existing' ];
      map.getFollowerBattlers = () => existingAllies;
      map.removeBattlers = vi.fn();
      map.parseAllyBattlers = () => [ 'fresh-ally' ];

      // Act
      map.updateAllies();

      // Assert
      expect(map.removeBattlers).toHaveBeenCalledWith(existingAllies);
      expect(globalThis.JABS_AiManager.addOrUpdateBattlers).toHaveBeenCalledWith([ 'fresh-ally' ]);
    });

    it('does not call addOrUpdateBattlers when there are no fresh allies', () =>
    {
      // Arrange
      const map = buildMap();
      map.getFollowerBattlers = () => [];
      map.removeBattlers = vi.fn();
      map.parseAllyBattlers = () => [];

      // Act
      map.updateAllies();

      // Assert
      expect(globalThis.JABS_AiManager.addOrUpdateBattlers).not.toHaveBeenCalled();
    });
  });

  describe('removeBattlers', () =>
  {
    it('disengages every battler then removes them from tracking', () =>
    {
      // Arrange
      const battler1 = { disengageTarget: vi.fn() };
      const battler2 = { disengageTarget: vi.fn() };
      const map = buildMap();

      // Act
      map.removeBattlers([ battler1, battler2 ]);

      // Assert
      expect(battler1.disengageTarget).toHaveBeenCalledTimes(1);
      expect(battler2.disengageTarget).toHaveBeenCalledTimes(1);
      expect(globalThis.JABS_AiManager.removeBattlers).toHaveBeenCalledWith([ battler1, battler2 ]);
    });
  });
});
//endregion plugins/abs/ext/allyai/objects/game-map.test.js
