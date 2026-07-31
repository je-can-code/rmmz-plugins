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
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJLog();
    await import('../../../../src/plugins/log/core/_metadata/initialization.js');

    // DataManager.js and pluginCommands.js both need to share the same $actionLogManager instance,
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
    expect(globalThis.$actionLogManager.isVisible()).toBe(true);
  });

  it('hideActionLog hides the log again', () =>
  {
    // Arrange
    globalThis.DataManager.createGameObjects();
    globalThis.__logPluginCommands.get('J-Log:showActionLog')();

    // Act
    globalThis.__logPluginCommands.get('J-Log:hideActionLog')();

    // Assert
    expect(globalThis.$actionLogManager.isHidden()).toBe(true);
  });

  it('addActionLog appends the given text as a log entry', () =>
  {
    // Arrange
    globalThis.DataManager.createGameObjects();

    // Act
    globalThis.__logPluginCommands.get('J-Log:addActionLog')({ text: 'hello' });

    // Assert
    expect(globalThis.$actionLogManager.getLogs().length).toBe(1);
  });

  it('clearActionLog empties the accumulated log entries', () =>
  {
    // Arrange
    globalThis.DataManager.createGameObjects();
    globalThis.__logPluginCommands.get('J-Log:addActionLog')({ text: 'hello' });

    // Act
    globalThis.__logPluginCommands.get('J-Log:clearActionLog')();

    // Assert
    expect(globalThis.$actionLogManager.getLogs().length).toBe(0);
  });
});
//endregion plugins/log/_component/plugin-commands.test.js
