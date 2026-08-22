//region plugins/abs/ext/tools/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsTools } from '../_component/fixtures/install-abs-tools-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Tools metadata (direct src import)', () =>
{
  /**
   * A second metadata instance built from explicitly-authored parameters, so that every flag has
   * a case on each side of its comparison. PluginMetadata registers each instance by name and
   * throws on a repeat, so this one carries its own name rather than reusing 'J-ABS-Tools'.
   * @type {import('../../../../../../src/plugins/abs/ext/tools/_metadata/_pluginMetadata.js').default}
   */
  let explicitMetadata;

  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Tools', {});

    setPluginContextToJabsTools();
    await import('../../../../../../src/plugins/abs/ext/tools/_metadata/initialization.js');

    // the shipped instance above was built with no parameters at all, which only ever exercises
    // each flag's default side. this one authors both parameters to the opposite of that default.
    const explicitName = 'J-ABS-Tools-ExplicitParameters';
    installPluginManagerWithParams(globalThis, explicitName, {
      grabThrowEnabled: 'false',
      directionFixAlways: 'true',
    });

    const { default: J_ToolsPluginMetadata } =
      await import('../../../../../../src/plugins/abs/ext/tools/_metadata/_pluginMetadata.js');
    explicitMetadata = new J_ToolsPluginMetadata(explicitName, '1.0.3');
  });

  describe('plugin parameter mapping', () =>
  {
    it('leaves grab-and-throw enabled when the parameter is never authored', () =>
    {
      // Arrange & Act & Assert- RMMZ omits a parameter entirely rather than sending a default,
      // so the absent case is the one that ships for anyone who never opened the plugin config.
      expect(globalThis.J.ABS.EXT.TOOLS.Metadata.GrabThrowEnabled).toBe(true);
    });

    it('disables grab-and-throw when the parameter is authored off', () =>
    {
      // Arrange & Act & Assert
      expect(explicitMetadata.GrabThrowEnabled).toBe(false);
    });

    it('leaves the throw direction unfixed when the parameter is never authored', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.ABS.EXT.TOOLS.Metadata.DirectionFixAlways).toBe(false);
    });

    it('fixes the throw direction when the parameter is authored on', () =>
    {
      // Arrange & Act & Assert
      expect(explicitMetadata.DirectionFixAlways).toBe(true);
    });
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.TOOLS;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.Game_Character).toBeInstanceOf(Map);
    expect(Aliased.Game_CharacterBase).toBeInstanceOf(Map);
    expect(Aliased.Game_Event).toBeInstanceOf(Map);
    expect(Aliased.Game_Follower).toBeInstanceOf(Map);
    expect(Aliased.Game_Player).toBeInstanceOf(Map);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.TOOLS.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsTools();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/tools/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-ABS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the J-ABS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.ABS.Metadata.version.version;
      globalThis.J.ABS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJabsTools();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/tools/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/tools/_metadata/metadata.test.js
