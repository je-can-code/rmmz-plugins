//region plugins/hud/ext/food/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installHudHostGlobals,
  setPluginContextToJBase,
  setPluginContextToJHud,
  setPluginContextToJHudFood,
} from '../../../_component/fixtures/install-hud-host-globals.js';

describe('J-HUD-FOOD metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installHudHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJHud();
    await import('../../../../../../src/plugins/hud/core/_metadata/initialization.js');

    setPluginContextToJHudFood();
    await import('../../../../../../src/plugins/hud/ext/food/_metadata/initialization.js');
  });

  it('falls back to the default window position and size when unconfigured', () =>
  {
    // Arrange & Act
    const { Metadata } = globalThis.J.HUD.EXT.FOOD;

    // Assert
    expect(Metadata.windowX).toBe(0);
    expect(Metadata.windowY).toBe(70);
    expect(Metadata.windowWidth).toBe(200);
    expect(Metadata.windowHeight).toBe(478);
  });

  it('falls back to full opacity when unconfigured', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.HUD.EXT.FOOD.Metadata.windowOpacity).toBe(255);
  });

  it('initializes empty aliased maps for every hooked class', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.HUD.EXT.FOOD;

    // Assert
    expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
    expect(Aliased.Scene_Map).toBeInstanceOf(Map);
  });

  it('throws when J-Base does not satisfy the minimum required version', async () =>
  {
    // Arrange: downgrade the already-installed J-Base metadata below FOOD's required floor.
    vi.resetModules();
    const originalVersion = globalThis.J.BASE.Metadata.Version;
    globalThis.J.BASE.Metadata.Version = '0.0.1';
    setPluginContextToJHudFood();

    // Act & Assert
    await expect(import('../../../../../../src/plugins/hud/ext/food/_metadata/initialization.js'))
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
    setPluginContextToJHudFood();

    // Act & Assert
    await expect(import('../../../../../../src/plugins/hud/ext/food/_metadata/initialization.js'))
      .rejects.toThrow(/missing J-HUD/);

    // restore the real accessor rather than relying on restoreAllMocks.
    globalThis.J.HUD.Metadata.version.version = originalVersion;
  });
});
//endregion plugins/hud/ext/food/_metadata/metadata.test.js
