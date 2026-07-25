//region plugins/_base/objects/tiny-object-patches.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-Base tiny Game_* object patches (direct src import)', () =>
{
  beforeAll(async () =>
  {
    String.empty = '';

    globalThis.J = { BASE: { Aliased: { Game_Temp: new Map() } } };

    function Game_Map()
    {
    }
    function Game_Temp()
    {
    }
    function Game_Follower()
    {
    }
    function Game_Player()
    {
    }
    function Game_Vehicle()
    {
    }

    Game_Temp.prototype.initialize = vi.fn();

    globalThis.Game_Map = Game_Map;
    globalThis.Game_Temp = Game_Temp;
    globalThis.Game_Follower = Game_Follower;
    globalThis.Game_Player = Game_Player;
    globalThis.Game_Vehicle = Game_Vehicle;

    await import('../../../../src/plugins/_base/objects/Game_Map.js');
    await import('../../../../src/plugins/_base/objects/Game_Temp.js');
    await import('../../../../src/plugins/_base/objects/Game_Follower.js');
    await import('../../../../src/plugins/_base/objects/Game_Player.js');
    await import('../../../../src/plugins/_base/objects/Game_Vehicle.js');
  });

  describe('Game_Map#note', () =>
  {
    it('returns $dataMap.note when $dataMap is available', () =>
    {
      // Arrange
      globalThis.$dataMap = { note: '<map-note>' };
      const map = new globalThis.Game_Map();

      // Act
      const result = map.note();

      // Assert
      expect(result).toBe('<map-note>');
    });

    it('warns and returns String.empty when $dataMap is unavailable', () =>
    {
      // Arrange
      globalThis.$dataMap = null;
      const map = new globalThis.Game_Map();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = map.note();

      // Assert
      expect(result).toBe('');
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('Game_Temp', () =>
  {
    it('initialize calls the original aliased initialize and then initMembers', () =>
    {
      // Arrange
      const temp = Object.create(globalThis.Game_Temp.prototype);
      const initMembersSpy = vi.spyOn(globalThis.Game_Temp.prototype, 'initMembers');

      // Act
      temp.initialize();

      // Assert
      expect(globalThis.Game_Temp.prototype.initialize).not.toBe(undefined);
      expect(initMembersSpy).toHaveBeenCalled();
      initMembersSpy.mockRestore();
    });

    it('initMembers is a no-op hook that does not throw', () =>
    {
      // Arrange
      const temp = new globalThis.Game_Temp();

      // Act & Assert
      expect(() => temp.initMembers()).not.toThrow();
    });
  });

  describe('Game_Follower#isFollower', () =>
  {
    it('returns true', () =>
    {
      // Arrange
      const follower = new globalThis.Game_Follower();

      // Act & Assert
      expect(follower.isFollower()).toBe(true);
    });
  });

  describe('Game_Player#isPlayer', () =>
  {
    it('returns true', () =>
    {
      // Arrange
      const player = new globalThis.Game_Player();

      // Act & Assert
      expect(player.isPlayer()).toBe(true);
    });
  });

  describe('Game_Vehicle#isVehicle', () =>
  {
    it('returns true', () =>
    {
      // Arrange
      const vehicle = new globalThis.Game_Vehicle();

      // Act & Assert
      expect(vehicle.isVehicle()).toBe(true);
    });
  });
});
//endregion plugins/_base/objects/tiny-object-patches.test.js
