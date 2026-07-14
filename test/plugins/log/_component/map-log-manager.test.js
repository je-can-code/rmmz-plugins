//region plugins/log/_component/map-log-manager.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installLogHostGlobals, setPluginContextToJBase, setPluginContextToJLog } from './fixtures/install-log-host-globals.js';

describe('J-Log MapLogManager (direct src import)', () =>
{
  /** @type {typeof import('../../../../src/plugins/log/core/managers/MapLogManager.js').default} */
  let MapLogManager;

  beforeAll(async () =>
  {
    vi.resetModules();

    installLogHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJLog();
    await import('../../../../src/plugins/log/core/_metadata/initialization.js');

    ({ default: MapLogManager } = await import('../../../../src/plugins/log/core/managers/MapLogManager.js'));

    // patches globalThis.DataManager directly, no vm involved; must share MapLogManager's module
    // instance, so import it after the line above (same post-reset registry epoch).
    await import('../../../../src/plugins/log/core/managers/DataManager.js');
  });

  it('adds logs, caps size, and flags/acknowledges processing', () =>
  {
    // Arrange
    const mgr = new MapLogManager();
    mgr.setMaxLogCount(2);

    // Act & Assert
    expect(mgr.needsProcessing()).toBe(false);

    mgr.addLog({ id: 1 });
    mgr.addLog({ id: 2 });
    mgr.addLog({ id: 3 });

    expect(mgr.getLogs().length).toBe(2);
    expect(mgr.getLogs()[0].id).toBe(2);
    expect(mgr.needsProcessing()).toBe(true);

    mgr.acknowledgeProcessing();
    expect(mgr.needsProcessing()).toBe(false);

    mgr.clearLogs();
    expect(mgr.getLogs().length).toBe(0);
    expect(mgr.needsProcessing()).toBe(true);
  });

  it('tracks visible/hidden state', () =>
  {
    // Arrange
    const mgr = new MapLogManager();

    // Act & Assert
    expect(mgr.isVisible()).toBe(true);
    expect(mgr.isHidden()).toBe(false);

    mgr.hideLog();
    expect(mgr.isVisible()).toBe(false);
    expect(mgr.isHidden()).toBe(true);

    mgr.showLog();
    expect(mgr.isVisible()).toBe(true);
  });

  it('DataManager.createGameObjects installs managers with max log counts', () =>
  {
    // Arrange
    globalThis.DataManager.createGameObjects();

    // Act
    for (let i = 0; i < 40; i++)
    {
      globalThis.$actionLogManager.addLog({ id: i });
    }

    // Assert
    expect(globalThis.$actionLogManager.getLogs().length).toBe(30);
  });
});
//endregion plugins/log/_component/map-log-manager.test.js
