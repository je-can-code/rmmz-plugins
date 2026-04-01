//region plugins/pixel/ext/abs/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS } from '../../fixtures/pixel-plugin-params.js';
import { loadPixelAbsStackPluginVm } from '../../pixel-vm.js';

describe('J-ABS-Pixelistics metadata', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPixelAbsStackPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('exposes IdleWanderRadius from extension params', () =>
  {
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.IdleWanderRadius).toBe(1.50);
  });
});

describe('J-ABS-Pixelistics metadata with custom extension params', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPixelAbsStackPluginVm(sandbox, {
      extParams: {
        ...DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS,
        idleWanderRadius: '2.75',
      },
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('parses IdleWanderRadius from strings', () =>
  {
    expect(sandbox.J.PIXEL.EXT.ABS.Metadata.IdleWanderRadius).toBe(2.75);
  });
});
//endregion plugins/pixel/ext/abs/metadata.test.js

