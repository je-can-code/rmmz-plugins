//region plugins/map/core/managers/jabs-input-adapter.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('JABS_InputAdapter ext/map augments (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    // the whole source file is gated behind `if (J.ABS)` at module-load time.
    globalThis.J = { ABS: true };
    globalThis.JABS_InputAdapter = {};

    await import('../../../../../src/plugins/map/core/managers/JABS_InputAdapter.js');
  });

  beforeEach(() =>
  {
    globalThis.$gameMap = { isMinimapBlocked: vi.fn().mockReturnValue(false) };
    globalThis.$gameSystem = { toggleMinimapVisibility: vi.fn() };
    globalThis.SceneManager = { _scene: { isMapScene: vi.fn().mockReturnValue(true), getMiniMap: vi.fn() } };
  });

  describe('performMinimapWindowAction', () =>
  {
    it('toggles minimap visibility when the action is allowed', () =>
    {
      // Arrange/Act
      globalThis.JABS_InputAdapter.performMinimapWindowAction();

      // Assert
      expect(globalThis.$gameSystem.toggleMinimapVisibility).toHaveBeenCalled();
    });

    it('does not toggle when the current map blocks the minimap', () =>
    {
      // Arrange
      globalThis.$gameMap.isMinimapBlocked.mockReturnValue(true);

      // Act
      globalThis.JABS_InputAdapter.performMinimapWindowAction();

      // Assert
      expect(globalThis.$gameSystem.toggleMinimapVisibility).not.toHaveBeenCalled();
    });
  });

  describe('_canPerformMinimapWindowAction', () =>
  {
    it('returns false when the current map blocks the minimap', () =>
    {
      // Arrange
      globalThis.$gameMap.isMinimapBlocked.mockReturnValue(true);

      // Act
      const result = globalThis.JABS_InputAdapter._canPerformMinimapWindowAction();

      // Assert
      expect(result).toEqual(false);
    });

    it('returns true when the current map does not block the minimap', () =>
    {
      // Arrange/Act
      const result = globalThis.JABS_InputAdapter._canPerformMinimapWindowAction();

      // Assert
      expect(result).toEqual(true);
    });
  });

  describe('performMinimapFocusStart', () =>
  {
    it('does nothing when the current map blocks the minimap', () =>
    {
      // Arrange
      globalThis.$gameMap.isMinimapBlocked.mockReturnValue(true);

      // Act
      globalThis.JABS_InputAdapter.performMinimapFocusStart();

      // Assert
      expect(globalThis.SceneManager._scene.getMiniMap).not.toHaveBeenCalled();
    });

    it('does nothing when the active scene is not the map scene', () =>
    {
      // Arrange
      globalThis.SceneManager._scene.isMapScene.mockReturnValue(false);

      // Act
      globalThis.JABS_InputAdapter.performMinimapFocusStart();

      // Assert
      expect(globalThis.SceneManager._scene.getMiniMap).not.toHaveBeenCalled();
    });

    it('does nothing when the map scene has no minimap sprite', () =>
    {
      // Arrange
      globalThis.SceneManager._scene.getMiniMap.mockReturnValue(null);

      // Act/Assert (no throw)
      expect(() => globalThis.JABS_InputAdapter.performMinimapFocusStart()).not.toThrow();
    });

    it('enters focus mode on the minimap sprite', () =>
    {
      // Arrange
      const mini = { enterFocusMode: vi.fn() };
      globalThis.SceneManager._scene.getMiniMap.mockReturnValue(mini);

      // Act
      globalThis.JABS_InputAdapter.performMinimapFocusStart();

      // Assert
      expect(mini.enterFocusMode).toHaveBeenCalled();
    });
  });

  describe('performMinimapFocusEnd', () =>
  {
    it('does nothing when the active scene is not the map scene', () =>
    {
      // Arrange
      globalThis.SceneManager._scene.isMapScene.mockReturnValue(false);

      // Act
      globalThis.JABS_InputAdapter.performMinimapFocusEnd();

      // Assert
      expect(globalThis.SceneManager._scene.getMiniMap).not.toHaveBeenCalled();
    });

    it('does nothing when the map scene has no minimap sprite', () =>
    {
      // Arrange
      globalThis.SceneManager._scene.getMiniMap.mockReturnValue(null);

      // Act/Assert (no throw)
      expect(() => globalThis.JABS_InputAdapter.performMinimapFocusEnd()).not.toThrow();
    });

    it('exits focus mode on the minimap sprite', () =>
    {
      // Arrange
      const mini = { exitFocusMode: vi.fn() };
      globalThis.SceneManager._scene.getMiniMap.mockReturnValue(mini);

      // Act
      globalThis.JABS_InputAdapter.performMinimapFocusEnd();

      // Assert
      expect(mini.exitFocusMode).toHaveBeenCalled();
    });
  });
});
//endregion plugins/map/core/managers/jabs-input-adapter.test.js
