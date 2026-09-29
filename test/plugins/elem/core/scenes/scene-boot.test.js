//region plugins/elem/core/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The boot hook describes this plugin's tags after whatever the database load already did, since a describer is
 * only ever asked about rows that load finished building.
 */
describe('J-Elementalistics Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;
  let calls;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { ELEM: { Aliased: { Scene_Boot: new Map() } } };

    vi.doMock('../../../../../src/plugins/elem/core/core/describeElemNotetags.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('describeAll')) },
    }));

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn(() => calls.push('original'));
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../src/plugins/elem/core/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    calls = [];
    originalOnDatabaseLoaded.mockClear();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('performs the original logic, then describes the tags', () =>
    {
      // Arrange
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.onDatabaseLoaded();

      // Assert
      expect(calls)
        .toEqual([ 'original', 'describeAll' ]);
    });
  });
});
//endregion plugins/elem/core/scenes/scene-boot.test.js
