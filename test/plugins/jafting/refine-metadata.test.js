//region plugins/jafting/refine-metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../_base/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../src/plugins/_base/models/PluginMetadata.js';

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
    globalThis.__PLUGIN_VERSION__ = '3.0.0';
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    globalThis.__PLUGIN_NAME__ = 'J-JAFTING';
    globalThis.__PLUGIN_VERSION__ = '2.1.0';
    await import('../../../src/plugins/jafting/core/_metadata/initialization.js');

    globalThis.__PLUGIN_NAME__ = 'J-JAFTING-Refinement';
    globalThis.__PLUGIN_VERSION__ = '2.1.0';
    await import('../../../src/plugins/jafting/ext/refine/_metadata/initialization.js');
  });

  it('sets the metadata name to J-JAFTING-Refinement', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.JAFTING.EXT.REFINE.Metadata.name).toBe('J-JAFTING-Refinement');
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
});
//endregion plugins/jafting/refine-metadata.test.js
