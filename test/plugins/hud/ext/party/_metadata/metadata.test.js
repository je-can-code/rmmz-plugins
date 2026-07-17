//region plugins/hud/ext/party/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installHudHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJHud,
  setPluginContextToJHudParty,
} from '../../../_component/fixtures/install-hud-host-globals.js';

describe('J-HUD-PartyFrame metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installHudHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJHud();
    await import('../../../../../../src/plugins/hud/core/_metadata/initialization.js');

    setPluginContextToJHudParty();
    await import('../../../../../../src/plugins/hud/ext/party/_metadata/initialization.js');
  });

  it('exposes plugin name on J.HUD.EXT.PARTY.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.HUD.EXT.PARTY.Metadata.name).toBe('J-HUD-PartyFrame');
  });

  it('exposes plugin version on J.HUD.EXT.PARTY.Metadata', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.HUD.EXT.PARTY.Metadata.version).toMatchObject({ major: 1, minor: 2, patch: 0 });
  });

  it('initializes an empty aliased map for Scene_Map', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.HUD.EXT.PARTY.Aliased.Scene_Map).toBeInstanceOf(Map);
    expect(globalThis.J.HUD.EXT.PARTY.Aliased.Scene_Map.size).toBe(0);
  });

  it('throws when J-Base does not satisfy the minimum required version', async () =>
  {
    // Arrange: downgrade the already-installed J-Base metadata below PARTY's required floor.
    vi.resetModules();
    const originalVersion = globalThis.J.BASE.Metadata.Version;
    globalThis.J.BASE.Metadata.Version = '0.0.1';
    setPluginContextToJHudParty();

    // Act & Assert
    await expect(import('../../../../../../src/plugins/hud/ext/party/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-Base/);

    // reset back to a satisfying version so later tests in the suite are unaffected.
    globalThis.J.BASE.Metadata.Version = originalVersion;
  });
});
//endregion plugins/hud/ext/party/_metadata/metadata.test.js
