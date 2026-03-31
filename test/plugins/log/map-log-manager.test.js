//region plugins/log/map-log-manager.test.js
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { loadLogPluginVm } from './log-vm.js';

describe('J-Log MapLogManager (out/J-Log.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadLogPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('adds logs, caps size, and flags/acknowledges processing', () =>
  {
    const mgr = new sandbox.MapLogManager();
    mgr.setMaxLogCount(2);

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
    const mgr = new sandbox.MapLogManager();
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
    sandbox.DataManager.createGameObjects();

    for (let i = 0; i < 40; i++)
    {
      sandbox.$actionLogManager.addLog({ id: i });
    }

    expect(sandbox.$actionLogManager.getLogs().length).toBe(30);
  });
});
//endregion plugins/log/map-log-manager.test.js
