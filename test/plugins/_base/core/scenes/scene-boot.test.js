//region plugins/_base/core/scenes/scene-boot.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * J-Base's boot hook runs first of every plugin's, so what it seeds is there for everyone after it: the engine's
 * parameters, for owners to append theirs to, and the sentences every notetag is described with.
 */
describe('J-Base Scene_Boot (unit, all downstream dependencies mocked)', () =>
{
  let originalOnDatabaseLoaded;
  let calls;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.J = { BASE: { Aliased: { Scene_Boot: new Map() } } };

    vi.doMock('../../../../../src/plugins/_base/core/core/registerVanillaParameters.js', () => ({
      default: { registerAll: vi.fn(() => calls.push('parameters')) },
    }));

    vi.doMock('../../../../../src/plugins/_base/core/managers/NotetagDescriber.js', () => ({
      default: { loadTemplates: vi.fn(() => calls.push('templates')) },
    }));

    function Scene_Boot()
    {
    }

    originalOnDatabaseLoaded = vi.fn(() => calls.push('original'));
    Scene_Boot.prototype.onDatabaseLoaded = originalOnDatabaseLoaded;
    globalThis.Scene_Boot = Scene_Boot;

    await import('../../../../../src/plugins/_base/core/scenes/Scene_Boot.js');
  });

  beforeEach(() =>
  {
    calls = [];
    originalOnDatabaseLoaded.mockClear();
  });

  describe('onDatabaseLoaded', () =>
  {
    it('registers the engine\'s parameters, loads the notetag sentences, then performs the original logic', () =>
    {
      // Arrange
      const scene = Object.create(globalThis.Scene_Boot.prototype);

      // Act
      scene.onDatabaseLoaded();

      // Assert
      expect(calls)
        .toEqual([ 'parameters', 'templates', 'original' ]);
    });
  });
});
//endregion plugins/_base/core/scenes/scene-boot.test.js
