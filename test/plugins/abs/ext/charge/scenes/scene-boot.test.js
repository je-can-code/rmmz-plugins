//region plugins/abs/ext/charge/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-ABS-Charge Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;

  beforeAll(async () =>
  {
    vi.resetModules();

    const CHARGE_DATA_REGEX = Symbol('ChargeData');
    globalThis.J = {
      ABS: { EXT: { CHARGE: { Aliased: { Scene_Boot: new Map() }, RegExp: { ChargeData: CHARGE_DATA_REGEX } } } },
      EXTEND: { Metadata: { registerNonCombiningKey: vi.fn() } },
    };

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn();
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../../src/plugins/abs/ext/charge/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    originalOnDatabaseLoaded.mockReset();
    globalThis.J.EXTEND.Metadata.registerNonCombiningKey.mockReset();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('performs the original logic then registers the chargeTier tag as non-combining', () =>
    {
      // Arrange
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.onDatabaseLoaded();

      // Assert
      expect(originalOnDatabaseLoaded).toHaveBeenCalledTimes(1);
      expect(globalThis.J.EXTEND.Metadata.registerNonCombiningKey)
        .toHaveBeenCalledWith(globalThis.J.ABS.EXT.CHARGE.RegExp.ChargeData);
    });
  });
});
//endregion plugins/abs/ext/charge/scenes/scene-boot.test.js
