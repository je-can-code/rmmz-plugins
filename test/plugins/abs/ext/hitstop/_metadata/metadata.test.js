//region plugins/abs/ext/hitstop/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsHitstop } from '../_component/fixtures/install-abs-hitstop-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

describe('J-ABS-Hitstop metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Hitstop', {});

    setPluginContextToJabsHitstop();
    await import('../../../../../../src/plugins/abs/ext/hitstop/_metadata/initialization.js');
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.HITSTOP;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.DataManager).toBeInstanceOf(Map);
    expect(Aliased.Game_Character).toBeInstanceOf(Map);
    expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
    expect(Aliased.JABS_Action).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.HITSTOP;

    // Assert
    expect(Aliased.DataManager.size).toBe(0);
    expect(Aliased.Game_Character.size).toBe(0);
    expect(Aliased.JABS_Engine.size).toBe(0);
    expect(Aliased.JABS_Action.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.HITSTOP.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsHitstop();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/hitstop/_metadata/initialization.js'))
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
      setPluginContextToJabsHitstop();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/abs/ext/hitstop/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/hitstop/_metadata/metadata.test.js
