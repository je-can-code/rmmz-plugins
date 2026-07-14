//region plugins/escribe/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../_base/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../src/plugins/_base/models/PluginMetadata.js';

describe('J-Escriptions metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;
    globalThis.PluginManager = { parameters: () => ({}) };

    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.0.0';
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    globalThis.__PLUGIN_NAME__ = 'J-Escriptions';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../src/plugins/escribe/core/_metadata/initialization.js');
  });

  it('sets the metadata name to J-Escriptions', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ESCRIBE.Metadata.name).toBe('J-Escriptions');
  });

  it('builds a working Text regex from the initialized RegExp table', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ESCRIBE.RegExp.Text.test('<text:Hello>')).toBe(true);
  });
});
//endregion plugins/escribe/metadata.test.js
