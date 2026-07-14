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

  it('show/hide commands toggle visibility, add/clear mutate logs', () =>
  {
    // Arrange
    globalThis.DataManager.createGameObjects();
    const show = globalThis.__logPluginCommands.get('J-Log:showActionLog');
    const hide = globalThis.__logPluginCommands.get('J-Log:hideActionLog');
    const add = globalThis.__logPluginCommands.get('J-Log:addActionLog');
    const clear = globalThis.__logPluginCommands.get('J-Log:clearActionLog');

    // Act & Assert
    expect(typeof show).toBe('function');
    expect(typeof hide).toBe('function');
    expect(typeof add).toBe('function');
    expect(typeof clear).toBe('function');

    show();
    expect(globalThis.$actionLogManager.isVisible()).toBe(true);

    hide();
    expect(globalThis.$actionLogManager.isHidden()).toBe(true);

    add({ text: 'hello' });
    expect(globalThis.$actionLogManager.getLogs().length).toBe(1);

    clear();
    expect(globalThis.$actionLogManager.getLogs().length).toBe(0);
  });
});
//endregion plugins/log/_component/plugin-commands.test.js
