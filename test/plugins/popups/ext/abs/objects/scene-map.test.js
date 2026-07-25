//region plugins/popups/ext/abs/objects/scene-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Scene_Map ext/abs augments (direct src import)', () =>
{
  let FakeJABSPopupMergeController;

  beforeAll(async () =>
  {
    vi.resetModules();

    FakeJABSPopupMergeController = { tickIdleFlush: vi.fn() };
    vi.doMock('../../../../../../src/plugins/popups/ext/abs/managers/JABS_PopupMergeController.js', () => ({ default: FakeJABSPopupMergeController }));

    globalThis.J = { POPUPS: { Aliased: { Scene_Map: new Map() }, notifyMergeFlushAll: vi.fn() } };

    function StubSceneMap()
    {
    }

    StubSceneMap.prototype.update = vi.fn();
    StubSceneMap.prototype.stop = vi.fn();
    globalThis.Scene_Map = StubSceneMap;

    await import('../../../../../../src/plugins/popups/ext/abs/objects/Scene_Map.js');
  });

  beforeEach(() =>
  {
    vi.clearAllMocks();
  });

  describe('update', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const scene = new globalThis.Scene_Map();

      // Act
      scene.update();

      // Assert
      expect(globalThis.J.POPUPS.Aliased.Scene_Map.get('update')).toHaveBeenCalled();
    });

    it('ticks the idle merge flush', () =>
    {
      // Arrange
      const scene = new globalThis.Scene_Map();

      // Act
      scene.update();

      // Assert
      expect(FakeJABSPopupMergeController.tickIdleFlush).toHaveBeenCalled();
    });
  });

  describe('stop', () =>
  {
    it('always calls through to the original aliased implementation', () =>
    {
      // Arrange
      const scene = new globalThis.Scene_Map();

      // Act
      scene.stop();

      // Assert
      expect(globalThis.J.POPUPS.Aliased.Scene_Map.get('stop')).toHaveBeenCalled();
    });

    it('notifies a full merge flush so floats do not leak across transfers', () =>
    {
      // Arrange
      const scene = new globalThis.Scene_Map();

      // Act
      scene.stop();

      // Assert
      expect(globalThis.J.POPUPS.notifyMergeFlushAll).toHaveBeenCalledWith('scene-map-stop');
    });
  });
});
//endregion plugins/popups/ext/abs/objects/scene-map.test.js
