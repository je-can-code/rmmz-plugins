//region plugins/_base/models/input-device.test.js
import { beforeAll, describe, expect, it, vi } from 'vitest';

describe('J-Base InputDevice (unit, no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/_base/core/models/InputDevice.js').default} */
  let InputDevice;

  beforeAll(async () =>
  {
    vi.resetModules();

    InputDevice = (await import('../../../../../src/plugins/_base/core/models/InputDevice.js')).default;
  });

  describe('devices', () =>
  {
    it('lists both devices, keyboard first', () =>
    {
      // Act.
      const devices = InputDevice.devices();

      // Assert: keyboard leads because it is the default a session starts in.
      expect(devices).toEqual([ 'keyboard', 'gamepad' ]);
    });
  });

  describe('isValid', () =>
  {
    it('accepts a real device', () =>
    {
      // Act & Assert.
      expect(InputDevice.isValid(InputDevice.Gamepad)).toBe(true);
    });

    it('rejects a value naming no device', () =>
    {
      // Act & Assert: a third style has no glyphs drawn for it, so it cannot be valid.
      expect(InputDevice.isValid('switch')).toBe(false);
    });
  });
});
//endregion plugins/_base/models/input-device.test.js
