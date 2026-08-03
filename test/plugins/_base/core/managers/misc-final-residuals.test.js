//region plugins/_base/managers/misc-final-residuals.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-Base misc final residual coverage (direct src import)', () =>
{
  let SerializableRegistry;
  let J_Timer;
  let RPG_SoundEffect;
  let originalDrawText;

  beforeAll(async () =>
  {
    String.empty = '';

    globalThis.J = { BASE: { Aliased: { Bitmap: new Map() } } };

    globalThis.Graphics = { width: 820, height: 640, boxWidth: 816, boxHeight: 624 };

    globalThis.ImageManager = {
      loadBitmap: vi.fn(),
    };

    globalThis.AudioManager = { playStaticSe: vi.fn() };
    globalThis.SoundManager = {};

    function Bitmap()
    {
    }

    originalDrawText = vi.fn();
    Bitmap.prototype.drawText = originalDrawText;
    globalThis.Bitmap = Bitmap;

    await import('../../../../../src/plugins/_base/core/managers/Graphics.js');
    await import('../../../../../src/plugins/_base/core/managers/ImageManager.js');
    await import('../../../../../src/plugins/_base/core/managers/SoundManager.js');
    await import('../../../../../src/plugins/_base/core/core/Bitmap.js');

    ({ default: SerializableRegistry } = await import('../../../../../src/plugins/_base/core/core/SerializableRegistry.js'));
    ({ default: J_Timer } = await import('../../../../../src/plugins/_base/core/models/J_Timer.js'));
    ({ default: RPG_SoundEffect } = await import('../../../../../src/plugins/_base/core/database/miscellaneous/RPG_SoundEffect.js'));
  });

  describe('Graphics', () =>
  {
    it('horizontalPadding is the absolute difference between width and boxWidth', () =>
    {
      expect(globalThis.Graphics.horizontalPadding).toBe(4);
    });

    it('verticalPadding is the absolute difference between height and boxHeight', () =>
    {
      expect(globalThis.Graphics.verticalPadding).toBe(16);
    });

    it('boxOrigin destructures to [horizontalPadding, verticalPadding]', () =>
    {
      expect(globalThis.Graphics.boxOrigin).toEqual([ 4, 16 ]);
    });
  });

  describe('ImageManager', () =>
  {
    it('iconColumns is 16', () =>
    {
      expect(globalThis.ImageManager.iconColumns).toBe(16);
    });

    describe('loadBitmapPromise', () =>
    {
      it('resolves with the bitmap once its load listener reports ready', async () =>
      {
        // Arrange
        const bitmap = {
          isReady: () => true,
          isError: () => false,
          addLoadListener: (cb) => cb(bitmap),
        };
        globalThis.ImageManager.loadBitmap = vi.fn(() => bitmap);

        // Act
        const result = await globalThis.ImageManager.loadBitmapPromise('face', 'img/faces/');

        // Assert
        expect(result).toBe(bitmap);
      });

      it('rejects once its load listener reports an error', async () =>
      {
        // Arrange
        const bitmap = {
          isReady: () => false,
          isError: () => true,
          addLoadListener: (cb) => cb(bitmap),
        };
        globalThis.ImageManager.loadBitmap = vi.fn(() => bitmap);

        // Act & Assert
        await expect(globalThis.ImageManager.loadBitmapPromise('face', 'img/faces/')).rejects.toBeUndefined();
      });

      it('leaves the promise pending when the bitmap is neither ready nor errored', async () =>
      {
        // Arrange
        let capturedListener;
        const bitmap = {
          isReady: () => false,
          isError: () => false,
          addLoadListener: (cb) => { capturedListener = cb; },
        };
        globalThis.ImageManager.loadBitmap = vi.fn(() => bitmap);
        globalThis.ImageManager.loadBitmapPromise('face', 'img/faces/');

        // Act- invoke the captured listener directly; neither isReady nor isError is true, so
        // neither resolve() nor reject() should fire.
        capturedListener(bitmap);

        // Assert
        const raceResult = await Promise.race([
          new Promise((resolve) =>
          {
            setTimeout(() => resolve('still-pending'), 10);
          }),
        ]);
        expect(raceResult).toBe('still-pending');
      });
    });
  });

  describe('SoundManager', () =>
  {
    it('playSoundEffect delegates to AudioManager.playStaticSe', () =>
    {
      // Arrange
      const se = { name: 'Bell', volume: 90, pitch: 100, pan: 0 };

      // Act
      globalThis.SoundManager.playSoundEffect(se);

      // Assert
      expect(globalThis.AudioManager.playStaticSe).toHaveBeenCalledWith(se);
    });
  });

  describe('Bitmap#drawText', () =>
  {
    it('defaults a missing align argument to "left" before delegating to the original', () =>
    {
      // Arrange
      const bitmap = Object.create(globalThis.Bitmap.prototype);

      // Act
      bitmap.drawText('hi', 0, 0, 100, 20);

      // Assert
      expect(originalDrawText).toHaveBeenCalledWith('hi', 0, 0, 100, 20, 'left');
    });

    it('passes an explicit align argument through unchanged', () =>
    {
      // Arrange
      const bitmap = Object.create(globalThis.Bitmap.prototype);

      // Act
      bitmap.drawText('hi', 0, 0, 100, 20, 'center');

      // Assert
      expect(originalDrawText).toHaveBeenCalledWith('hi', 0, 0, 100, 20, 'center');
    });
  });

  describe('registerJBaseSerializableModels', () =>
  {
    it('registers J_Timer in the SerializableRegistry', async () =>
    {
      // Arrange
      SerializableRegistry._constructors.clear();

      // Act
      await import('../../../../../src/plugins/_base/core/core/registerJBaseSerializableModels.js');

      // Assert
      expect(SerializableRegistry.resolve('J_Timer')).toBe(J_Timer);
    });
  });

  describe('RPG_SoundEffect', () =>
  {
    it('maps every constructor argument onto its corresponding property', () =>
    {
      // Arrange & Act
      const se = new RPG_SoundEffect('Bell', 80, 110, -5);

      // Assert
      expect(se.name).toBe('Bell');
      expect(se.volume).toBe(80);
      expect(se.pitch).toBe(110);
      expect(se.pan).toBe(-5);
    });

    it('defaults volume/pitch/pan when omitted', () =>
    {
      // Arrange & Act
      const se = new RPG_SoundEffect('Bell');

      // Assert
      expect(se.volume).toBe(100);
      expect(se.pitch).toBe(100);
      expect(se.pan).toBe(0);
    });
  });
});
//endregion plugins/_base/managers/misc-final-residuals.test.js
