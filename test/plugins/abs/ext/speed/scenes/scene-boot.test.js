//region plugins/abs/ext/speed/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Speed Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ABS: { EXT: { SPEED: { Aliased: { Scene_Boot: new Map() } } } } };

    // SpeedParameterRegistration is a downstream dependency (a sibling core file); mock its static API.
    vi.doMock('../../../../../../src/plugins/abs/ext/speed/core/registerSpeedParameters.js', () => ({
      default: { registerAll: vi.fn() },
    }));

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn();
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../../src/plugins/abs/ext/speed/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    originalOnDatabaseLoaded.mockReset();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('performs the original logic then registers the speed parameter', async () =>
    {
      // Arrange
      const { default: SpeedParameterRegistration } =
        await import('../../../../../../src/plugins/abs/ext/speed/core/registerSpeedParameters.js');
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.onDatabaseLoaded();

      // Assert
      expect(originalOnDatabaseLoaded).toHaveBeenCalledTimes(1);
      expect(SpeedParameterRegistration.registerAll).toHaveBeenCalledTimes(1);
    });
  });
});
//endregion plugins/abs/ext/speed/scenes/scene-boot.test.js
