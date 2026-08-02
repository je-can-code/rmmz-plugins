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
    await import('../../../../src/plugins/_base/_metadata/initialization.js');

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
});
//endregion plugins/utils/_component/gamepad-log.test.js
