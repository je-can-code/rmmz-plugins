//region plugins/pixel/core/j-pixel-debug.test.js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadPixelCorePluginVm } from '../pixel-vm.js';

describe('J.PIXEL.Debug sampling helpers', () =>
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
    sandbox.J.PIXEL.Debug.enabled = false;
    sandbox.J.PIXEL.Debug.samples.length = 0;
    sandbox.J.PIXEL.Debug.push(1, 2, 'rgba(0,0,0,0.5)');

    expect(sandbox.J.PIXEL.Debug.samples.length).toBe(0);
  });

  it('enqueues samples while enabled', () =>
  {
    sandbox.J.PIXEL.Debug.enabled = true;
    sandbox.J.PIXEL.Debug.clear();
    sandbox.J.PIXEL.Debug.push(0.5, 0.25, 'rgba(1,2,3,0.4)');

    expect(sandbox.J.PIXEL.Debug.samples.length).toBe(1);
    expect(sandbox.J.PIXEL.Debug.samples[0].x).toBe(0.5);
    expect(sandbox.J.PIXEL.Debug.samples[0].y).toBe(0.25);
  });

  it('clear removes queued samples', () =>
  {
    sandbox.J.PIXEL.Debug.enabled = true;
    sandbox.J.PIXEL.Debug.push(0, 0, 'rgba(0,0,0,1)');
    sandbox.J.PIXEL.Debug.clear();

    expect(sandbox.J.PIXEL.Debug.samples.length).toBe(0);
  });
});
//endregion plugins/pixel/core/j-pixel-debug.test.js
