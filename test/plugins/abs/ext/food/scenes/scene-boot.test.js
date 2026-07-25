//region plugins/abs/ext/food/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Food Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalStart;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { FOOD: { Aliased: { Scene_Boot: new Map() } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainPlan.js', () => ({
      default: { buildRegistry: vi.fn() },
    }));

    function Scene_Boot()
    {
    }

    originalStart = vi.fn();
    Scene_Boot.prototype.start = originalStart;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../../src/plugins/abs/ext/food/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    originalStart.mockReset();
  });

  describe('start', () =>
  {
    it('performs the original logic then builds the food chain registry', async () =>
    {
      // Arrange
      const { default: JABS_FoodChainPlan } =
        await import('../../../../../../src/plugins/abs/ext/food/models/JABS_FoodChainPlan.js');
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.start();

      // Assert
      expect(originalStart).toHaveBeenCalledTimes(1);
      expect(JABS_FoodChainPlan.buildRegistry).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/food/scenes/scene-boot.test.js
