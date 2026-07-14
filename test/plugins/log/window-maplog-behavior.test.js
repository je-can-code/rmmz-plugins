//region plugins/log/window-maplog-behavior.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installLogHostGlobals, setPluginContextToJBase, setPluginContextToJLog } from './fixtures/install-log-host-globals.js';

describe('J-Log Window_MapLog behavior (direct src import)', () =>
{
  /** @type {typeof import('../../../src/plugins/log/core/windows/_Window_MapLog.js').default} */
  let Window_MapLog;

  beforeAll(async () =>
  {
    vi.resetModules();

    installLogHostGlobals();

    setPluginContextToJBase();
    await import('../../../src/plugins/_base/_metadata/initialization.js');

    setPluginContextToJLog();
    await import('../../../src/plugins/log/core/_metadata/initialization.js');

    // patches globalThis.Window_Command directly via `extends`, no vm involved.
    ({ default: Window_MapLog } = await import('../../../src/plugins/log/core/windows/_Window_MapLog.js'));
  });

  function makeManager()
  {
    return {
      _hidden: false,
      _needsProcessing: false,
      isHidden()
      {
        return this._hidden;
      },
      needsProcessing()
      {
        return this._needsProcessing;
      },
      acknowledgeProcessing: vi.fn(),
      getLogs()
      {
        return [ { message: () => 'hi' } ];
      },
    };
  }

  it('updateVisibility hides when manager hidden, fades when timer low, interference dims, otherwise shows', () =>
  {
    // Arrange
    const mgr = makeManager();
    const rect = new globalThis.Rectangle(0, 0, 300, 100);
    const win = new Window_MapLog(rect, mgr);
    win.contentsOpacity = 255;
    win.setInactivityTimer(120);

    // Act & Assert
    // when manager hidden, window hides immediately.
    mgr._hidden = true;
    win.updateVisibility();
    expect(win.contentsOpacity).toBe(0);
    expect(win.inactivityTimer).toBe(0);

    // when timer <=60 and not hidden, fades on even ticks.
    mgr._hidden = false;
    win.contentsOpacity = 255;
    // set to 61 so after decrement it is 60 (even), causing a fade tick.
    win.setInactivityTimer(61);
    win.updateVisibility();
    expect(win.contentsOpacity).toBe(243);

    // player interference dims toward 64.
    win.contentsOpacity = 200;
    win.setInactivityTimer(120);
    globalThis.$gamePlayer.screenX = () => 10;
    globalThis.$gamePlayer.screenY = () => 10;
    win.x = 0;
    win.y = 0;
    win.width = 100;
    win.height = 100;
    win.updateVisibility();
    expect(win.contentsOpacity).toBe(185);

    // non-interference shows and refreshes inactivity timer.
    globalThis.$gamePlayer.screenX = () => 9999;
    globalThis.$gamePlayer.screenY = () => 9999;
    win.contentsOpacity = 0;
    win.setInactivityTimer(120);
    win.updateVisibility();
    expect(win.contentsOpacity).toBe(255);
    // updateVisibility decrements first, then restores to the current duration.
    expect(win.inactivityTimer).toBe(119);
  });

  it('processDrawIcon shifts textState y and x for smaller icons', () =>
  {
    // Arrange
    const mgr = makeManager();
    const rect = new globalThis.Rectangle(0, 0, 300, 100);
    const win = new Window_MapLog(rect, mgr);
    const textState = { x: 0, y: 0 };

    // Act
    win.processDrawIcon(1, textState);

    // Assert
    expect(textState.y).toBe(0);
    expect(textState.x).toBe(-16);
  });
});
//endregion plugins/log/window-maplog-behavior.test.js
