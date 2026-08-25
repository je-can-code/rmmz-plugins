//region plugins/log/_component/plugin-commands.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installLogHostGlobals, setPluginContextToJBase, setPluginContextToJLog } from './fixtures/install-log-host-globals.js';

describe('J-Log plugin commands mutate managers (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installLogHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJLog();
    await import('../../../../src/plugins/log/core/_metadata/initialization.js');

    // DataManager.js and pluginCommands.js both need to share the same $mapLogs instance,
    // so DataManager.createGameObjects() (called in the test) must come from this same import batch.
    await import('../../../../src/plugins/log/core/managers/DataManager.js');

    // registers the plugin commands as an import-time side effect, no vm involved.
    await import('../../../../src/plugins/log/core/_metadata/pluginCommands.js');
  });

  it('registers every action log command under the J-Log plugin name', () =>
  {
    // Arrange & Act
    const registered = [ ...globalThis.__logPluginCommands.keys() ];

    // Assert
    expect(registered).toEqual(expect.arrayContaining([
      'J-Log:showActionLog',
      'J-Log:hideActionLog',
      'J-Log:addActionLog',
      'J-Log:clearActionLog',
    ]));
  });

  it('showActionLog makes the log visible', () =>
  {
    // Arrange
    globalThis.DataManager.createGameObjects();

    // Act
    globalThis.__logPluginCommands.get('J-Log:showActionLog')();

    // Assert
    expect(globalThis.$mapLogs.action.isVisible()).toBe(true);
  });

  it('hideActionLog hides the log again', () =>
  {
    // Arrange
    globalThis.DataManager.createGameObjects();
    globalThis.__logPluginCommands.get('J-Log:showActionLog')();

    // Act
    globalThis.__logPluginCommands.get('J-Log:hideActionLog')();

    // Assert
    expect(globalThis.$mapLogs.action.isHidden()).toBe(true);
  });

  it('addActionLog appends the given text as a log entry', () =>
  {
    // Arrange
    globalThis.DataManager.createGameObjects();

    // Act
    globalThis.__logPluginCommands.get('J-Log:addActionLog')({ text: 'hello' });

    // Assert
    expect(globalThis.$mapLogs.action.getLogs().length).toBe(1);
  });

  it('clearActionLog empties the accumulated log entries', () =>
  {
    // Arrange
    globalThis.DataManager.createGameObjects();
    globalThis.__logPluginCommands.get('J-Log:addActionLog')({ text: 'hello' });

    // Act
    globalThis.__logPluginCommands.get('J-Log:clearActionLog')();

    // Assert
    expect(globalThis.$mapLogs.action.getLogs().length).toBe(0);
  });

  describe('dia log', () =>
  {
    it('showDiaLog makes the dialog window visible', () =>
    {
      // Arrange- the three logs are separate managers so a cutscene can silence combat chatter
      // without also silencing its own dialogue.
      globalThis.DataManager.createGameObjects();

      // Act
      globalThis.__logPluginCommands.get('J-Log:showDiaLog')();

      // Assert
      expect(globalThis.$mapLogs.dialog.isVisible()).toBe(true);
    });

    it('hideDiaLog hides the dialog window again', () =>
    {
      // Arrange
      globalThis.DataManager.createGameObjects();
      globalThis.__logPluginCommands.get('J-Log:showDiaLog')();

      // Act
      globalThis.__logPluginCommands.get('J-Log:hideDiaLog')();

      // Assert
      expect(globalThis.$mapLogs.dialog.isHidden()).toBe(true);
    });

    it('addDiaLog splits the supplied text into one entry across its lines', () =>
    {
      // Arrange- the editor hands over a single multi-line string, and the builder wants an array.
      globalThis.DataManager.createGameObjects();

      // Act
      globalThis.__logPluginCommands.get('J-Log:addDiaLog')(
        { lines: 'first line\nsecond line', faceName: 'Actor1', faceIndex: '2' });

      // Assert
      const [ log ] = globalThis.$mapLogs.dialog.getLogs();
      expect(globalThis.$mapLogs.dialog.getLogs().length).toBe(1);
      expect(log.lines()).toEqual([ 'first line', 'second line' ]);
    });

    it('clearDiaLog empties the accumulated dialogue entries', () =>
    {
      // Arrange
      globalThis.DataManager.createGameObjects();
      globalThis.__logPluginCommands.get('J-Log:addDiaLog')(
        { lines: 'first line', faceName: 'Actor1', faceIndex: '2' });

      // Act
      globalThis.__logPluginCommands.get('J-Log:clearDiaLog')();

      // Assert
      expect(globalThis.$mapLogs.dialog.getLogs().length).toBe(0);
    });
  });

  describe('loot log', () =>
  {
    it('showLootLog makes the loot window visible', () =>
    {
      // Arrange
      globalThis.DataManager.createGameObjects();

      // Act
      globalThis.__logPluginCommands.get('J-Log:showLootLog')();

      // Assert
      expect(globalThis.$mapLogs.loot.isVisible()).toBe(true);
    });

    it('hideLootLog hides the loot window again', () =>
    {
      // Arrange
      globalThis.DataManager.createGameObjects();
      globalThis.__logPluginCommands.get('J-Log:showLootLog')();

      // Act
      globalThis.__logPluginCommands.get('J-Log:hideLootLog')();

      // Assert
      expect(globalThis.$mapLogs.loot.isHidden()).toBe(true);
    });

    it('addLootLog records the obtained loot as an entry', () =>
    {
      // Arrange
      globalThis.DataManager.createGameObjects();

      // Act
      globalThis.__logPluginCommands.get('J-Log:addLootLog')({ lootId: '1', lootType: 'i' });

      // Assert
      expect(globalThis.$mapLogs.loot.getLogs().length).toBe(1);
    });

    it('clearLootLog empties the accumulated loot entries', () =>
    {
      // Arrange
      globalThis.DataManager.createGameObjects();
      globalThis.__logPluginCommands.get('J-Log:addLootLog')({ lootId: '1', lootType: 'i' });

      // Act
      globalThis.__logPluginCommands.get('J-Log:clearLootLog')();

      // Assert
      expect(globalThis.$mapLogs.loot.getLogs().length).toBe(0);
    });
  });
});
//endregion plugins/log/_component/plugin-commands.test.js
