//region plugins/crit/_component/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The boot hook registers this plugin's parameters, describes its tags, and marks its conditional tags as
 * non-combining, all after whatever the database load already did. The order is the contract: every step reads
 * a database and a catalog the original logic finished building.
 */
describe('J-CriticalFactors Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;
  let registerNonCombiningKey;
  let calls;

  beforeAll(async () =>
  {
    vi.resetModules();

    registerNonCombiningKey = vi.fn(() => calls.push('nonCombining'));
    globalThis.J = {
      CRIT: {
        Aliased: { Scene_Boot: new Map() },
        RegExp: {},
      },
      EXTEND: { Metadata: { registerNonCombiningKey } },
    };

    vi.doMock('../../../../src/plugins/crit/core/core/registerCritParameters.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('parameters')) },
    }));

    vi.doMock('../../../../src/plugins/crit/core/core/describeCritNotetags.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('describeAll')) },
    }));

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn(() => calls.push('original'));
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../src/plugins/crit/core/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    calls = [];
    originalOnDatabaseLoaded.mockClear();
    registerNonCombiningKey.mockClear();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('performs the original logic, registers the parameters, then describes the tags', () =>
    {
      // Arrange
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.onDatabaseLoaded();

      // Assert- the eight conditional crit tags are marked last.
      expect(calls.slice(0, 3))
        .toEqual([ 'original', 'parameters', 'describeAll' ]);
      expect(registerNonCombiningKey)
        .toHaveBeenCalledTimes(8);
    });
  });
});
//endregion plugins/crit/_component/scene-boot.test.js
