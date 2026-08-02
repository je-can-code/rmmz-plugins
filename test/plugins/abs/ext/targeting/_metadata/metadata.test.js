//region plugins/abs/ext/targeting/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsTargeting } from '../_component/fixtures/install-abs-targeting-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

const INIT_PATH = '../../../../../../src/plugins/abs/ext/targeting/_metadata/initialization.js';

describe('J-ABS-Targeting metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-Targeting', {
      'reticleImage': 'CustomArrow',
      'targetingListWindowX': '400',
      'targetingListWindowY': '120',
    });

    setPluginContextToJabsTargeting();
    await import(INIT_PATH);
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.TARGETING;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.JABS_InputAdapter).toBeInstanceOf(Map);
    expect(Aliased.Scene_Map).toBeInstanceOf(Map);
    expect(Aliased.JABS_AiManager).toBeInstanceOf(Map);
    expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
    expect(Aliased.Game_Player).toBeInstanceOf(Map);
    expect(Aliased.JABS_Battler).toBeInstanceOf(Map);
    expect(Aliased.Spriteset_Map).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.TARGETING;

    // Assert
    expect(Aliased.JABS_InputAdapter.size).toBe(0);
    expect(Aliased.Scene_Map.size).toBe(0);
    expect(Aliased.JABS_AiManager.size).toBe(0);
    expect(Aliased.JABS_Engine.size).toBe(0);
    expect(Aliased.Game_Player.size).toBe(0);
    expect(Aliased.JABS_Battler.size).toBe(0);
    expect(Aliased.Spriteset_Map.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.TARGETING.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('plugin parameter translation', () =>
  {
    it('carries the configured reticle image name across', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.TARGETING;

      // Assert
      expect(Metadata.reticleImage).toBe("CustomArrow");
    });

    it('parses the targeting window coordinates into numbers', () =>
    {
      // Arrange & Act
      const { Metadata } = globalThis.J.ABS.EXT.TARGETING;

      // Assert
      expect(Metadata.targetingListWindowX).toBe(400);
      expect(Metadata.targetingListWindowY).toBe(120);
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
      setPluginContextToJabsTargeting();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-ABS does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the J-ABS check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.ABS.Metadata.version.version;
      globalThis.J.ABS.Metadata.version.version = () => '0.0.1';
      setPluginContextToJabsTargeting();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/targeting/_metadata/metadata.test.js
