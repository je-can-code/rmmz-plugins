//region plugins/map/core/objects/game-system.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Game_System ext/map augments (direct src import)', () =>
{
  let Game_System;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      MAP: {
        Aliased: {
          Game_System: new Map(),
        },
        Metadata: { startVisible: true },
      },
    };

    function StubGameSystem()
    {
    }

    StubGameSystem.prototype.initMembers = vi.fn();
    StubGameSystem.prototype.onAfterLoad = vi.fn();
    globalThis.Game_System = StubGameSystem;

    await import('../../../../../src/plugins/map/core/objects/Game_System.js');
    ({ Game_System } = globalThis);
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('initMembers', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.initMembers();

      // Assert
      expect(globalThis.J.MAP.Aliased.Game_System.get('initMembers')).toHaveBeenCalled();
    });

    it('seeds minimap visibility from plugin metadata', () =>
    {
      // Arrange
      const system = new Game_System();

      // Act
      system.initMembers();

      // Assert
      expect(system.isMinimapVisible()).toEqual(true);
    });
  });

  describe('isMinimapVisible/showMinimap/hideMinimap/toggleMinimapVisibility/setMinimapVisibility', () =>
  {
    it('shows the minimap', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();

      // Act
      system.showMinimap();

      // Assert
      expect(system.isMinimapVisible()).toEqual(true);
    });

    it('hides the minimap', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();

      // Act
      system.hideMinimap();

      // Assert
      expect(system.isMinimapVisible()).toEqual(false);
    });

    it('toggles visibility from true to false', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();
      system.showMinimap();

      // Act
      system.toggleMinimapVisibility();

      // Assert
      expect(system.isMinimapVisible()).toEqual(false);
    });

    it('toggles visibility from false to true', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();
      system.hideMinimap();

      // Act
      system.toggleMinimapVisibility();

      // Assert
      expect(system.isMinimapVisible()).toEqual(true);
    });

    it('sets visibility to an explicit value', () =>
    {
      // Arrange
      const system = new Game_System();
      system.initMembers();

      // Act
      system.setMinimapVisibility(false);

      // Assert
      expect(system.isMinimapVisible()).toEqual(false);
    });
  });

  describe('onAfterLoad', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const system = new Game_System();
      system._j = { _map: { _minimapVisible: false } };

      // Act
      system.onAfterLoad();

      // Assert
      expect(globalThis.J.MAP.Aliased.Game_System.get('onAfterLoad')).toHaveBeenCalled();
    });

    it('preserves an existing minimap visibility value loaded from the save', () =>
    {
      // Arrange
      const system = new Game_System();
      system._j = { _map: { _minimapVisible: false } };

      // Act
      system.onAfterLoad();

      // Assert
      expect(system.isMinimapVisible()).toEqual(false);
    });

    it('defaults minimap visibility from metadata when missing from an older save', () =>
    {
      // Arrange
      const system = new Game_System();
      system._j = undefined;

      // Act
      system.onAfterLoad();

      // Assert
      expect(system.isMinimapVisible()).toEqual(true);
    });
  });
});
//endregion plugins/map/core/objects/game-system.test.js
