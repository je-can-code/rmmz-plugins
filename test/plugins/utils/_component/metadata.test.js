//region plugins/utils/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installUtilsHostGlobals, setPluginContextToJBase, setPluginContextToJUtils } from './fixtures/install-utils-host-globals.js';

describe('J-SystemUtilities metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installUtilsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJUtils();
    await import('../../../../src/plugins/utils/core/_metadata/initialization.js');

    // patches globalThis.Bitmap.prototype directly, no vm involved.
    await import('../../../../src/plugins/utils/core/Bitmap.js');

    // J-Base accessors the production code now reads through.
    globalThis.Bitmap.prototype.setCanvas = function(v) { this._canvas = v; };
    globalThis.Bitmap.prototype.canvas = function() { return this._canvas; };
    globalThis.Bitmap.prototype.setContext = function(v) { this._context = v; };
  });

  it('parses the autostart-newgame flag out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.UTILS.Metadata.autostartNewgame).toBe(false);
  });

  it('parses the autoload-devtools flag out of the plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.UTILS.Metadata.autoloadDevtools).toBe(false);
  });

  it('exposes Helpers.depth()', () =>
  {
    // Arrange
    const o = { a: { b: { c: 1 } } };

    // Act
    const depth = globalThis.J.UTILS.Helpers.depth(o);

    // Assert
    expect(depth).toBeGreaterThan(0);
  });

  it('overrides Bitmap._createCanvas to use willReadFrequently', () =>
  {
    // Arrange
    const calls = [];
    globalThis.document.createElement = function()
    {
      return {
        getContext(type, options)
        {
          calls.push({ type, options });
          return {};
        },
      };
    };
    const bmp = new globalThis.Bitmap();

    // Act
    bmp._createCanvas(10, 20);

    // Assert
    expect(calls.length).toBe(1);
    expect(calls[0].type).toBe('2d');
    expect(calls[0].options).toEqual({ willReadFrequently: true });
  });

  it('throws when J-Base does not satisfy the minimum required version', async () =>
  {
    // Arrange: drop the already-installed J-Base metadata below this plugin's floor.
    vi.resetModules();
    const originalVersion = globalThis.J.BASE.Metadata.Version;
    globalThis.J.BASE.Metadata.Version = '0.0.1';
    setPluginContextToJUtils();

    // Act & Assert
    await expect(import('../../../../src/plugins/utils/core/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-Base/);

    // restore the satisfying version so later tests in this file are unaffected.
    globalThis.J.BASE.Metadata.Version = originalVersion;
  });

  describe('gamepad logging', () =>
  {
    it('is opt-in, so it starts disabled', () =>
    {
      // Arrange & Act & Assert- this writes to the console on every button press, so it must never
      // be on unless somebody deliberately switched it on from the console.
      expect(globalThis.J.UTILS.GamepadLog.enabled).toBe(false);
    });

    it('enable turns logging on and says so', () =>
    {
      // Arrange
      const logSpy = vi.spyOn(console, 'log')
        .mockImplementation(() => {});

      // Act
      globalThis.J.UTILS.GamepadLog.enable();

      // Assert
      expect(globalThis.J.UTILS.GamepadLog.enabled).toBe(true);
      expect(logSpy).toHaveBeenCalledWith('[InputLog] Enabled.');

      logSpy.mockRestore();
    });

    it('disable turns logging back off and says so', () =>
    {
      // Arrange
      const logSpy = vi.spyOn(console, 'log')
        .mockImplementation(() => {});
      globalThis.J.UTILS.GamepadLog.enable();
      logSpy.mockClear();

      // Act
      globalThis.J.UTILS.GamepadLog.disable();

      // Assert
      expect(globalThis.J.UTILS.GamepadLog.enabled).toBe(false);
      expect(logSpy).toHaveBeenCalledWith('[InputLog] Disabled.');

      logSpy.mockRestore();
    });

    it('logs nothing at all while disabled', () =>
    {
      // Arrange
      const logSpy = vi.spyOn(console, 'log')
        .mockImplementation(() => {});
      globalThis.J.UTILS.GamepadLog.disable();
      logSpy.mockClear();
      globalThis.Input = { gamepadMapper: { 0: 'ok' } };

      // Act- a genuine fresh press, which would log were it enabled.
      globalThis.J.UTILS.GamepadLog.logFreshPresses({ id: 'pad', index: 0 }, [ false ], [ true ]);

      // Assert
      expect(logSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
    });

    it('logs nothing when enabled but no button changed state', () =>
    {
      // Arrange- holding a button is not a fresh press, and reporting it every frame would bury
      // the presses that matter.
      const logSpy = vi.spyOn(console, 'log')
        .mockImplementation(() => {});
      globalThis.J.UTILS.GamepadLog.enable();
      logSpy.mockClear();
      globalThis.Input = { gamepadMapper: { 0: 'ok' } };

      // Act
      globalThis.J.UTILS.GamepadLog.logFreshPresses({ id: 'pad', index: 0 }, [ true ], [ true ]);

      // Assert
      expect(logSpy).not.toHaveBeenCalled();

      globalThis.J.UTILS.GamepadLog.disable();
      logSpy.mockRestore();
    });
  });
});
//endregion plugins/utils/_component/metadata.test.js
