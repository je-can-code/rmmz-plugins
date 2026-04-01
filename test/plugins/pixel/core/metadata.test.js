//region plugins/pixel/core/metadata.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { DEFAULT_PIXEL_CORE_PLUGIN_PARAMS } from '../fixtures/pixel-plugin-params.js';
import { loadPixelCorePluginVm } from '../pixel-vm.js';

describe('J-Pixelistics (core) metadata', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPixelCorePluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('parses plugin params into J.PIXEL.Metadata', () =>
  {
    expect(sandbox.J.PIXEL.Metadata.CollisionStepCount).toBe(4);
    expect(sandbox.J.PIXEL.Metadata.CollisionRadius).toBe(0.30);
    expect(sandbox.J.PIXEL.Metadata.VectorMovementEnabled).toBe(false);
    expect(sandbox.J.PIXEL.Metadata.OverlayInitiallyVisible).toBe(false);
  });
});

describe('J-Pixelistics metadata with custom scalar and boolean params', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPixelCorePluginVm(sandbox, {
      coreParams: {
        ...DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
        collisionStepCount: '2',
        collisionRadius: '0.15',
        vectorMovementEnabled: 'true',
        overlayInitiallyVisible: 'true',
      },
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('reflects overridden numerics and flags', () =>
  {
    expect(sandbox.J.PIXEL.Metadata.CollisionStepCount).toBe(2);
    expect(sandbox.J.PIXEL.Metadata.CollisionRadius).toBe(0.15);
    expect(sandbox.J.PIXEL.Metadata.VectorMovementEnabled).toBe(true);
    expect(sandbox.J.PIXEL.Metadata.OverlayInitiallyVisible).toBe(true);
  });
});

describe('J-Pixelistics metadata collision step fallback', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadPixelCorePluginVm(sandbox, {
      coreParams: {
        ...DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
        collisionStepCount: 'not-a-number',
      },
    });
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('defaults CollisionStepCount when parseInt yields NaN', () =>
  {
    expect(sandbox.J.PIXEL.Metadata.CollisionStepCount).toBe(4);
  });
});
//endregion plugins/pixel/core/metadata.test.js

