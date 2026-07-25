//region plugins/map/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installMapHostGlobals, setPluginContextToJBase, setPluginContextToJMap } from './fixtures/install-map-host-globals.js';

describe('J-MAP metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installMapHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJMap();
    await import('../../../../src/plugins/map/core/_metadata/initialization.js');
  });

  it('initializes metadata with parsed params', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.MAP.Metadata.name).toBe('J-MAP');
    expect(globalThis.J.MAP.Metadata.startVisible).toBe(true);
    expect(globalThis.J.MAP.Metadata.respectHudHide).toBe(true);
    expect(globalThis.J.MAP.Metadata.overlapOpacity).toBe(0.4);
  });
});
//endregion plugins/map/_component/metadata.test.js
