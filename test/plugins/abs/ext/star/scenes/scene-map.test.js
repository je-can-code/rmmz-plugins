//region plugins/abs/ext/star/scenes/scene-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Star Scene_Map (unit, all downstream dependencies mocked)', () =>
{
  let originalUpdate;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { STAR: { Aliased: { Scene_Map: new Map() } } } } };

    function Scene_Map()
    {
    }

    originalUpdate = vi.fn();
    Scene_Map.prototype.update = originalUpdate;
    globalThis.Scene_Map = Scene_Map;

    await import('../../../../../../src/plugins/abs/ext/star/scenes/Scene_Map.js');
  });

  beforeEach(() =>
  {
    originalUpdate.mockReset();
  });

  function buildScene()
  {
    return Object.create(globalThis.Scene_Map.prototype);
  }

  describe('updateEncounter', () =>
  {
    it('starts a fade-out when an encounter is executed', () =>
    {
      // Arrange
      globalThis.$gamePlayer = { executeEncounter: () => true };
      const scene = buildScene();
      scene.startFadeOut = vi.fn();

      // Act
      scene.updateEncounter();

      // Assert
      expect(scene.startFadeOut).toHaveBeenCalledTimes(1);
    });

    it('does not fade out when no encounter is executed', () =>
    {
      // Arrange
      globalThis.$gamePlayer = { executeEncounter: () => false };
      const scene = buildScene();
      scene.startFadeOut = vi.fn();

      // Act
      scene.updateEncounter();

      // Assert
      expect(scene.startFadeOut).not.toHaveBeenCalled();
    });
  });

  describe('update', () =>
  {
    it('performs the original logic', () =>
    {
      const scene = buildScene();
      scene.update();
      expect(originalUpdate).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/star/scenes/scene-map.test.js
