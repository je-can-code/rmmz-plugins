//region plugins/natural/core/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The bindings attach to definitions J-Base registers in its own boot hook, so the order here is the
 * whole contract: the original must run first, or every bind would reach for a key that is not there yet.
 */
describe('J-NaturalGrowth Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;
  let calls;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { NATURAL: { Aliased: { Scene_Boot: new Map() } } };

    vi.doMock('../../../../../src/plugins/natural/core/core/registerNaturalParameters.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('registerAll')) },
    }));

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn(() => calls.push('original'));
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../src/plugins/natural/core/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    calls = [];
    originalOnDatabaseLoaded.mockClear();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('performs the original logic, then binds natural growth, in that order', () =>
    {
      // Arrange
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.onDatabaseLoaded();

      // Assert
      expect(calls).toEqual([ 'original', 'registerAll' ]);
    });
  });
});
//endregion plugins/natural/core/scenes/scene-boot.test.js
