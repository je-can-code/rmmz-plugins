//region plugins/passive/ext/affix/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The boot hook sets up the affix weights and describes this plugin's tags, after whatever the database load
 * already did. The order is the contract: both read a database the original logic finished loading.
 */
describe('J-Passive-Affix Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;
  let calls;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      PASSIVE: {
        EXT: {
          AFFIX: {
            Aliased: { Scene_Boot: new Map() },
            Metadata: { initializeStateAffixWeights: () => calls.push('weights') },
          },
        },
      },
    };

    vi.doMock('../../../../../../src/plugins/passive/ext/affix/core/describeAffixNotetags.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('describeAll')) },
    }));

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn(() => calls.push('original'));
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../../src/plugins/passive/ext/affix/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    calls = [];
    originalOnDatabaseLoaded.mockClear();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('performs the original logic, then sets up the affix weights, then describes the tags', () =>
    {
      // Arrange
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.onDatabaseLoaded();

      // Assert
      expect(calls)
        .toEqual([ 'original', 'weights', 'describeAll' ]);
    });
  });
});
//endregion plugins/passive/ext/affix/scenes/scene-boot.test.js
