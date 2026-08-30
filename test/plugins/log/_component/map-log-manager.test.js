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
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

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

  it('DataManager.createGameObjects installs the registry with per-channel max log counts', () =>
  {
    // Arrange- overfill every channel past its own cap, so each one has to trim to a different
    // number. One channel alone cannot distinguish "the registry set three caps" from "the
    // registry set one cap and the others kept MapLogManager's own default of 100".
    globalThis.DataManager.createGameObjects();

    // Act
    for (let i = 0; i < 200; i++)
    {
      globalThis.$mapLogs.action.addLog({ id: i });
      globalThis.$mapLogs.dialog.addLog({ id: i });
      globalThis.$mapLogs.loot.addLog({ id: i });
    }

    // Assert
    expect(globalThis.$mapLogs.action.getLogs().length).toBe(30);
    expect(globalThis.$mapLogs.dialog.getLogs().length).toBe(10);
    expect(globalThis.$mapLogs.loot.getLogs().length).toBe(100);
  });
});
//endregion plugins/log/_component/map-log-manager.test.js
