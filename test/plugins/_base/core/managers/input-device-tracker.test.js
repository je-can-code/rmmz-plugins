//region plugins/_base/managers/input-device-tracker.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-Base InputDeviceTracker (unit, no dependencies)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/_base/core/managers/InputDeviceTracker.js').default} */
  let InputDeviceTracker;

  beforeAll(async () =>
  {
    vi.resetModules();

    InputDeviceTracker = (await import('../../../../../src/plugins/_base/core/managers/InputDeviceTracker.js')).default;
  });

  beforeEach(() =>
  {
    // the tracker is static state shared across the whole realm, so every test starts from scratch.
    InputDeviceTracker.reset();
  });

  describe('currentDevice', () =>
  {
    it('defaults to the keyboard', () =>
    {
      // Act & Assert: a keyboard is the one device a machine running the game is guaranteed to have.
      expect(InputDeviceTracker.currentDevice()).toBe('keyboard');
    });
  });

  describe('markKeyboard', () =>
  {
    it('switches the current device to the keyboard', () =>
    {
      // Arrange: get the tracker onto a gamepad first so the switch is observable.
      InputDeviceTracker.markGamepad();

      // Act.
      InputDeviceTracker.markKeyboard();

      // Assert: the device is exclusive, so claiming one has to release the other.
      expect(InputDeviceTracker.isKeyboard()).toBe(true);
      expect(InputDeviceTracker.isGamepad()).toBe(false);
    });
  });

  describe('markGamepad', () =>
  {
    it('switches the current device to the gamepad', () =>
    {
      // Act.
      InputDeviceTracker.markGamepad();

      // Assert: the device is exclusive, so claiming one has to release the other.
      expect(InputDeviceTracker.isGamepad()).toBe(true);
      expect(InputDeviceTracker.isKeyboard()).toBe(false);
    });
  });

  describe('noteGamepadPresent', () =>
  {
    it('claims the device when the player has pressed nothing yet', () =>
    {
      // Act: a pad plugged in at boot, untouched.
      InputDeviceTracker.noteGamepadPresent();

      // Assert: the first glyphs a controller player sees are the right ones.
      expect(InputDeviceTracker.isGamepad()).toBe(true);
    });

    it('leaves the device alone once the player has used the keyboard', () =>
    {
      // Arrange: the player typed, which is stronger evidence than a pad merely existing.
      InputDeviceTracker.markKeyboard();

      // Act: the connected pad keeps reporting itself every frame.
      InputDeviceTracker.noteGamepadPresent();

      // Assert: presence does not get to overrule a real press.
      expect(InputDeviceTracker.isKeyboard()).toBe(true);
    });

    it('leaves the device alone once the player has used the gamepad', () =>
    {
      // Arrange: the player pressed something on the pad, then went back to the keyboard.
      InputDeviceTracker.markGamepad();
      InputDeviceTracker.markKeyboard();

      // Act: the pad is still plugged in and still reporting.
      InputDeviceTracker.noteGamepadPresent();

      // Assert: the claim persists, so a pad left connected cannot fight a keyboard player.
      expect(InputDeviceTracker.isKeyboard()).toBe(true);
    });
  });

  describe('reset', () =>
  {
    it('restores the default device and clears the claim', () =>
    {
      // Arrange: claim the device with a real press.
      InputDeviceTracker.markKeyboard();

      // Act.
      InputDeviceTracker.reset();

      // Assert: presence is listened to again, proving the claim was cleared and not just the device.
      InputDeviceTracker.noteGamepadPresent();
      expect(InputDeviceTracker.isGamepad()).toBe(true);
    });
  });
});
//endregion plugins/_base/managers/input-device-tracker.test.js
