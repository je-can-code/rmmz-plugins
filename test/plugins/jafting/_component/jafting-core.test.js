//region plugins/jafting/_component/jafting-core.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../../_base/_component/fixtures/install-j-base-host-globals.js';
import { installMinimalMenuUiStubs } from '../../../setup/install-minimal-menu-ui-stubs.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';

describe('J-JAFTING core (direct src import)', () =>
{
  let Window_JaftingList;
  let Scene_Jafting;
  let Scene_JaftingSalvage;
  let JaftingSalvageManager;
  let JaftingSalvageLedgerRow;
  let JaftingSalvageLedgerSnapshot;
  let JaftingSalvagePartyLedgerBag;

  beforeAll(async () =>
  {
    vi.resetModules();

    installJBaseHostGlobals();
    installMinimalMenuUiStubs(globalThis);

    globalThis.__PLUGIN_NAME__ = 'J-Base';
    globalThis.__PLUGIN_VERSION__ = '3.2.0';
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    // J-JAFTING's _pluginMetadata.js subclasses this real J-Base class.
    globalThis.PluginMetadata = PluginMetadata;

    // Window_JaftingList.buildSalvageHubCommand() reads this real _base bare global.
    ({ default: globalThis.WindowCommandBuilder } = await import('../../../../src/plugins/_base/models/WindowCommandBuilder.js'));

    globalThis.__PLUGIN_NAME__ = 'J-JAFTING';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../../src/plugins/jafting/core/_metadata/initialization.js');

    ({ default: Window_JaftingList } = await import('../../../../src/plugins/jafting/core/windows/Window_JaftingList.js'));
    ({ default: Scene_Jafting } = await import('../../../../src/plugins/jafting/core/scenes/Scene_Jafting.js'));
    ({ default: Scene_JaftingSalvage } = await import('../../../../src/plugins/jafting/core/scenes/Scene_JaftingSalvage.js'));
    ({ default: JaftingSalvageManager } = await import('../../../../src/plugins/jafting/core/managers/JaftingSalvageManager.js'));
    ({ default: JaftingSalvageLedgerRow } = await import('../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerRow.js'));
    ({ default: JaftingSalvageLedgerSnapshot } = await import('../../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerSnapshot.js'));
    ({ default: JaftingSalvagePartyLedgerBag } = await import('../../../../src/plugins/jafting/core/__models/JaftingSalvagePartyLedgerBag.js'));
  });

  describe('J.JAFTING.Metadata', () =>
  {
    it('defaults materialArmorTypeId to 5', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.JAFTING.Metadata.materialArmorTypeId).toBe(5);
    });

    it('defaults materialWeaponTypeId to -1', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.JAFTING.Metadata.materialWeaponTypeId).toBe(-1);
    });
  });

  it('reserves J.JAFTING.EXT as an empty namespace for extensions to claim', () =>
  {
    // Arrange & Act & Assert: core stakes out the namespace but must not populate it, since every
    // key in here belongs to an extension that has not loaded yet.
    expect(globalThis.J.JAFTING.EXT).toEqual({});
  });

  describe('Window_JaftingList', () =>
  {
    it('builds exactly one hub command', () =>
    {
      // Arrange
      const rect = new globalThis.Rectangle(0, 0, 200, 200);
      const hub = new Window_JaftingList(rect);

      // Act
      const commands = hub.buildCommands();

      // Assert
      expect(commands.length).toBe(1);
    });

    it('builds the Salvage hub command keyed to Scene_JaftingSalvage', () =>
    {
      // Arrange
      const rect = new globalThis.Rectangle(0, 0, 200, 200);
      const hub = new Window_JaftingList(rect);

      // Act
      const [ command ] = hub.buildCommands();

      // Assert
      expect(command.symbol).toBe(Scene_JaftingSalvage.KEY);
    });
  });

});
//endregion plugins/jafting/_component/jafting-core.test.js
