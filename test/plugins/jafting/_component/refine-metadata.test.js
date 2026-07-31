//region plugins/jafting/_component/refine-metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../../_base/_component/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';

export const DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS = {
  'menu-switch': '333',
  'menu-name': 'Vitest Refine',
  'menu-icon': '77',
};

describe('J-JAFTING + J-JAFTING-Refinement metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();
    globalThis.PluginMetadata = PluginMetadata;
    globalThis.PluginManager = {
      parameters: name => (name === 'J-JAFTING-Refinement' ? DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS : {}),
      registerCommand()
      {
      },
    };

    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.2.0';
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    globalThis.__PLUGIN_NAME__ = 'J-JAFTING';
    globalThis.__PLUGIN_VERSION__ = '2.1.0';
    await import('../../../../src/plugins/jafting/core/_metadata/initialization.js');

    globalThis.__PLUGIN_NAME__ = 'J-JAFTING-Refinement';
    globalThis.__PLUGIN_VERSION__ = '2.1.0';
    await import('../../../../src/plugins/jafting/ext/refine/_metadata/initialization.js');
  });

  it('parses the menu switch id from plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.JAFTING.EXT.REFINE.Metadata.menuSwitchId)
      .toBe(Number(DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS['menu-switch']));
  });

  it('reads the command name from plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.JAFTING.EXT.REFINE.Metadata.commandName).toBe(DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS['menu-name']);
  });

  it('parses the command icon index from plugin parameters', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.JAFTING.EXT.REFINE.Metadata.commandIconIndex)
      .toBe(Number(DEFAULT_JAFTING_REFINE_PLUGIN_PARAMS['menu-icon']));
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      globalThis.__PLUGIN_NAME__ = 'J-JAFTING-Refinement';
      globalThis.__PLUGIN_VERSION__ = '2.1.0';

      // Act & Assert
      await expect(import('../../../../src/plugins/jafting/ext/refine/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-JAFTING does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the jafting core check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.JAFTING.Metadata.version.version;
      globalThis.J.JAFTING.Metadata.version.version = () => '0.0.1';
      globalThis.__PLUGIN_NAME__ = 'J-JAFTING-Refinement';
      globalThis.__PLUGIN_VERSION__ = '2.1.0';

      // Act & Assert
      await expect(import('../../../../src/plugins/jafting/ext/refine/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-JAFTING/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.JAFTING.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/jafting/_component/refine-metadata.test.js
