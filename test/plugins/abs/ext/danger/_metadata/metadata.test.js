//region plugins/abs/ext/danger/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsDanger } from '../_component/fixtures/install-abs-danger-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

const INIT_PATH = '../../../../../../src/plugins/abs/ext/danger/_metadata/initialization.js';

describe('J-ABS-DangerIndicator metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-DangerIndicator', {});

    setPluginContextToJabsDanger();
    await import(INIT_PATH);
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.DANGER;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.Game_Character).toBeInstanceOf(Map);
    expect(Aliased.Game_Event).toBeInstanceOf(Map);
    expect(Aliased.JABS_Battler).toBeInstanceOf(Map);
    expect(Aliased.JABS_BattlerCoreData).toBeInstanceOf(Map);
    expect(Aliased.Sprite_Character).toBeInstanceOf(Map);
    expect(Aliased.Spriteset_Map).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.DANGER;

    // Assert
    expect(Aliased.Game_Character.size).toBe(0);
    expect(Aliased.Game_Event.size).toBe(0);
    expect(Aliased.JABS_Battler.size).toBe(0);
    expect(Aliased.JABS_BattlerCoreData.size).toBe(0);
    expect(Aliased.Sprite_Character.size).toBe(0);
    expect(Aliased.Spriteset_Map.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.DANGER.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('danger indicator icon translation', () =>
  {
    it('returns an empty map when no icons are configured at all', () =>
    {
      // Arrange & Act & Assert- an unconfigured parameter arrives as an empty string, and the
      // caller expects an object it can key into rather than a crash.
      expect(globalThis.J.ABS.EXT.DANGER.Helpers.PluginManager.TranslateDangerIndicatorIcons(''))
        .toEqual({});
    });

    it('parses the configured json into a name-to-icon map', () =>
    {
      // Arrange
      const configured = JSON.stringify({ worthless: '10', simple: '11' });

      // Act
      const translated =
        globalThis.J.ABS.EXT.DANGER.Helpers.PluginManager.TranslateDangerIndicatorIcons(configured);

      // Assert
      expect(translated).toEqual({ worthless: 10, simple: 11 });
    });

    it('converts every icon index from its stringy form to a real number', () =>
    {
      // Arrange- the editor writes icon indices as strings, and the sprite code indexes an icon
      // sheet with them, so a leftover string would silently render the wrong tile.
      const configured = JSON.stringify({ deadly: '14' });

      // Act
      const translated =
        globalThis.J.ABS.EXT.DANGER.Helpers.PluginManager.TranslateDangerIndicatorIcons(configured);

      // Assert
      expect(translated.deadly).toBe(14);
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
      setPluginContextToJabsDanger();

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
      setPluginContextToJabsDanger();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/danger/_metadata/metadata.test.js
