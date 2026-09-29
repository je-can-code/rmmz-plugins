//region plugins/prof/core/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The boot hook registers this plugin's parameter, describes its tags and initializes the proficiency data, all
 * after whatever the database load already did. The order is the contract: every step reads a database the original
 * logic finished building.
 */
describe('J-Proficiency Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;
  let calls;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = {
      PROF: {
        Aliased: { Scene_Boot: new Map() },
        Metadata: { initializeProficiencies: vi.fn(() => calls.push('proficiencies')) },
      },
    };

    vi.doMock('../../../../../src/plugins/prof/core/core/registerProfParameters.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('parameters')) },
    }));

    vi.doMock('../../../../../src/plugins/prof/core/core/describeProfNotetags.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('describeAll')) },
    }));

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn(() => calls.push('original'));
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../src/plugins/prof/core/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    calls = [];
    originalOnDatabaseLoaded.mockClear();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('performs the original logic, registers the parameter, describes the tags, then builds proficiencies', () =>
    {
      // Arrange
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.onDatabaseLoaded();

      // Assert
      expect(calls)
        .toEqual([ 'original', 'parameters', 'describeAll', 'proficiencies' ]);
    });
  });
});
//endregion plugins/prof/core/scenes/scene-boot.test.js
