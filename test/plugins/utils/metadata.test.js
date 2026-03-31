//region plugins/utils/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadUtilsPluginVm } from './utils-vm.js';

describe('J-SystemUtilities metadata (out/J-SystemUtilities.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadUtilsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('initializes J.UTILS metadata with parsed params', () =>
  {
    expect(sandbox.J.UTILS.Metadata.name).toBe('J-SystemUtilities');
    expect(sandbox.J.UTILS.Metadata.version.major).toBe(1);
    expect(sandbox.J.UTILS.Metadata.version.minor).toBe(1);
    expect(sandbox.J.UTILS.Metadata.version.patch).toBe(2);
    expect(sandbox.J.UTILS.Metadata.autostartNewgame).toBe(false);
    expect(sandbox.J.UTILS.Metadata.autoloadDevtools).toBe(false);
  });

  it('exposes Helpers.depth()', () =>
  {
    const o = { a: { b: { c: 1 } } };
    expect(sandbox.J.UTILS.Helpers.depth(o)).toBeGreaterThan(0);
  });

  it('overrides Bitmap._createCanvas to use willReadFrequently', () =>
  {
    const calls = [];
    sandbox.document.createElement = function()
    {
      return {
        getContext(type, options)
        {
          calls.push({ type, options });
          return {};
        },
      };
    };

    const bmp = new sandbox.Bitmap();
    bmp._createCanvas(10, 20);

    expect(calls.length).toBe(1);
    expect(calls[0].type).toBe('2d');
    expect(calls[0].options).toEqual({ willReadFrequently: true });
  });
});
//endregion plugins/utils/metadata.test.js
