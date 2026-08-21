//region plugins/cms/ext/equip/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installCmsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJCms,
  setPluginContextToJCmsEquip,
} from '../../../_component/fixtures/install-cms-host-globals.js';

describe('J-CMS-Equip metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCmsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    // the equip menu is an extension of the main menu and gates on it, so the core has to stand
    // before this one can load at all.
    setPluginContextToJCms();
    await import('../../../../../../src/plugins/cms/core/_metadata/initialization.js');

    setPluginContextToJCmsEquip();
    await import('../../../../../../src/plugins/cms/ext/equip/_metadata/initialization.js');
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.CMS.EXT.EQUIP;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.Scene_Equip).toBeInstanceOf(Map);
    expect(Aliased.Window_EquipItem).toBeInstanceOf(Map);
    expect(Aliased.Window_EquipSlot).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.CMS.EXT.EQUIP;

    // Assert
    expect(Aliased.Scene_Equip.size).toBe(0);
    expect(Aliased.Window_EquipItem.size).toBe(0);
    expect(Aliased.Window_EquipSlot.size).toBe(0);
  });

  it('claims its slot beneath the menu core rather than a namespace of its own', () =>
  {
    // Arrange & Act & Assert- the equip menu is an extension of the main menu, and the namespace
    // is what says so; it also reaches core's ParameterCatalogRenderer at draw time.
    expect(globalThis.J.CMS.EXT.EQUIP.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below the equip scene's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJCmsEquip();

      // Act & Assert
      await expect(import('../../../../../../src/plugins/cms/ext/equip/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-CMS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the menu core check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.CMS.Metadata.version.version;
      globalThis.J.CMS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJCmsEquip();

      // Act & Assert- without the menu core this extension has no ParameterCatalogRenderer to draw
      // its status page with, so failing loudly at boot beats failing at draw time.
      await expect(import('../../../../../../src/plugins/cms/ext/equip/_metadata/initialization.js'))
        .rejects.toThrow(/missing J-CMS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.CMS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/cms/ext/equip/_metadata/metadata.test.js
