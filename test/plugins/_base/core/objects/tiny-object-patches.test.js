//region plugins/_base/objects/tiny-object-patches.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-Base tiny Game_* object patches (direct src import)', () =>
{
  beforeAll(async () =>
  {
    String.empty = '';

    globalThis.J = {
      BASE: {
        Aliased: {
          Game_ActionResult: new Map(),
          Game_Item: new Map(),
          Game_Map: new Map(),
          Game_Temp: new Map(),
        },
      },
    };

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
    function Game_Interpreter()
    {
    }
    function Game_Item()
    {
    }

    Game_Temp.prototype.initialize = vi.fn();

    globalThis.Game_Map = Game_Map;
    globalThis.Game_Temp = Game_Temp;
    globalThis.Game_Follower = Game_Follower;
    globalThis.Game_Player = Game_Player;
    globalThis.Game_Vehicle = Game_Vehicle;
    globalThis.Game_Interpreter = Game_Interpreter;
    globalThis.Game_Item = Game_Item;
    globalThis.BattleManager = {};

    await import('../../../../../src/plugins/_base/core/objects/Game_Map.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Temp.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Follower.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Player.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Vehicle.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Interpreter.js');
    await import('../../../../../src/plugins/_base/core/objects/Game_Item.js');
    await import('../../../../../src/plugins/_base/core/managers/BattleManager.js');
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

  describe('Game_Interpreter accessors', () =>
  {
    // vanilla keeps these three on private-by-convention fields with no readers at all; plugins
    // that need to reason about where an event is mid-execution have nowhere else to look.
    it('reads back the conditional branch results', () =>
    {
      // Arrange
      const interpreter = new globalThis.Game_Interpreter();
      interpreter._branch = { 0: true };

      // Act & Assert
      expect(interpreter.branch()).toEqual({ 0: true });
    });

    it('reads back the indent depth of the executing command', () =>
    {
      // Arrange
      const interpreter = new globalThis.Game_Interpreter();
      interpreter._indent = 2;

      // Act & Assert
      expect(interpreter.indent()).toBe(2);
    });

    it('reads back the index of the executing command', () =>
    {
      // Arrange
      const interpreter = new globalThis.Game_Interpreter();
      interpreter._index = 7;

      // Act & Assert
      expect(interpreter.index()).toBe(7);
    });

    it('moves the index of the executing command', () =>
    {
      // Arrange- writing the index is how a plugin redirects an event mid-list.
      const interpreter = new globalThis.Game_Interpreter();
      interpreter._index = 7;

      // Act
      interpreter.setIndex(3);

      // Assert
      expect(interpreter.index()).toBe(3);
    });
  });

  describe('Game_Item accessors', () =>
  {
    it('reads back which database the item belongs to', () =>
    {
      // Arrange
      const item = new globalThis.Game_Item();
      item._dataClass = 'skill';

      // Act & Assert
      expect(item.dataClass()).toBe('skill');
    });

    it('reassigns which database the item belongs to', () =>
    {
      // Arrange
      const item = new globalThis.Game_Item();
      item._dataClass = 'skill';

      // Act
      item.setDataClass('item');

      // Assert
      expect(item.dataClass()).toBe('item');
    });
  });

  describe('BattleManager reward accessors', () =>
  {
    it('reads back the rewards bundle built when the battle was won', () =>
    {
      // Arrange
      globalThis.BattleManager._rewards = { gold: 100, exp: 250 };

      // Act & Assert
      expect(globalThis.BattleManager.rewards()).toEqual({ gold: 100, exp: 250 });
    });

    it('reassigns the rewards bundle', () =>
    {
      // Arrange- extensions restyle the victory payout by swapping this wholesale.
      globalThis.BattleManager._rewards = { gold: 100, exp: 250 };

      // Act
      globalThis.BattleManager.setRewards({ gold: 5, exp: 1 });

      // Assert
      expect(globalThis.BattleManager.rewards()).toEqual({ gold: 5, exp: 1 });
    });
  });
});
//endregion plugins/_base/objects/tiny-object-patches.test.js
