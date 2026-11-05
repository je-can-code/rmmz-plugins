//region plugins/abs/core/scenes/scene-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Scene_Map.js is a prototype-patch file, so this file direct-imports it against a bare placeholder
 * engine global rather than booting a scene. The one thing worth pinning here is an ordering: the
 * restore of runtime-spawned events has to land before the original builds the spriteset, because
 * every sprite it builds reads its event's page, and a spawned event has no page until it is restored.
 */
describe('J-ABS Scene_Map (unit, all downstream dependencies mocked)', () =>
{
  let originalCreateDisplayObjects;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { Aliased: { Scene_Map: new Map() } } };

    function Scene_Map()
    {
    }
    originalCreateDisplayObjects = vi.fn();
    Scene_Map.prototype.createDisplayObjects = originalCreateDisplayObjects;
    globalThis.Scene_Map = Scene_Map;

    vi.doMock('../../../../../src/plugins/abs/core/managers/JABS_AiManager.js', () => ({ default: {} }));

    await import('../../../../../src/plugins/abs/core/scenes/Scene_Map.js');
  });

  beforeEach(() =>
  {
    originalCreateDisplayObjects.mockReset();
    globalThis.$gameMap = { restoreDynamicEventData: vi.fn() };
  });

  describe('createDisplayObjects()', () =>
  {
    it('restores what was spawned before any sprite is built', () =>
    {
      // Arrange
      const callOrder = [];
      globalThis.$gameMap.restoreDynamicEventData.mockImplementation(() => callOrder.push('restore'));
      originalCreateDisplayObjects.mockImplementation(() => callOrder.push('build'));
      const scene = Object.create(globalThis.Scene_Map.prototype);

      // Act
      scene.createDisplayObjects();

      // Assert
      expect(callOrder).toEqual([ 'restore', 'build' ]);
    });
  });
});
//endregion plugins/abs/core/scenes/scene-map.test.js
