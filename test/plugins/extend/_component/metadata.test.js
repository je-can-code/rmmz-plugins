//region plugins/extend/_component/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installExtendHostGlobals, setPluginContextToJBase, setPluginContextToJExtend } from './fixtures/install-extend-host-globals.js';

describe('J-Extend metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installExtendHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJExtend();
    await import('../../../../src/plugins/extend/core/_metadata/initialization.js');
  });

  it('exposes plugin name on J.EXTEND.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.EXTEND.Metadata.name).toBe('J-Extend');
  });
});
//endregion plugins/extend/_component/metadata.test.js
