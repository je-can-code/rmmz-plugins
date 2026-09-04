//region plugins/hud/ext/dps/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installHudHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJHud,
  setPluginContextToJHudDps,
} from '../../../_component/fixtures/install-hud-host-globals.js';

describe('J-HUD-Dps metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installHudHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJHud();
    await import('../../../../../../src/plugins/hud/core/_metadata/initialization.js');

    setPluginContextToJHudDps();
    await import('../../../../../../src/plugins/hud/ext/dps/_metadata/initialization.js');
  });

  it('publishes itself under the namespace its owner declared', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.HUD.EXT.DPS.Metadata.name).toBe('J-HUD-Dps');
  });

  it('stays switched off when unconfigured', () =>
  {
    // Arrange & Act & Assert- an instrument left on screen in a real session is a bug.
    expect(globalThis.J.HUD.EXT.DPS.Metadata.enabled).toBe(false);
  });

  it('falls back to the default window position and size when unconfigured', () =>
  {
    // Arrange & Act
    const { Metadata } = globalThis.J.HUD.EXT.DPS;

    // Assert
    expect(Metadata.windowX).toBe(0);
    expect(Metadata.windowY).toBe(0);
    expect(Metadata.windowWidth).toBe(360);
    expect(Metadata.windowHeight).toBe(160);
  });

  it('falls back to full opacity when unconfigured', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.HUD.EXT.DPS.Metadata.windowOpacity).toBe(255);
  });

  it('initializes an empty aliased map for the class it hooks', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.HUD.EXT.DPS;

    // Assert
    expect(Aliased.Scene_Map).toBeInstanceOf(Map);
  });

  it('throws when J-Base does not satisfy the minimum required version', async () =>
  {
    // Arrange: downgrade the already-installed J-Base metadata below the required floor.
    vi.resetModules();
    const originalVersion = globalThis.J.BASE.Metadata.Version;
    globalThis.J.BASE.Metadata.Version = '0.0.1';
    setPluginContextToJHudDps();

    // Act & Assert
    await expect(import('../../../../../../src/plugins/hud/ext/dps/_metadata/initialization.js'))
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
    setPluginContextToJHudDps();

    // Act & Assert
    await expect(import('../../../../../../src/plugins/hud/ext/dps/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-HUD/);

    // restore the real accessor rather than relying on restoreAllMocks.
    globalThis.J.HUD.Metadata.version.version = originalVersion;
  });
});
//endregion plugins/hud/ext/dps/_metadata/metadata.test.js