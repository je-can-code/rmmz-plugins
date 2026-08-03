//region plugins/_base/ext/save/save-thumbnail.test.js
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('save thumbnail (direct src import)', () =>
{
  let SaveThumbnail;

  beforeAll(async () =>
  {
    // vanilla RMMZ core prototype extensions the source reads at module scope and at runtime.
    Object.defineProperty(String, 'empty', {
      enumerable: true,
      configurable: true,
      get: () => '',
    });

    // `cropRect` clamps through this, and it is a real prototype extension the engine installs.
    Number.prototype.clamp = function(min, max)
    {
      return Math.min(Math.max(this, min), max);
    };

    ({ default: SaveThumbnail } = await import('../../../../../src/plugins/_base/ext/save/core/SaveThumbnail.js'));
  });

  beforeEach(() =>
  {
    globalThis.SceneManager = { backgroundBitmap: () => null };

    // the requested size is a static, so a test that sets it would otherwise decide the answer for
    // every test after it in this file. Cleared back to "nobody has said" before each one.
    SaveThumbnail.requestSize(0);
  });

  //region cropping
  describe('SaveThumbnail.cropRect()', () =>
  {
    it('takes its configured share of the source height', () =>
    {
      // Arrange
      // Act
      const { sh } = SaveThumbnail.cropRect(960, 540, 1920, 1080);

      // Assert
      expect(sh).toBe(540);
    });

    it('takes exactly the height a display has asked for, so nothing rescales it', () =>
    {
      // Arrange
      SaveThumbnail.requestSize(414);

      // Act
      const { sw, sh } = SaveThumbnail.cropRect(960, 540, 1920, 1080);

      // Assert- cropping precisely what will be drawn is the whole point: the file is then a lossless
      // slice of the screen and the row draws it one pixel for one, with no resampling either way.
      expect(sh).toBe(414);
      expect(sw).toBe(736);
    });

    it('still clamps a requested size larger than the capture itself', () =>
    {
      // Arrange
      SaveThumbnail.requestSize(2000);

      // Act
      const { sh } = SaveThumbnail.cropRect(960, 540, 1920, 1080);

      // Assert- asking for more than exists cannot be honoured, and stretching to cover the shortfall
      // would be the resampling this exists to avoid.
      expect(sh).toBe(1080);
    });

    it('holds the crop to the stored aspect', () =>
    {
      // Arrange
      // Act
      const { sw, sh } = SaveThumbnail.cropRect(960, 540, 1920, 1080);

      // Assert
      expect(sw / sh).toBeCloseTo(16 / 9, 5);
    });

    it('centres on the point it was given, when there is room on both sides', () =>
    {
      // Arrange
      // Act
      const { sx, sy, sw, sh } = SaveThumbnail.cropRect(960, 540, 1920, 1080);

      // Assert
      expect(sx + (sw / 2)).toBe(960);
      expect(sy + (sh / 2)).toBe(540);
    });

    it('clamps to the left edge rather than running off it', () =>
    {
      // Arrange
      // the ordinary case at a map boundary: the engine stops scrolling and the player walks toward
      // the edge of a stationary screen instead of staying centred.
      // Act
      const { sx } = SaveThumbnail.cropRect(40, 540, 1920, 1080);

      // Assert
      expect(sx).toBe(0);
    });

    it('clamps to the right edge rather than running off it', () =>
    {
      // Arrange
      // Act
      const { sx, sw } = SaveThumbnail.cropRect(1900, 540, 1920, 1080);

      // Assert
      expect(sx + sw).toBe(1920);
    });

    it('clamps to the top edge rather than running off it', () =>
    {
      // Arrange
      // Act
      const { sy } = SaveThumbnail.cropRect(960, 10, 1920, 1080);

      // Assert
      expect(sy).toBe(0);
    });

    it('clamps to the bottom edge rather than running off it', () =>
    {
      // Arrange
      // Act
      const { sy, sh } = SaveThumbnail.cropRect(960, 1070, 1920, 1080);

      // Assert
      expect(sy + sh).toBe(1080);
    });

    it('shrinks the height rather than stretching, when the source is too narrow for the aspect', () =>
    {
      // Arrange
      // a 4:3 source cannot supply a 16:9 crop at half its height without exceeding its own width.
      // Act
      const { sw, sh } = SaveThumbnail.cropRect(320, 240, 640, 480);

      // Assert
      expect(sw).toBeLessThanOrEqual(640);
      expect(sw / sh).toBeCloseTo(16 / 9, 1);
    });

    it('never asks for more than the source holds', () =>
    {
      // Arrange
      // Act
      const { sx, sy, sw, sh } = SaveThumbnail.cropRect(50, 50, 100, 100);

      // Assert
      expect(sx).toBeGreaterThanOrEqual(0);
      expect(sy).toBeGreaterThanOrEqual(0);
      expect(sx + sw).toBeLessThanOrEqual(100);
      expect(sy + sh).toBeLessThanOrEqual(100);
    });
  });

  //endregion cropping

  //region capturing
  describe('SaveThumbnail.capture()', () =>
  {
    it('answers with nothing when the engine has never taken a background capture', () =>
    {
      // Arrange
      // the engine seeds `_backgroundBitmap` to null and only fills it on the first non-battle scene
      // exit, so a save reached without ever leaving a map genuinely has nothing to photograph.
      // Act
      const captured = SaveThumbnail.capture();

      // Assert
      expect(captured).toBe('');
    });
  });

  //endregion capturing
});
//endregion plugins/_base/ext/save/save-thumbnail.test.js