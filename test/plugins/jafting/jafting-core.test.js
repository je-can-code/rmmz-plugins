//region plugins/jafting/jafting-core.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installJBaseHostGlobals } from '../_base/fixtures/install-j-base-host-globals.js';
import { installMinimalMenuUiStubs } from '../../setup/install-minimal-menu-ui-stubs.js';
import PluginMetadata from '../../../src/plugins/_base/models/PluginMetadata.js';

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
    globalThis.__PLUGIN_VERSION__ = '3.0.0';
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    // J-JAFTING's _pluginMetadata.js subclasses this real J-Base class.
    globalThis.PluginMetadata = PluginMetadata;

    // Window_JaftingList.buildSalvageHubCommand() reads this real _base bare global.
    ({ default: globalThis.WindowCommandBuilder } = await import('../../../src/plugins/_base/models/WindowCommandBuilder.js'));

    globalThis.__PLUGIN_NAME__ = 'J-JAFTING';
    globalThis.__PLUGIN_VERSION__ = '1.0.0';
    await import('../../../src/plugins/jafting/core/_metadata/initialization.js');

    ({ default: Window_JaftingList } = await import('../../../src/plugins/jafting/core/windows/Window_JaftingList.js'));
    ({ default: Scene_Jafting } = await import('../../../src/plugins/jafting/core/scenes/Scene_Jafting.js'));
    ({ default: Scene_JaftingSalvage } = await import('../../../src/plugins/jafting/core/scenes/Scene_JaftingSalvage.js'));
    ({ default: JaftingSalvageManager } = await import('../../../src/plugins/jafting/core/managers/JaftingSalvageManager.js'));
    ({ default: JaftingSalvageLedgerRow } = await import('../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerRow.js'));
    ({ default: JaftingSalvageLedgerSnapshot } = await import('../../../src/plugins/jafting/core/__models/JaftingSalvageLedgerSnapshot.js'));
    ({ default: JaftingSalvagePartyLedgerBag } = await import('../../../src/plugins/jafting/core/__models/JaftingSalvagePartyLedgerBag.js'));
  });

  describe('J.JAFTING.Metadata', () =>
  {
    it('sets the metadata name to J-JAFTING', () =>
    {
      // Arrange & Act & Assert
      expect(globalThis.J.JAFTING.Metadata.name).toBe('J-JAFTING');
    });

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

  it('reserves J.JAFTING.EXT as an object for extensions', () =>
  {
    // Arrange & Act & Assert
    expect(typeof globalThis.J.JAFTING.EXT).toBe('object');
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

  describe('Scene_Jafting', () =>
  {
    it('is defined as a menu scene subclass', () =>
    {
      // Arrange & Act & Assert
      expect(Scene_Jafting.prototype.constructor).toBe(Scene_Jafting);
    });
  });

  describe('Scene_JaftingSalvage and salvage models', () =>
  {
    it('defines Scene_JaftingSalvage', () =>
    {
      // Arrange & Act & Assert
      expect(typeof Scene_JaftingSalvage).toBe('function');
    });

    it('defines JaftingSalvageManager', () =>
    {
      // Arrange & Act & Assert
      expect(typeof JaftingSalvageManager).toBe('function');
    });

    it('defines JaftingSalvageLedgerRow', () =>
    {
      // Arrange & Act & Assert
      expect(typeof JaftingSalvageLedgerRow).toBe('function');
    });

    it('defines JaftingSalvageLedgerSnapshot', () =>
    {
      // Arrange & Act & Assert
      expect(typeof JaftingSalvageLedgerSnapshot).toBe('function');
    });

    it('defines JaftingSalvagePartyLedgerBag', () =>
    {
      // Arrange & Act & Assert
      expect(typeof JaftingSalvagePartyLedgerBag).toBe('function');
    });
  });
});
//endregion plugins/jafting/jafting-core.test.js
