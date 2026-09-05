//region plugins/_base/core/core/bitmap-device-scale.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The trick that lets a window rasterize its text at the display's resolution without a single one
 * of its several hundred drawing calls changing.
 *
 * A device-scaled bitmap holds more real pixels than the area it reports occupying, and the whole
 * contract rests on that gap being invisible: the canvas grows, the texture is told the pixels
 * describe the smaller area, the drawing context is scaled to match, and `width` keeps answering
 * the number it always did. So the assertions here are mostly about what did *not* change.
 */
describe('Bitmap device scaling (direct src import)', () =>
{
  /** @type {Function} */
  let originalInitialize;

  /** @type {Function} */
  let originalResize;

  /** @type {Function} */
  let originalGetPixel;

  /** @type {Function} */
  let originalGetAlphaPixel;

  /**
   * Builds a bitmap the way the engine would, with the storage the real one keeps.
   * @param {number} width The logical width.
   * @param {number} height The logical height.
   * @returns {Object} The bitmap.
   */
  const buildBitmap = (width, height) => new globalThis.Bitmap(width, height);

  beforeAll(async () =>
  {
    globalThis.J = { BASE: { Aliased: { Bitmap: new Map() } } };

    function Bitmap()
    {
      this.initialize(...arguments);
    }

    // the parts of the real Bitmap that the augment reaches through.
    originalInitialize = function(width, height)
    {
      this._canvas = {
        width: width || 0,
        height: height || 0,
      };
      this._context = { setTransform: vi.fn() };
      this._baseTexture = { setRealSize: vi.fn() };
      this._image = null;
    };
    originalResize = function(width, height)
    {
      this._canvas.width = Math.max(width || 0, 1);
      this._canvas.height = Math.max(height || 0, 1);
    };
    originalGetPixel = vi.fn(() => '#ffffff');
    originalGetAlphaPixel = vi.fn(() => 255);

    Bitmap.prototype.initialize = originalInitialize;
    Bitmap.prototype.resize = originalResize;
    Bitmap.prototype.getPixel = originalGetPixel;
    Bitmap.prototype.getAlphaPixel = originalGetAlphaPixel;
    Bitmap.prototype.drawText = vi.fn();

    Object.defineProperty(Bitmap.prototype, 'canvas', {
      get()
      {
        return this._canvas;
      },
      configurable: true,
    });
    Object.defineProperty(Bitmap.prototype, 'context', {
      get()
      {
        return this._context;
      },
      configurable: true,
    });
    Object.defineProperty(Bitmap.prototype, 'baseTexture', {
      get()
      {
        return this._baseTexture;
      },
      configurable: true,
    });

    globalThis.Bitmap = Bitmap;

    await import('../../../../../src/plugins/_base/core/core/Bitmap.js');
  });

  beforeEach(() =>
  {
    originalGetPixel.mockClear();
    originalGetAlphaPixel.mockClear();
  });

  describe('initialize', () =>
  {
    it('seeds every bitmap at an unscaled one, so nothing changes for the vast majority', () =>
    {
      // Arrange & Act.
      const bitmap = buildBitmap(200, 100);

      // Assert.
      expect(bitmap.deviceScale()).toBe(1);
    });

    it('answers an unscaled one for a bitmap built before the augment existed', () =>
    {
      // Arrange - `ImageManager._emptyBitmap` is a `new Bitmap(1, 1)` evaluated at the top level of
      // rmmz_managers.js, so it never runs the aliased initialize and holds no own `_deviceScale`.
      const preexisting = Object.create(globalThis.Bitmap.prototype);
      originalInitialize.call(preexisting, 1, 1);
      delete preexisting._deviceScale;

      // Act.
      const result = preexisting.width;

      // Assert - a missing scale divides to NaN, which reaches `pivot` and strands the sprite that
      // wears this bitmap at a NaN world matrix while every visibility flag still reads true.
      expect(preexisting.deviceScale()).toBe(1);
      expect(result).toBe(1);
    });
  });

  describe('setDeviceScale', () =>
  {
    it('records the scale it is handed', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);

      // Act.
      bitmap.setDeviceScale(2);

      // Assert.
      expect(bitmap.deviceScale()).toBe(2);
    });
  });

  describe('width', () =>
  {
    it('reports the canvas width untouched on an unscaled bitmap', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);

      // Act.
      const result = bitmap.width;

      // Assert.
      expect(result).toBe(200);
    });

    it('reports zero while a bitmap has neither a canvas nor a loaded image', () =>
    {
      // Arrange - the state a bitmap loading from a url sits in.
      const bitmap = buildBitmap(200, 100);
      bitmap._canvas = null;

      // Act.
      const result = bitmap.width;

      // Assert - anything else would divide `undefined` and report NaN across the whole engine.
      expect(result).toBe(0);
    });
  });

  describe('height', () =>
  {
    it('reports the canvas height untouched on an unscaled bitmap', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);

      // Act.
      const result = bitmap.height;

      // Assert.
      expect(result).toBe(100);
    });

    it('reports zero while a bitmap has neither a canvas nor a loaded image', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);
      bitmap._canvas = null;

      // Act.
      const result = bitmap.height;

      // Assert.
      expect(result).toBe(0);
    });
  });

  describe('applyDeviceScale', () =>
  {
    it('grows the canvas while the reported size stays exactly where it was', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);

      // Act.
      bitmap.applyDeviceScale(1.5);

      // Assert - the gap between these two pairs is the entire point of the mechanism.
      expect(bitmap.canvas.width).toBe(300);
      expect(bitmap.canvas.height).toBe(150);
      expect(bitmap.width).toBe(200);
      expect(bitmap.height).toBe(100);
    });

    it('tells the texture that its real pixels describe the smaller logical area', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);

      // Act.
      bitmap.applyDeviceScale(1.5);

      // Assert - without this the engine would frame the contents sprite off the end of its texture.
      expect(bitmap.baseTexture.setRealSize).toHaveBeenCalledWith(300, 150, 1.5);
    });

    it('scales the drawing context, which is what keeps every caller speaking logically', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);

      // Act.
      bitmap.applyDeviceScale(1.5);

      // Assert.
      expect(bitmap.context.setTransform).toHaveBeenCalledWith(1.5, 0, 0, 1.5, 0, 0);
    });
  });

  describe('resize', () =>
  {
    it('leaves an unscaled bitmap to the original, which already sized it correctly', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);
      bitmap.context.setTransform.mockClear();

      // Act.
      bitmap.resize(400, 300);

      // Assert - no transform is reapplied, because there was never one to lose.
      expect(bitmap.canvas.width).toBe(400);
      expect(bitmap.width).toBe(400);
      expect(bitmap.context.setTransform).not.toHaveBeenCalled();
    });

    it('rebuilds a scaled bitmap, because resizing a canvas wipes its context transform', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);
      bitmap.applyDeviceScale(1.5);
      bitmap.context.setTransform.mockClear();

      // Act.
      bitmap.resize(400, 300);

      // Assert - the new logical size, still holding 1.5x the pixels, transform restored.
      expect(bitmap.canvas.width).toBe(600);
      expect(bitmap.canvas.height).toBe(450);
      expect(bitmap.width).toBe(400);
      expect(bitmap.context.setTransform).toHaveBeenCalledWith(1.5, 0, 0, 1.5, 0, 0);
    });

    it('clamps a missing dimension to one, matching what the original just did to the canvas', () =>
    {
      // Arrange - vanilla floors both dimensions at one, and a rebuild that did not would leave the
      // canvas and the texture describing different sizes.
      const bitmap = buildBitmap(200, 100);
      bitmap.applyDeviceScale(2);

      // Act.
      bitmap.resize(0, undefined);

      // Assert - one logical pixel, still holding two real ones.
      expect(bitmap.width).toBe(1);
      expect(bitmap.height).toBe(1);
      expect(bitmap.canvas.width).toBe(2);
    });
  });

  describe('getPixel', () =>
  {
    it('addresses an unscaled bitmap at the coordinate it was given', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);

      // Act.
      bitmap.getPixel(30, 40);

      // Assert.
      expect(originalGetPixel).toHaveBeenCalledWith(30, 40);
    });

    it('converts a logical coordinate into a real one on a scaled bitmap', () =>
    {
      // Arrange - `getImageData` reads the canvas directly and ignores the context transform.
      const bitmap = buildBitmap(200, 100);
      bitmap.applyDeviceScale(1.5);

      // Act.
      bitmap.getPixel(30, 40);

      // Assert.
      expect(originalGetPixel).toHaveBeenCalledWith(45, 60);
    });
  });

  describe('getAlphaPixel', () =>
  {
    it('converts a logical coordinate into a real one on a scaled bitmap', () =>
    {
      // Arrange.
      const bitmap = buildBitmap(200, 100);
      bitmap.applyDeviceScale(1.5);

      // Act.
      bitmap.getAlphaPixel(30, 40);

      // Assert.
      expect(originalGetAlphaPixel).toHaveBeenCalledWith(45, 60);
    });
  });
});
//endregion plugins/_base/core/core/bitmap-device-scale.test.js