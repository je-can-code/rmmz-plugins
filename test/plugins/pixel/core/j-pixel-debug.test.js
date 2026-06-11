//region plugins/pixel/core/j-pixel-debug.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadPixelCorePluginVm } from '../pixel-vm.js';

describe('PixelDebugSampler sampling helpers', () =>
{
  let sandbox;

  beforeEach(() =>
  {
    sandbox = { console };
    loadPixelCorePluginVm(sandbox);
  });

  afterEach(() =>
  {
    sandbox = null;
  });

  it('does not enqueue samples while disabled', () =>
  {
    sandbox.PixelDebugSampler.enabled = false;
    sandbox.PixelDebugSampler.samples.length = 0;
    sandbox.PixelDebugSampler.push(1, 2, 'rgba(0,0,0,0.5)');

    expect(sandbox.PixelDebugSampler.samples.length).toBe(0);
  });

  it('enqueues samples while enabled', () =>
  {
    sandbox.PixelDebugSampler.enabled = true;
    sandbox.PixelDebugSampler.clear();
    sandbox.PixelDebugSampler.push(0.5, 0.25, 'rgba(1,2,3,0.4)');

    expect(sandbox.PixelDebugSampler.samples.length).toBe(1);
    expect(sandbox.PixelDebugSampler.samples[0].x).toBe(0.5);
    expect(sandbox.PixelDebugSampler.samples[0].y).toBe(0.25);
  });

  it('clear removes queued samples', () =>
  {
    sandbox.PixelDebugSampler.enabled = true;
    sandbox.PixelDebugSampler.push(0, 0, 'rgba(0,0,0,1)');
    sandbox.PixelDebugSampler.clear();

    expect(sandbox.PixelDebugSampler.samples.length).toBe(0);
  });
});
//endregion plugins/pixel/core/j-pixel-debug.test.js
