//region plugins/drops/core/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The boot hook registers this plugin's parameters, describes its tags, marks its drops tag as non-combining and
 * builds the drop ladders, all after whatever the database load already did. The order is the contract: every step
 * reads a database and a catalog the original logic finished building.
 */
describe('J-DropsControl Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;
  let calls;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      DROPS: {
        Aliased: { Scene_Boot: new Map() },
        RegExp: { ExtraDrop: /<drops>/ },
        Metadata: {
          dropLadderTables: () => 'ladder tables',
          buildDropLadders: vi.fn(() => calls.push('ladders')),
        },
      },
      EXTEND: { Metadata: { registerNonCombiningKey: vi.fn(() => calls.push('nonCombining')) } },
    };

    vi.doMock('../../../../../src/plugins/drops/core/core/registerDropsParameters.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('parameters')) },
    }));

    vi.doMock('../../../../../src/plugins/drops/core/core/describeDropsNotetags.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('describeAll')) },
    }));

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn(() => calls.push('original'));
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../src/plugins/drops/core/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    calls = [];
    originalOnDatabaseLoaded.mockClear();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('performs the original logic, registers the parameters, describes the tags, then finishes the drops', () =>
    {
      // Arrange
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.onDatabaseLoaded();

      // Assert
      expect(calls)
        .toEqual([ 'original', 'parameters', 'describeAll', 'nonCombining', 'ladders' ]);
      expect(globalThis.J.DROPS.Metadata.buildDropLadders)
        .toHaveBeenCalledWith('ladder tables');
    });
  });
});
//endregion plugins/drops/core/scenes/scene-boot.test.js
