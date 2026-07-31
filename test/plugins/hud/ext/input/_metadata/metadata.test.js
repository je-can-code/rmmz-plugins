//region plugins/hud/ext/input/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installHudHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJHud,
  setPluginContextToJHudInput,
} from '../../../_component/fixtures/install-hud-host-globals.js';

describe('J-HUD-InputFrame metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installHudHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJHud();
    await import('../../../../../../src/plugins/hud/core/_metadata/initialization.js');

    setPluginContextToJHudInput();
    await import('../../../../../../src/plugins/hud/ext/input/_metadata/initialization.js');
  });

  it('falls back to the default cooldown overlay icon index when unconfigured', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.HUD.EXT.INPUT.Metadata.CooldownOverlayIconIndex).toBe(90);
  });

  it('initializes an empty aliased map for Scene_Map', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.HUD.EXT.INPUT.Aliased.Scene_Map).toBeInstanceOf(Map);
    expect(globalThis.J.HUD.EXT.INPUT.Aliased.Scene_Map.size).toBe(0);
  });

  it('throws when J-Base does not satisfy the minimum required version', async () =>
  {
    // Arrange: downgrade the already-installed J-Base metadata below INPUT's required floor.
    vi.resetModules();
    const originalVersion = globalThis.J.BASE.Metadata.Version;
    globalThis.J.BASE.Metadata.Version = '0.0.1';
    setPluginContextToJHudInput();

    // Act & Assert
    await expect(import('../../../../../../src/plugins/hud/ext/input/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-Base/);

    // reset back to a satisfying version so later tests in the suite are unaffected.
    globalThis.J.BASE.Metadata.Version = originalVersion;
  });

  it('throws when J-HUD does not satisfy the minimum required version', async () =>
  {
    // Arrange: J-Base has to keep passing so the hud check is the one that trips.
    vi.resetModules();
    const originalVersion = globalThis.J.HUD.Metadata.version.version;
    globalThis.J.HUD.Metadata.version.version = () => '0.0.1';
    setPluginContextToJHudInput();

    // Act & Assert
    await expect(import('../../../../../../src/plugins/hud/ext/input/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-HUD/);

    // restore the real accessor rather than relying on restoreAllMocks.
    globalThis.J.HUD.Metadata.version.version = originalVersion;
  });
});
//endregion plugins/hud/ext/input/_metadata/metadata.test.js
