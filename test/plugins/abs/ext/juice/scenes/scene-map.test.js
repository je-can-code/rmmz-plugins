//region plugins/abs/ext/juice/scenes/scene-map.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Juice Scene_Map (unit, all downstream dependencies mocked)', () =>
{
  let originalUpdate;
  let originalTerminate;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { JUICE: { Aliased: { Scene_Map: new Map() } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js', () => ({
      default: { frameTick: vi.fn(), clearAll: vi.fn() },
    }));

    function Scene_Map()
    {
    }

    originalUpdate = vi.fn();
    originalTerminate = vi.fn();
    Scene_Map.prototype.update = originalUpdate;
    Scene_Map.prototype.terminate = originalTerminate;
    globalThis.Scene_Map = Scene_Map;

    await import('../../../../../../src/plugins/abs/ext/juice/scenes/Scene_Map.js');
  });

  beforeEach(() =>
  {
    originalUpdate.mockReset();
    originalTerminate.mockReset();
  });

  describe('update', () =>
  {
    it('performs the original logic then ticks queued juice effects', async () =>
    {
      const { default: JuiceMotionManager } =
        await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js');
      const scene = Object.create(globalThis.Scene_Map.prototype);

      scene.update();

      expect(originalUpdate).toHaveBeenCalledTimes(1);
      expect(JuiceMotionManager.frameTick).toHaveBeenCalledTimes(1);
    });
  });

  describe('terminate', () =>
  {
    it('flushes all queued juice effects before performing the original teardown', async () =>
    {
      const { default: JuiceMotionManager } =
        await import('../../../../../../src/plugins/abs/ext/juice/managers/JuiceMotionManager.js');
      const callOrder = [];
      JuiceMotionManager.clearAll.mockImplementation(() => callOrder.push('clear'));
      originalTerminate.mockImplementation(() => callOrder.push('original'));
      const scene = Object.create(globalThis.Scene_Map.prototype);

      scene.terminate();

      expect(callOrder).toEqual([ 'clear', 'original' ]);
    });
  });
});
//endregion plugins/abs/ext/juice/scenes/scene-map.test.js
