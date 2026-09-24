//region plugins/hud/ext/boss/scenes/scene-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The boss frame is driven entirely from event script calls - the game's boss setup and cleanup common events call
 * straight into BossFrameManager - and this scene is the one place those requests are handed to the window and then
 * acknowledged. An acknowledgement landing on the wrong flag is invisible from either side alone: the manager's own
 * tests pass, the window fades correctly, and the frame still never hides, because the show request is re-issued
 * every frame and out-fades every conceal.
 *
 * So the manager here is the real one, and the handler tests carry a sibling request that has to survive.
 */
describe('J-HUD-BossFrame Scene_Map (direct src import)', () =>
{
  let BossFrameManager;
  let FakeWindowBossFrame;
  let originalInitHudMembers;
  let originalCreateAllWindows;
  let originalUpdateHudFrames;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      HUD: {
        EXT: {
          BOSS: { Aliased: { Scene_Map: new Map() } },
          TARGET: { Metadata: { TargetFrameY: 20 } },
        },
      },
    };

    FakeWindowBossFrame = vi.fn(function(rect)
    {
      this.rect = rect;
    });
    vi.doMock(
      '../../../../../../src/plugins/hud/ext/boss/windows/Window_BossFrame.js',
      () => ({ default: FakeWindowBossFrame })
    );

    function Scene_Map()
    {
    }

    originalInitHudMembers = vi.fn(function()
    {
      this._j = { _hud: {} };
    });
    originalCreateAllWindows = vi.fn();
    originalUpdateHudFrames = vi.fn();
    Scene_Map.prototype.initHudMembers = originalInitHudMembers;
    Scene_Map.prototype.createAllWindows = originalCreateAllWindows;
    Scene_Map.prototype.updateHudFrames = originalUpdateHudFrames;
    globalThis.Scene_Map = Scene_Map;

    globalThis.Graphics = { boxWidth: 1920 };
    globalThis.Rectangle = function(x, y, width, height)
    {
      Object.assign(this, { x, y, width, height });
    };

    ({ default: BossFrameManager } = await import(
      '../../../../../../src/plugins/hud/ext/boss/managers/BossFrameManager.js'
    ));
    await import('../../../../../../src/plugins/hud/ext/boss/scenes/Scene_Map.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();

    // static-only class: its fields persist across tests within this module instance, so reset them by hand. A
    // hide request is the only way to stand the frame down; the acknowledgement after it clears the request.
    BossFrameManager.boss = null;
    BossFrameManager.requestHideBossFrame();
    BossFrameManager.acknowledgeBossFrameRefresh();
    BossFrameManager.acknowledgeBossFrameHidden();
    BossFrameManager.acknowledgeBossFrameShown();
  });

  /**
   * Builds a scene whose boss frame slot already holds a spy window.
   * @returns {{scene: Scene_Map, window: object}}
   */
  function buildScene()
  {
    const scene = Object.create(globalThis.Scene_Map.prototype);
    const window = {
      y: 0,
      height: 120,
      setTarget: vi.fn(),
      requestShowBossFrame: vi.fn(),
      requestHideBossFrame: vi.fn(),
    };
    scene._j = { _hud: { _boss: { _frame: window } } };

    return { scene, window };
  }

  describe('initHudMembers', () =>
  {
    it('performs the original logic, then seeds an empty boss frame slot', () =>
    {
      // Arrange
      const scene = Object.create(globalThis.Scene_Map.prototype);

      // Act
      scene.initHudMembers();

      // Assert
      expect(originalInitHudMembers).toHaveBeenCalledTimes(1);
      expect(scene._j._hud._boss).toEqual({ _frame: null });
    });
  });

  describe('createAllWindows', () =>
  {
    it('performs the original logic, then builds, tracks, and adds the boss frame', () =>
    {
      // Arrange
      const { scene } = buildScene();
      scene._j._hud._boss._frame = null;
      scene.addWindow = vi.fn();

      // Act
      scene.createAllWindows();

      // Assert
      const [ built ] = FakeWindowBossFrame.mock.instances;
      expect(originalCreateAllWindows).toHaveBeenCalledTimes(1);
      expect(built.rect).toEqual({ x: 200, y: 0, width: 1520, height: 120 });
      expect(scene.getBossFrameWindow()).toBe(built);
      expect(scene.addWindow).toHaveBeenCalledWith(built);
    });
  });

  describe('bossFrameWindowRect', () =>
  {
    it('spans the screen less 200px a side, 120px tall, pinned to the top', () =>
    {
      // Arrange
      const { scene } = buildScene();

      // Act
      const rect = scene.bossFrameWindowRect();

      // Assert
      expect(rect).toEqual({ x: 200, y: 0, width: 1520, height: 120 });
    });
  });

  describe('getBossFrameWindow/setBossFrameWindow', () =>
  {
    it('tracks the window it was given', () =>
    {
      // Arrange
      const { scene } = buildScene();
      const replacement = { id: 'replacement' };

      // Act
      scene.setBossFrameWindow(replacement);

      // Assert
      expect(scene.getBossFrameWindow()).toBe(replacement);
    });
  });

  describe('updateHudFrames', () =>
  {
    it('performs the original logic, then assigns the boss, manages visibility, and places the target frame', () =>
    {
      // Arrange
      const { scene } = buildScene();
      scene.handleAssignBoss = vi.fn();
      scene.handleBossFrameVisibility = vi.fn();
      scene.handleTargetFramePlacement = vi.fn();

      // Act
      scene.updateHudFrames();

      // Assert
      expect(originalUpdateHudFrames).toHaveBeenCalledTimes(1);
      expect(scene.handleAssignBoss).toHaveBeenCalledTimes(1);
      expect(scene.handleBossFrameVisibility).toHaveBeenCalledTimes(1);
      expect(scene.handleTargetFramePlacement).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleTargetFramePlacement', () =>
  {
    it('drops the target frame to the boss frame\'s bottom edge while the boss frame is up', () =>
    {
      // Arrange- the target frame starts somewhere neither answer would put it.
      const { scene, window } = buildScene();
      window.y = 10;
      const targetFrame = { y: 999 };
      scene.getTargetFrameWindow = () => targetFrame;
      BossFrameManager.requestShowBossFrame();

      // Act
      scene.handleTargetFramePlacement();

      // Assert
      expect(targetFrame.y).toBe(130);
    });

    it('rests the target frame at its usual place while no boss is framed', () =>
    {
      // Arrange
      const { scene } = buildScene();
      const targetFrame = { y: 999 };
      scene.getTargetFrameWindow = () => targetFrame;

      // Act
      scene.handleTargetFramePlacement();

      // Assert
      expect(targetFrame.y).toBe(20);
    });
  });

  describe('handleAssignBoss', () =>
  {
    it('does nothing without a pending boss refresh', () =>
    {
      // Arrange
      const { scene, window } = buildScene();
      BossFrameManager.boss = { name: 'Hard Syrup' };

      // Act
      scene.handleAssignBoss();

      // Assert
      expect(window.setTarget).not.toHaveBeenCalled();
    });

    it('hands the new boss to the window and acknowledges the refresh', () =>
    {
      // Arrange
      const { scene, window } = buildScene();
      const boss = { name: 'Hard Syrup' };
      BossFrameManager.setBossFrame(boss);

      // Act
      scene.handleAssignBoss();

      // Assert
      expect(window.setTarget).toHaveBeenCalledWith(boss);
      expect(BossFrameManager.needsBossFrameRefresh()).toBe(false);
    });
  });

  describe('handleBossFrameVisibility', () =>
  {
    it('checks both the hide and the show requests', () =>
    {
      // Arrange
      const { scene } = buildScene();
      scene.handleHideBossFrame = vi.fn();
      scene.handleShowBossFrame = vi.fn();

      // Act
      scene.handleBossFrameVisibility();

      // Assert
      expect(scene.handleHideBossFrame).toHaveBeenCalledTimes(1);
      expect(scene.handleShowBossFrame).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleHideBossFrame', () =>
  {
    it('does nothing without a pending hide request, even with a show request pending', () =>
    {
      // Arrange
      const { scene, window } = buildScene();
      BossFrameManager.requestShowBossFrame();

      // Act
      scene.handleHideBossFrame();

      // Assert
      expect(window.requestHideBossFrame).not.toHaveBeenCalled();
    });

    it('asks the window to conceal and acknowledges only the hide request', () =>
    {
      // Arrange
      const { scene, window } = buildScene();
      BossFrameManager.requestHideBossFrame();
      BossFrameManager.requestShowBossFrame();

      // Act
      scene.handleHideBossFrame();

      // Assert
      expect(window.requestHideBossFrame).toHaveBeenCalledTimes(1);
      expect(BossFrameManager.needsBossFrameHiding()).toBe(false);
      expect(BossFrameManager.needsBossFrameShowing()).toBe(true);
    });
  });

  describe('handleShowBossFrame', () =>
  {
    it('does nothing without a pending show request, even with a hide request pending', () =>
    {
      // Arrange
      const { scene, window } = buildScene();
      BossFrameManager.requestHideBossFrame();

      // Act
      scene.handleShowBossFrame();

      // Assert
      expect(window.requestShowBossFrame).not.toHaveBeenCalled();
    });

    it('asks the window to reveal and acknowledges only the show request', () =>
    {
      // Arrange
      const { scene, window } = buildScene();
      BossFrameManager.requestShowBossFrame();
      BossFrameManager.requestHideBossFrame();

      // Act
      scene.handleShowBossFrame();

      // Assert
      expect(window.requestShowBossFrame).toHaveBeenCalledTimes(1);
      expect(BossFrameManager.needsBossFrameShowing()).toBe(false);
      expect(BossFrameManager.needsBossFrameHiding()).toBe(true);
    });
  });
});
//endregion plugins/hud/ext/boss/scenes/scene-map.test.js