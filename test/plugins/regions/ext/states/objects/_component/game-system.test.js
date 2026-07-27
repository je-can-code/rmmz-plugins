//region plugins/regions/ext/states/objects/_component/game-system.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_System regions/ext/states augments (direct src import)', () =>
{
  let Game_System;
  let originalOnAfterLoad;

  beforeAll(async () =>
  {
    vi.resetModules();

    originalOnAfterLoad = vi.fn();

    globalThis.J = { REGIONS: { EXT: { STATES: { Aliased: { Game_System: new Map() } } } } };

    function StubGameSystem()
    {
    }

    StubGameSystem.prototype.onAfterLoad = originalOnAfterLoad;
    globalThis.Game_System = StubGameSystem;

    await import('../../../../../../../src/plugins/regions/ext/states/objects/Game_System.js');
    ({ Game_System } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();

    const follower = { initRegionStatesMembers: vi.fn() };
    globalThis.$gameMap = {
      initRegionStatesMembers: vi.fn(),
      setupRegionStates: vi.fn(),
    };
    globalThis.$gamePlayer = {
      initRegionStatesMembers: vi.fn(),
      followers: vi.fn()
        .mockReturnValue({ data: () => [ follower ] }),
    };
    globalThis.__follower = follower;
  });

  describe('onAfterLoad', () =>
  {
    it('calls through to original logic and refreshes region states', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.onAfterLoad();

      // Assert
      expect(originalOnAfterLoad).toHaveBeenCalled();
      expect(globalThis.$gameMap.initRegionStatesMembers).toHaveBeenCalled();
      expect(globalThis.$gameMap.setupRegionStates).toHaveBeenCalled();
      expect(globalThis.$gamePlayer.initRegionStatesMembers).toHaveBeenCalled();
      expect(globalThis.__follower.initRegionStatesMembers).toHaveBeenCalled();
    });
  });

  describe('updateRegionStatesAfterLoad', () =>
  {
    it('re-initializes region states for the map, player, and every follower', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.updateRegionStatesAfterLoad();

      // Assert
      expect(globalThis.$gameMap.initRegionStatesMembers).toHaveBeenCalled();
      expect(globalThis.$gameMap.setupRegionStates).toHaveBeenCalled();
      expect(globalThis.$gamePlayer.initRegionStatesMembers).toHaveBeenCalled();
      expect(globalThis.__follower.initRegionStatesMembers).toHaveBeenCalled();
    });
  });
});
//endregion plugins/regions/ext/states/objects/_component/game-system.test.js
