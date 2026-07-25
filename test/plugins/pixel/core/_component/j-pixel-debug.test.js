//region plugins/pixel/core/_component/j-pixel-debug.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  installPixelCoreHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJPixel,
} from '../../_component/fixtures/install-pixel-host-globals.js';

describe('PixelDebugSampler sampling helpers (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installPixelCoreHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJPixel();
    await import('../../../../../src/plugins/pixel/core/_metadata/initialization.js');

    ({ default: globalThis.PixelDebugSampler } = await import('../../../../../src/plugins/pixel/core/_models/PixelDebugSampler.js'));
  });

  beforeEach(() =>
  {
    globalThis.PixelDebugSampler.clear();
  });

  it('does not enqueue samples while disabled', () =>
  {
    // Arrange
    globalThis.PixelDebugSampler.enabled = false;

    // Act
    globalThis.PixelDebugSampler.push(1, 2, 'rgba(0,0,0,0.5)');

    // Assert
    expect(globalThis.PixelDebugSampler.samples.length).toBe(0);
  });

  it('enqueues samples while enabled', () =>
  {
    // Arrange
    globalThis.PixelDebugSampler.enabled = true;

    // Act
    globalThis.PixelDebugSampler.push(0.5, 0.25, 'rgba(1,2,3,0.4)');

    // Assert
    expect(globalThis.PixelDebugSampler.samples.length).toBe(1);
    expect(globalThis.PixelDebugSampler.samples[0].x).toBe(0.5);
    expect(globalThis.PixelDebugSampler.samples[0].y).toBe(0.25);
  });

  it('clear removes queued samples', () =>
  {
    // Arrange
    globalThis.PixelDebugSampler.enabled = true;
    globalThis.PixelDebugSampler.push(0, 0, 'rgba(0,0,0,1)');

    // Act
    globalThis.PixelDebugSampler.clear();

    // Assert
    expect(globalThis.PixelDebugSampler.samples.length).toBe(0);
  });
});
//endregion plugins/pixel/core/_component/j-pixel-debug.test.js
