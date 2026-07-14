//region plugins/drops/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installDropsHostGlobals, setPluginContextToJBase, setPluginContextToJDrops } from './fixtures/install-drops-host-globals.js';

describe('J-DropsControl metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installDropsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJDrops();
    await import('../../../../src/plugins/drops/core/_metadata/initialization.js');
  });

  it('exposes plugin name on J.DROPS.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.DROPS.Metadata.name).toBe('J-DropsControl');
  });
});
//endregion plugins/drops/_component/metadata.test.js
