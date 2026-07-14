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
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJUtils();
    await import('../../../../src/plugins/utils/core/_metadata/initialization.js');

    // patches globalThis.Bitmap.prototype directly, no vm involved.
    await import('../../../../src/plugins/utils/core/Bitmap.js');
  });

  it('initializes J.UTILS metadata with parsed params', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.UTILS.Metadata.name).toBe('J-SystemUtilities');
    expect(globalThis.J.UTILS.Metadata.autostartNewgame).toBe(false);
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
});
//endregion plugins/utils/_component/metadata.test.js
