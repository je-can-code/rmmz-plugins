//region plugins/utils/_component/bitmap.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The canvas swap that stops Chromium from warning about read-back.
 *
 * RMMZ reads pixels back off its bitmaps constantly - `getPixel` alone is how `ColorManager` resolves
 * the whole window palette - and a GPU-backed canvas makes every one of those reads a stall. Asking
 * for `willReadFrequently` up front tells the browser to keep the surface in software instead.
 *
 * The reason this overwrite exists rather than an alias is that the engine's own `_createCanvas`
 * builds the element without the attribute, and there is no hook between the two.
 */
describe('J-SystemUtilities Bitmap', () =>
{
  /**
   * Every argument list handed to `getContext`, so a test can assert what was asked for.
   * @type {object[]}
   */
  let contextRequests;

  beforeAll(async () =>
  {
    vi.resetModules();

    function StubBitmap()
    {
    }

    // the engine builds a PIXI texture off the finished canvas; nothing here inspects one.
    StubBitmap.prototype._createBaseTexture = () => {};

    globalThis.Bitmap = StubBitmap;

    await import('../../../../src/plugins/utils/core/Bitmap.js');
  });

  beforeEach(() =>
  {
    contextRequests = [];

    globalThis.document = {
      createElement: () => ({
        width: 0,
        height: 0,
        getContext: (type, attributes) =>
        {
          contextRequests.push({
            type,
            attributes,
          });

          return { type };
        },
      }),
    };
  });

  describe('setCanvas()', () =>
  {
    it('holds the canvas element the bitmap draws onto', () =>
    {
      // Arrange: deliberately a setter with no matching getter - the engine already exposes a
      // `canvas` property, and that one lazily creates the element it returns.
      const bitmap = new globalThis.Bitmap();
      const canvas = {};

      // Act
      bitmap.setCanvas(canvas);

      // Assert
      expect(bitmap._canvas)
        .toBe(canvas);
    });
  });

  describe('setContext()', () =>
  {
    it('holds the drawing context the bitmap renders through', () =>
    {
      // Arrange
      const bitmap = new globalThis.Bitmap();
      const context = {};

      // Act
      bitmap.setContext(context);

      // Assert
      expect(bitmap._context)
        .toBe(context);
    });
  });

  describe('_createCanvas()', () =>
  {
    it('asks for a context that expects frequent read-back', () =>
    {
      // Arrange
      const bitmap = new globalThis.Bitmap();

      // Act
      bitmap._createCanvas(100, 50);

      // Assert: this attribute is the entire point of the overwrite.
      expect(contextRequests)
        .toEqual([ {
          type: '2d',
          attributes: { willReadFrequently: true },
        } ]);
    });

    it('sizes the element before it ever becomes a texture', () =>
    {
      // Arrange
      const bitmap = new globalThis.Bitmap();

      // Act
      bitmap._createCanvas(100, 50);

      // Assert
      expect(bitmap._canvas.width)
        .toBe(100);
      expect(bitmap._canvas.height)
        .toBe(50);
    });

    it('holds the element locally rather than reading it back off the bitmap', () =>
    {
      // Arrange: the engine's `canvas` property re-enters `_ensureCanvas`, which would recurse
      // straight back into here. Reading the local is what keeps this from being infinite.
      const bitmap = new globalThis.Bitmap();
      Object.defineProperty(bitmap, 'canvas', {
        get()
        {
          throw new Error('the engine accessor must not be read during creation');
        },
      });

      // Act
      const create = () => bitmap._createCanvas(100, 50);

      // Assert
      expect(create)
        .not.toThrow();
    });
  });
});
//endregion plugins/utils/_component/bitmap.test.js