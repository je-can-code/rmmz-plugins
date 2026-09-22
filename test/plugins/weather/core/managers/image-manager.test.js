//region plugins/weather/core/managers/image-manager.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Loading a weather particle's picture.
 *
 * One line of augmentation, and the only thing worth pinning is the folder - a typo there fails as
 * every particle in the game silently drawing nothing, which looks exactly like the weather being
 * switched off.
 */
describe('ImageManager.loadWeather', () =>
{
  let requested;

  beforeAll(async () =>
  {
    vi.resetModules();

    globalThis.ImageManager = {
      loadBitmap: (folder, filename) =>
      {
        requested = {
          folder,
          filename,
        };

        return { folder };
      },
    };

    await import('../../../../../src/plugins/weather/core/managers/ImageManager.js');
  });

  beforeEach(() =>
  {
    requested = null;
  });

  it('loads from the engine own weather folder', () =>
  {
    // Arrange & Act.
    globalThis.ImageManager.loadWeather('Rain_01A');

    // Assert.
    expect(requested.folder)
      .toBe('img/weather/');
  });

  it('asks for the picture it was given', () =>
  {
    // Arrange & Act - a second name, so "passed the filename through" can be told apart from
    // "happened to hardcode the one the other case used".
    globalThis.ImageManager.loadWeather('Cloud_05A');

    // Assert.
    expect(requested.filename)
      .toBe('Cloud_05A');
  });

  it('hands back whatever the engine loader produced', () =>
  {
    // Arrange & Act.
    const result = globalThis.ImageManager.loadWeather('Snow_01');

    // Assert.
    expect(result)
      .toEqual({ folder: 'img/weather/' });
  });
});
//endregion plugins/weather/core/managers/image-manager.test.js