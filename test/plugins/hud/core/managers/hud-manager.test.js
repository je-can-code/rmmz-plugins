//region plugins/hud/core/managers/hud-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('HudManager (direct src import)', () =>
{
  let HudManager;

  beforeAll(async () =>
  {
    ({ default: HudManager } = await import('../../../../../src/plugins/hud/core/managers/HudManager.js'));
  });

  beforeEach(() =>
  {
    globalThis.$gameSystem = {
      getHudVisible: vi.fn()
        .mockReturnValue(true),
      getHudAlliesVisible: vi.fn()
        .mockReturnValue(true),
      setHudVisible: vi.fn(),
      setHudAlliesVisible: vi.fn(),
    };
  });

  describe('setup', () =>
  {
    it('reads persisted hud/allies visibility from $gameSystem and becomes ready', () =>
    {
      // Arrange
      globalThis.$gameSystem.getHudVisible.mockReturnValue(false);
      globalThis.$gameSystem.getHudAlliesVisible.mockReturnValue(false);
      const manager = new HudManager();

      // Act
      manager.setup();

      // Assert
      expect(manager.canShowHud()).toEqual(false);
      expect(manager.canShowAllies()).toEqual(false);
    });

    it('defaults hud/allies visibility to true when $gameSystem has no saved value', () =>
    {
      // Arrange
      globalThis.$gameSystem.getHudVisible.mockReturnValue(undefined);
      globalThis.$gameSystem.getHudAlliesVisible.mockReturnValue(undefined);
      const manager = new HudManager();

      // Act
      manager.setup();

      // Assert
      expect(manager.canShowHud()).toEqual(true);
      expect(manager.canShowAllies()).toEqual(true);
    });

    it('does not re-run setup when already ready', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.setup();
      globalThis.$gameSystem.getHudVisible.mockClear();

      // Act
      manager.setup();

      // Assert
      expect(globalThis.$gameSystem.getHudVisible).not.toHaveBeenCalled();
    });
  });

  describe('update', () =>
  {
    it('does nothing before setup has run', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.requestShowHud();

      // Act
      manager.update();

      // Assert
      expect(manager.hasRequestRefreshHud()).toEqual(false);
    });

    it('shows the hud and requests a refresh when a show-hud request is pending', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.setup();
      manager.requestHideHud();
      manager.update();
      manager.acknowledgeRefreshHud();
      manager.requestShowHud();

      // Act
      manager.update();

      // Assert
      expect(manager.canShowHud()).toEqual(true);
      expect(manager.hasRequestRefreshHud()).toEqual(true);
      expect(globalThis.$gameSystem.setHudVisible).toHaveBeenCalledWith(true);
    });

    it('hides the hud and requests a refresh when a hide-hud request is pending', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.setup();
      manager.requestHideHud();

      // Act
      manager.update();

      // Assert
      expect(manager.canShowHud()).toEqual(false);
      expect(manager.hasRequestRefreshHud()).toEqual(true);
      expect(globalThis.$gameSystem.setHudVisible).toHaveBeenCalledWith(false);
    });

    it('shows allies and requests a refresh when a show-allies request is pending', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.setup();
      manager.requestHideAllies();
      manager.update();
      manager.acknowledgeRefreshHud();
      manager.requestShowAllies();

      // Act
      manager.update();

      // Assert
      expect(manager.canShowAllies()).toEqual(true);
      expect(manager.hasRequestRefreshHud()).toEqual(true);
      expect(globalThis.$gameSystem.setHudAlliesVisible).toHaveBeenCalledWith(true);
    });

    it('hides allies and requests a refresh when a hide-allies request is pending', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.setup();
      manager.requestHideAllies();

      // Act
      manager.update();

      // Assert
      expect(manager.canShowAllies()).toEqual(false);
      expect(manager.hasRequestRefreshHud()).toEqual(true);
      expect(globalThis.$gameSystem.setHudAlliesVisible).toHaveBeenCalledWith(false);
    });

    it('does not request a refresh when no requests are pending', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.setup();

      // Act
      manager.update();

      // Assert
      expect(manager.hasRequestRefreshHud()).toEqual(false);
    });
  });

  describe('hud refresh request lifecycle', () =>
  {
    it('reports no refresh requested by default', () =>
    {
      // Arrange
      const manager = new HudManager();

      // Act
      const result = manager.hasRequestRefreshHud();

      // Assert
      expect(result).toEqual(false);
    });

    it('flags a refresh as requested', () =>
    {
      // Arrange
      const manager = new HudManager();

      // Act
      manager.requestRefreshHud();

      // Assert
      expect(manager.hasRequestRefreshHud()).toEqual(true);
    });

    it('clears the refresh flag on acknowledgement', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.requestRefreshHud();

      // Act
      manager.acknowledgeRefreshHud();

      // Assert
      expect(manager.hasRequestRefreshHud()).toEqual(false);
    });
  });

  describe('image cache refresh request lifecycle', () =>
  {
    it('reports no refresh requested by default', () =>
    {
      // Arrange
      const manager = new HudManager();

      // Act
      const result = manager.hasRequestRefreshImageCache();

      // Assert
      expect(result).toEqual(false);
    });

    it('flags a refresh as requested', () =>
    {
      // Arrange
      const manager = new HudManager();

      // Act
      manager.requestRefreshImageCache();

      // Assert
      expect(manager.hasRequestRefreshImageCache()).toEqual(true);
    });

    it('clears the refresh flag on acknowledgement', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.requestRefreshImageCache();

      // Act
      manager.acknowledgeRefreshImageCache();

      // Assert
      expect(manager.hasRequestRefreshImageCache()).toEqual(false);
    });
  });

  describe('target frame', () =>
  {
    it('reports no assign-target request by default', () =>
    {
      // Arrange
      const manager = new HudManager();

      // Act
      const result = manager.hasRequestAssignTarget();

      // Assert
      expect(result).toEqual(false);
      expect(manager.getNewTarget()).toEqual(null);
    });

    it('flags an assign-target request once a target is set', () =>
    {
      // Arrange
      const manager = new HudManager();
      const target = {};

      // Act
      manager.setNewTarget(target);

      // Assert
      expect(manager.hasRequestAssignTarget()).toEqual(true);
      expect(manager.getNewTarget()).toBe(target);
    });

    it('clears the assign-target request on acknowledgement', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.setNewTarget({});

      // Act
      manager.acknowledgeAssignedTarget();

      // Assert
      expect(manager.hasRequestAssignTarget()).toEqual(false);
      expect(manager.getNewTarget()).toEqual(null);
    });

    it('reports no inactivity-timer refresh requested by default', () =>
    {
      // Arrange
      const manager = new HudManager();

      // Act
      const result = manager.hasRequestTargetFrameRefreshInactivityTimer();

      // Assert
      expect(result).toEqual(false);
    });

    it('flags an inactivity-timer refresh as requested', () =>
    {
      // Arrange
      const manager = new HudManager();

      // Act
      manager.requestTargetFrameRefresh();

      // Assert
      expect(manager.hasRequestTargetFrameRefreshInactivityTimer()).toEqual(true);
    });

    it('clears the inactivity-timer refresh flag on acknowledgement', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.requestTargetFrameRefresh();

      // Act
      manager.acknowledgeTargetFrameInactivityTimerRefresh();

      // Assert
      expect(manager.hasRequestTargetFrameRefreshInactivityTimer()).toEqual(false);
    });
  });

  describe('input frame refresh request lifecycle', () =>
  {
    it('reports no refresh requested by default', () =>
    {
      // Arrange
      const manager = new HudManager();

      // Act
      const result = manager.hasRequestRefreshInputFrame();

      // Assert
      expect(result).toEqual(false);
    });

    it('flags a refresh as requested', () =>
    {
      // Arrange
      const manager = new HudManager();

      // Act
      manager.requestRefreshInputFrame();

      // Assert
      expect(manager.hasRequestRefreshInputFrame()).toEqual(true);
    });

    it('clears the refresh flag on acknowledgement', () =>
    {
      // Arrange
      const manager = new HudManager();
      manager.requestRefreshInputFrame();

      // Act
      manager.acknowledgeRefreshInputFrame();

      // Assert
      expect(manager.hasRequestRefreshInputFrame()).toEqual(false);
    });
  });
});
//endregion plugins/hud/core/managers/hud-manager.test.js
