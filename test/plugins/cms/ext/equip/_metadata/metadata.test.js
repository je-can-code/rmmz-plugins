//region plugins/cms/ext/equip/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installCmsHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJCmsEquip,
} from '../../../_component/fixtures/install-cms-host-globals.js';

const EQUIP_INIT_PATH = '../../../../../../src/plugins/cms/ext/equip/_metadata/initialization.js';

describe('J-CMS-Equip metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installCmsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJCmsEquip();
    await import(EQUIP_INIT_PATH);
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.CMS_E;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.Scene_Equip).toBeInstanceOf(Map);
    expect(Aliased.Window_EquipItem).toBeInstanceOf(Map);
    expect(Aliased.Window_EquipSlot).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.CMS_E;

    // Assert
    expect(Aliased.Scene_Equip.size).toBe(0);
    expect(Aliased.Window_EquipItem.size).toBe(0);
    expect(Aliased.Window_EquipSlot.size).toBe(0);
  });

  it('claims a namespace of its own rather than sharing the menu core namespace', () =>
  {
    // Arrange & Act & Assert- the equip extension and the menu core are separately installable, so
    // each owns its own umbrella.
    expect(globalThis.J.CMS_E).toBeDefined();
    expect(globalThis.J.CMS_E.Metadata.parsedPluginParameters).toBeDefined();
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
      await expect(import(EQUIP_INIT_PATH)).rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });
  });
});
//endregion plugins/cms/ext/equip/_metadata/metadata.test.js
