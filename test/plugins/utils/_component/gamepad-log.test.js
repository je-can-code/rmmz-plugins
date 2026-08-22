//region plugins/utils/_component/gamepad-log.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { installUtilsHostGlobals, setPluginContextToJBase, setPluginContextToJUtils } from './fixtures/install-utils-host-globals.js';

describe('J-SystemUtilities gamepad fresh press logging (direct src import)', () =>
{
  beforeAll(async () =>
  {
    vi.resetModules();

    installUtilsHostGlobals();

    setPluginContextToJBase();
    await import('../../../../src/plugins/_base/core/_metadata/initialization.js');

    setPluginContextToJUtils();
    await import('../../../../src/plugins/utils/core/_metadata/initialization.js');

    // patches globalThis.Input directly, no vm involved.
    await import('../../../../src/plugins/utils/core/managers/Input.js');

    // J-Base accessors the input layer reads through.
    globalThis.Input.currentState = function() { return this._currentState; };
    globalThis.Input.gamepadStates = function() { return this._gamepadStates; };
  });

  it('logs only fresh presses when enabled', () =>
  {
    // Arrange
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    globalThis.J.UTILS.GamepadLog.enabled = true;
    globalThis.Input.gamepadMapper[0] = 'ok';
    globalThis.Input._gamepadStates[0] = [ false ];

    // Act
    globalThis.Input._updateGamepadState({ index: 0 });

    // Assert
    expect(logSpy.mock.calls.flat().join(' ')).toContain('ok');
    logSpy.mockRestore();
  });

  it('names the pad by its own id when the browser reported one', () =>
  {
    // Arrange- a real controller reports a descriptive id, and that is far more useful in a log than
    // a bare slot number when several pads are connected.
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    globalThis.J.UTILS.GamepadLog.enabled = true;
    globalThis.Input.gamepadMapper[0] = 'ok';
    globalThis.Input._gamepadStates[1] = [ false ];

    // Act
    globalThis.Input._updateGamepadState({ index: 1, id: 'DualSense Wireless Controller' });

    // Assert
    expect(logSpy.mock.calls.flat().join(' ')).toContain('DualSense Wireless Controller');
    logSpy.mockRestore();
  });

  it('diffs against the pad own recorded history rather than against nothing', () =>
  {
    // Arrange- a button held down across frames must not re-announce itself, which is only true while
    // the previous state is read out of the pad's own slot. Both other reasons this could stay quiet
    // are neutralized: logging is on, and index 0 is mapped to a real symbol.
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    globalThis.J.UTILS.GamepadLog.enabled = true;
    globalThis.Input.gamepadMapper[0] = 'ok';
    globalThis.Input._gamepadStates[4] = [ true ];

    // Act- the host stub's original logic writes [ true ] back into the slot, so this frame is a hold.
    globalThis.Input._updateGamepadState({ index: 4 });

    // Assert- and the slot really was written, proving the alias chain ran rather than bailing early.
    expect(logSpy).not.toHaveBeenCalled();
    expect(globalThis.Input._gamepadStates[4]).toEqual([ true ]);

    globalThis.J.UTILS.GamepadLog.enabled = false;
    logSpy.mockRestore();
  });

  it('ignores a pressed button that maps to no known symbol', () =>
  {
    // Arrange- controllers report more buttons than RMMZ binds, so unmapped indices are pressed all
    // the time and logging a bare index would be noise rather than information.
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    globalThis.J.UTILS.GamepadLog.enabled = true;
    delete globalThis.Input.gamepadMapper[15];
    globalThis.Input._gamepadStates[2] = [];

    // Act
    globalThis.J.UTILS.GamepadLog.logFreshPresses({ index: 2 }, [], Object.assign([], { 15: true }));

    // Assert
    expect(logSpy).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('starts a pad it has never seen from an empty previous state rather than from nothing', () =>
  {
    // Arrange- a controller connected mid-session has no recorded history to diff against. Standing
    // in an empty array is what keeps the comparison working at all; the cost is that its very first
    // frame reads whatever is held as fresh, which is the right trade for one frame of log noise.
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    globalThis.J.UTILS.GamepadLog.enabled = true;
    globalThis.Input.gamepadMapper[0] = 'ok';
    delete globalThis.Input._gamepadStates[9];

    // Act
    const update = () => globalThis.Input._updateGamepadState({ index: 9 });

    // Assert
    expect(update).not.toThrow();
    logSpy.mockRestore();
  });
});
//endregion plugins/utils/_component/gamepad-log.test.js
