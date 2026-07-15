//region plugins/hud/ext/target/managers/image-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('ImageManager.loadHudBitmap (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.ImageManager = { loadBitmapPromise: vi.fn() };

    await import('../../../../../../src/plugins/hud/ext/target/managers/ImageManager.js');
  });

  describe('loadHudBitmap', () =>
  {
    it('delegates to loadBitmapPromise with the hud image folder', () =>
    {
      // Arrange
      const expectedPromise = Promise.resolve({});
      globalThis.ImageManager.loadBitmapPromise.mockReturnValue(expectedPromise);

      // Act
      const result = globalThis.ImageManager.loadHudBitmap('target-frame');

      // Assert
      expect(globalThis.ImageManager.loadBitmapPromise).toHaveBeenCalledWith('target-frame', 'img/hud/');
      expect(result).toBe(expectedPromise);
    });
  });
});
//endregion plugins/hud/ext/target/managers/image-manager.test.js
