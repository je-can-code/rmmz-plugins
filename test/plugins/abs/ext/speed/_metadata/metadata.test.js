//region plugins/abs/ext/speed/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsSpeed } from '../_component/fixtures/install-abs-speed-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

const INIT_PATH = '../../../../../../src/plugins/abs/ext/speed/_metadata/initialization.js';

describe('J-ABS-SpeedBoosts metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    installPluginManagerWithParams(globalThis, 'J-ABS-SpeedBoosts', {});

    setPluginContextToJabsSpeed();
    await import(INIT_PATH);
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.SPEED;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.Scene_Boot).toBeInstanceOf(Map);
    expect(Aliased.Game_Actor).toBeInstanceOf(Map);
    expect(Aliased.Game_Character).toBeInstanceOf(Map);
    expect(Aliased.Game_Battler).toBeInstanceOf(Map);
    expect(Aliased.Game_Enemy).toBeInstanceOf(Map);
    expect(Aliased.TextManager).toBeInstanceOf(Map);
    expect(Aliased.IconManager).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.SPEED;

    // Assert
    expect(Aliased.Scene_Boot.size).toBe(0);
    expect(Aliased.Game_Actor.size).toBe(0);
    expect(Aliased.Game_Character.size).toBe(0);
    expect(Aliased.Game_Battler.size).toBe(0);
    expect(Aliased.Game_Enemy.size).toBe(0);
    expect(Aliased.TextManager.size).toBe(0);
    expect(Aliased.IconManager.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.SPEED.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsSpeed();

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
      setPluginContextToJabsSpeed();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/speed/_metadata/metadata.test.js
