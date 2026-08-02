//region plugins/abs/ext/loadout/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsLoadout } from '../_component/fixtures/install-abs-loadout-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

const INIT_PATH = '../../../../../../src/plugins/abs/ext/loadout/_metadata/initialization.js';

describe('J-ABS-Loadout metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Loadout', {
      'menu-switch': '19',
      'command-name': 'Kit',
      'command-icon': '88',
    });

    setPluginContextToJabsLoadout();
    await import(INIT_PATH);
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.LOADOUT;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.Scene_Menu).toBeInstanceOf(Map);
    expect(Aliased.Window_MenuCommand).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.LOADOUT;

    // Assert
    expect(Aliased.Scene_Menu.size).toBe(0);
    expect(Aliased.Window_MenuCommand.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.LOADOUT.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('plugin parameter translation', () =>
  {
    it('parses the menu switch id out of the plugin parameters', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.LOADOUT;

      // Assert
      expect(Metadata.menuSwitchId).toBe(19);
    });

    it('carries the configured command name across', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.LOADOUT;

      // Assert
      expect(Metadata.commandName).toBe("Kit");
    });

    it('parses the configured command icon into a number', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.LOADOUT;

      // Assert
      expect(Metadata.commandIconIndex).toBe(88);
    });
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsLoadout();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/loadout/_metadata/metadata.test.js
