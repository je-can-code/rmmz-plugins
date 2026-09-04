//region plugins/_base/managers/misc-final-residuals.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-Base misc final residual coverage (direct src import)', () =>
{
  let SerializableRegistry;
  let J_Timer;
  let RPG_SoundEffect;
  let originalDrawText;
  let originalSetupPixi;
  let originalCreatePixiApp;
  let originalUpdateAllElements;

  beforeAll(async () =>
  {
    String.empty = '';

    globalThis.J = { BASE: { Aliased: { Bitmap: new Map(), Graphics: new Map() } } };

    // the display the game believes it is running on, and the renderer it built for that display.
    globalThis.window = { devicePixelRatio: 1.5 };
    globalThis.PIXI = { settings: { FILTER_RESOLUTION: 1 } };

    originalSetupPixi = vi.fn();
    originalCreatePixiApp = vi.fn();
    originalUpdateAllElements = vi.fn();

    globalThis.Graphics = {
      width: 820,
      height: 640,
      boxWidth: 816,
      boxHeight: 624,
      app: { renderer: { resolution: 1.5, resize: vi.fn() } },
      _setupPixi: originalSetupPixi,
      _createPixiApp: originalCreatePixiApp,
      _updateAllElements: originalUpdateAllElements,
    };

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

    it('deviceScale reads the renderer resolution live rather than capturing it', () =>
    {
      // Arrange - a display at 150%, which is what the renderer would have been configured to.
      expect(globalThis.Graphics.deviceScale).toBe(1.5);

      // Act - the renderer is reconfigured, as it would be when the game window moves screens.
      globalThis.Graphics.app.renderer.resolution = 2;

      // Assert - anything that captured the old value at import time would still report 1.5 here.
      expect(globalThis.Graphics.deviceScale).toBe(2);

      // restore, so the shared stub is left exactly as the other tests in this file found it.
      globalThis.Graphics.app.renderer.resolution = 1.5;
    });

    describe('desiredDeviceScale', () =>
    {
      it('reports the display ratio when it sits inside the supported range', () =>
      {
        // Arrange - a 4K panel at 150%, which is the case this whole seam exists for.
        globalThis.window.devicePixelRatio = 1.5;

        // Act.
        const result = globalThis.Graphics.desiredDeviceScale();

        // Assert.
        expect(result).toBe(1.5);
      });

      it('lifts a display reporting less than one up to one', () =>
      {
        // Arrange - a zoomed-out browser, where rendering below logical size would only lose detail.
        globalThis.window.devicePixelRatio = 0.75;

        // Act.
        const result = globalThis.Graphics.desiredDeviceScale();

        // Assert.
        expect(result).toBe(1);
      });

      it('caps an extreme display ratio at three', () =>
      {
        // Arrange - a phone-class ratio, where the memory cost outruns anything anyone can see.
        globalThis.window.devicePixelRatio = 4;

        // Act.
        const result = globalThis.Graphics.desiredDeviceScale();

        // Assert.
        expect(result).toBe(3);

        // restore the ratio the rest of this file expects.
        globalThis.window.devicePixelRatio = 1.5;
      });
    });

    describe('applyDeviceResolution', () =>
    {
      it('raises the renderer to the display scale and re-derives the backing store', () =>
      {
        // Arrange - a renderer still at the resolution RMMZ builds it with.
        const { renderer } = globalThis.Graphics.app;
        renderer.resolution = 1;
        renderer.resize.mockClear();

        // Act.
        globalThis.Graphics.applyDeviceResolution();

        // Assert - the resize carries the logical size, and the resolution is what expands it.
        expect(renderer.resolution).toBe(1.5);
        expect(renderer.resize).toHaveBeenCalledWith(820, 640);
      });

      it('does nothing when the renderer failed to build, which vanilla survives', () =>
      {
        // Arrange - what `_createPixiApp` leaves behind when WebGL is unavailable. The resize
        // handler is registered before the app is built, so this really does get reached.
        const { app } = globalThis.Graphics;
        app.renderer.resize.mockClear();
        globalThis.Graphics.app = null;

        // Act.
        globalThis.Graphics.applyDeviceResolution();

        // Assert - a crash here would replace vanilla's error screen with a stack trace.
        expect(app.renderer.resize).not.toHaveBeenCalled();

        // restore the app the rest of this file expects.
        globalThis.Graphics.app = app;
      });
    });

    describe('_setupPixi', () =>
    {
      it('raises the filter resolution alongside the original setup', () =>
      {
        // Arrange - PIXI's own default, which would flatten the scene back down.
        globalThis.PIXI.settings.FILTER_RESOLUTION = 1;
        originalSetupPixi.mockClear();

        // Act.
        globalThis.Graphics._setupPixi();

        // Assert.
        expect(originalSetupPixi).toHaveBeenCalledTimes(1);
        expect(globalThis.PIXI.settings.FILTER_RESOLUTION).toBe(1.5);
      });
    });

    describe('_createPixiApp', () =>
    {
      it('applies the device resolution to the renderer the original just built', () =>
      {
        // Arrange.
        const { renderer } = globalThis.Graphics.app;
        renderer.resolution = 1;
        renderer.resize.mockClear();
        originalCreatePixiApp.mockClear();

        // Act.
        globalThis.Graphics._createPixiApp();

        // Assert.
        expect(originalCreatePixiApp).toHaveBeenCalledTimes(1);
        expect(renderer.resolution).toBe(1.5);
      });
    });

    describe('_updateAllElements', () =>
    {
      it('puts the resolution back after the original resets the canvas to logical pixels', () =>
      {
        // Arrange - exactly what `_updateCanvas` leaves behind on every window resize.
        const { renderer } = globalThis.Graphics.app;
        renderer.resolution = 1;
        renderer.resize.mockClear();
        originalUpdateAllElements.mockClear();

        // Act.
        globalThis.Graphics._updateAllElements();

        // Assert.
        expect(originalUpdateAllElements).toHaveBeenCalledTimes(1);
        expect(renderer.resolution).toBe(1.5);
        expect(renderer.resize).toHaveBeenCalledWith(820, 640);
      });
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

    it('replaces a line height that landed in the align slot', () =>
    {
      // Arrange: `Window_Base.drawText` takes five parameters and `Bitmap.drawText` takes six, with `align` and
      // `lineHeight` sharing the fifth. Vanilla's `Window_EquipSlot.drawItem` and `Window_StatusEquip.drawItem`
      // both write the six-parameter shape on a window, so `rect.height` arrives here as the alignment - once per
      // equipment slot, every refresh.
      const bitmap = Object.create(globalThis.Bitmap.prototype);

      // Act
      bitmap.drawText('Weapon', 0, 0, 100, 20, 36);

      // Assert: those callers meant the default, so the default is what they get.
      expect(originalDrawText).toHaveBeenCalledWith('Weapon', 0, 0, 100, 20, 'left');
    });

    it('replaces a string the canvas would still reject', () =>
    {
      // Arrange: the question is not whether the alignment is a string, but whether the canvas understands it.
      // the text is unique to this case on purpose - `toHaveBeenCalledWith` matches *any* recorded call, and the
      // shared mock is never reset, so reusing another case's arguments would let this one pass on its neighbour's
      // evidence.
      const bitmap = Object.create(globalThis.Bitmap.prototype);

      // Act
      bitmap.drawText('unusable-alignment', 0, 0, 100, 20, 'middle');

      // Assert
      expect(originalDrawText).toHaveBeenCalledWith('unusable-alignment', 0, 0, 100, 20, 'left');
    });

    it('accepts the canvas alignments RMMZ never uses', () =>
    {
      // Arrange: `start` and `end` are valid to a canvas even though no engine window asks for them, so the
      // allowlist has no business rejecting them.
      const bitmap = Object.create(globalThis.Bitmap.prototype);

      // Act
      bitmap.drawText('canvas-only-alignment', 0, 0, 100, 20, 'end');

      // Assert
      expect(originalDrawText).toHaveBeenCalledWith('canvas-only-alignment', 0, 0, 100, 20, 'end');
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
