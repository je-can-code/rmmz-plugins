//region plugins/abs/ext/input/_metadata/metadata.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  installAbsHostGlobals,
  setPluginContextToJAbs,
  setPluginContextToJBase,
} from '../../../_component/fixtures/install-abs-host-globals.js';
import { setPluginContextToJabsInput } from '../_component/fixtures/install-abs-input-host-globals.js';
import { installPluginManagerWithParams } from '../../../../../setup/install-plugin-manager-with-params.js';

const INIT_PATH = '../../../../../../src/plugins/abs/ext/input/_metadata/initialization.js';

describe('J-ABS-InputManager metadata (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installAbsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJAbs();
    await import('../../../../../../src/plugins/abs/core/_metadata/initialization.js');

    // this extension's JABS_StandardController extends JABS_BaseController at module-evaluation
    // time, reaching it as a bare global the way the concatenated J-ABS bundle provides it.
    ({ default: globalThis.JABS_BaseController } =
      await import('../../../../../../src/plugins/abs/core/models/JABS_BaseController.js'));

    installPluginManagerWithParams(globalThis, 'J-ABS-InputManager', {});

    setPluginContextToJabsInput();
    await import(INIT_PATH);
  });

  it('declares an aliased-method map for every class the plugin patches', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.INPUT;

    // Assert- a missing map surfaces later as "cannot read set of undefined" at patch time.
    expect(Aliased.DataManager).toBeInstanceOf(Map);
    expect(Aliased.Game_Player).toBeInstanceOf(Map);
    expect(Aliased.Game_System).toBeInstanceOf(Map);
    expect(Aliased.Input).toBeInstanceOf(Map);
    expect(Aliased.JABS_Engine).toBeInstanceOf(Map);
    expect(Aliased.JABS_Battler).toBeInstanceOf(Map);
    expect(Aliased.Window_MenuCommand).toBeInstanceOf(Map);
    expect(Aliased.Window_Selectable).toBeInstanceOf(Map);
    expect(Aliased.Scene_Menu).toBeInstanceOf(Map);
  });

  it('starts every alias map empty so the patching code owns each entry', () =>
  {
    // Arrange & Act
    const { Aliased } = globalThis.J.ABS.EXT.INPUT;

    // Assert
    expect(Aliased.DataManager.size).toBe(0);
    expect(Aliased.Game_Player.size).toBe(0);
    expect(Aliased.Game_System.size).toBe(0);
    expect(Aliased.Input.size).toBe(0);
    expect(Aliased.JABS_Engine.size).toBe(0);
    expect(Aliased.JABS_Battler.size).toBe(0);
    expect(Aliased.Window_MenuCommand.size).toBe(0);
    expect(Aliased.Window_Selectable.size).toBe(0);
    expect(Aliased.Scene_Menu.size).toBe(0);
  });

  it('completes the base plugin metadata initialization it extends', () =>
  {
    // Arrange & Act & Assert
    expect(globalThis.J.ABS.EXT.INPUT.Metadata.parsedPluginParameters).toBeDefined();
  });

  describe('host version requirements', () =>
  {
    it('throws when J-Base does not satisfy the minimum required version', async () =>
    {
      // Arrange: drop the already-installed J-Base metadata below this extension's floor.
      vi.resetModules();
      const originalVersion = globalThis.J.BASE.Metadata.Version;
      globalThis.J.BASE.Metadata.Version = '0.0.1';
      setPluginContextToJabsInput();

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
      setPluginContextToJabsInput();

      // Act & Assert
      await expect(import(INIT_PATH)).rejects.toThrow(/missing J-ABS/);

      // restore the real accessor rather than relying on restoreAllMocks.
      globalThis.J.ABS.Metadata.version.version = originalVersion;
    });
  });
});
//endregion plugins/abs/ext/input/_metadata/metadata.test.js
