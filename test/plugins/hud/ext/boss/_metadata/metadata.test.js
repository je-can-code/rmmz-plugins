//region plugins/hud/ext/boss/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installHudHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJHud,
  setPluginContextToJHudBoss,
} from '../../../_component/fixtures/install-hud-host-globals.js';

const BOSS_INIT_PATH = '../../../../../../src/plugins/hud/ext/boss/_metadata/initialization.js';

describe('J-HUD-BossFrame metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installHudHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJHud();
    await import('../../../../../../src/plugins/hud/core/_metadata/initialization.js');

    setPluginContextToJHudBoss();
    await import(BOSS_INIT_PATH);
  });

  it('declares the aliased-method map for the hud manager it patches', () =>
  {
    // Arrange & Act & Assert- a missing map surfaces later as "cannot read set of undefined".
    expect(globalThis.J.HUD.EXT.BOSS.Aliased.Hud_Manager).toBeInstanceOf(Map);
  });

  it('declares the aliased-method map for the map scene it patches', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.HUD.EXT.BOSS.Aliased.Scene_Map).toBeInstanceOf(Map);
  });

  it('reserves a regexp table even though it ships no patterns yet', () =>
  {
    // Arrange & Act & Assert: the table is staked out so later tags have somewhere to land without
    // a second reader having to wonder whether the namespace exists.
    expect(globalThis.J.HUD.EXT.BOSS.RegExp).toEqual({});
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.HUD.EXT.BOSS.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below the boss frame's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJHudBoss();

      // Act & Assert
      await expect(import(BOSS_INIT_PATH)).rejects.toThrow(/missing J-Base/);

      // restore the satisfying version so later tests in this file are unaffected.
      globalThis.J.BASE.Metadata.Version = originalVersion;
    });

    it('throws when J-HUD does not satisfy the minimum required version', async () =>
    {
      // Arrange: J-Base has to keep passing so the hud check is the one that trips.
      vi.resetModules();
      const originalVersion = globalThis.J.HUD.Metadata.version.version;
      globalThis.J.HUD.Metadata.version.version = () => '0.0.1';
      setPluginContextToJHudBoss();

      // Act & Assert
      await expect(import(BOSS_INIT_PATH)).rejects.toThrow(/missing J-HUD/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.HUD.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/hud/ext/boss/_metadata/metadata.test.js
