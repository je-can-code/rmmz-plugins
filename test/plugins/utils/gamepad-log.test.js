//region plugins/utils/gamepad-log.test.js
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { loadUtilsPluginVm } from './utils-vm.js';

describe('J-SystemUtilities gamepad fresh press logging (out/utils/J-SystemUtilities.js)', () =>
{
  let sandbox;

  beforeAll(() =>
  {
    sandbox = { console };
    loadUtilsPluginVm(sandbox);
  });

  afterAll(() =>
  {
    sandbox = null;
  });

  it('logs only fresh presses when enabled', () =>
  {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    sandbox.J.UTILS.GamepadLog.enabled = true;
    sandbox.Input.gamepadMapper[0] = 'ok';
    sandbox.Input._gamepadStates[0] = [ false ];

    sandbox.Input._updateGamepadState({ index: 0 });

    expect(logSpy.mock.calls.flat().join(' ')).toContain('ok');

    logSpy.mockRestore();
  });
});
//endregion plugins/utils/gamepad-log.test.js
