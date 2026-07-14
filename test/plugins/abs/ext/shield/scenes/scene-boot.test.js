//region plugins/abs/ext/shield/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Shield Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SHIELD: { Aliased: { Scene_Boot: new Map() } } } } };

    vi.doMock('../../../../../../src/plugins/abs/ext/shield/core/registerShieldParameters.js', () => ({
      default: { registerAll: vi.fn() },
    }));

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn();
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../../src/plugins/abs/ext/shield/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    originalOnDatabaseLoaded.mockReset();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('performs the original logic then registers shield parameters', async () =>
    {
      const { default: ShieldParameterRegistration } =
        await import('../../../../../../src/plugins/abs/ext/shield/core/registerShieldParameters.js');
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      scene.onDatabaseLoaded();

      expect(originalOnDatabaseLoaded).toHaveBeenCalledTimes(1);
      expect(ShieldParameterRegistration.registerAll).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/shield/scenes/scene-boot.test.js
