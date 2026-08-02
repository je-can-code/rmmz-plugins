//region plugins/_base/managers/input.test.js
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

describe('J-Base Input (unit, engine globals stubbed)', () =>
{
  /** @type {typeof import('../../../../../src/plugins/_base/core/managers/InputDeviceTracker.js').default} */
  let InputDeviceTracker;

  /** The stub standing in for the engine's own keydown handler. */
  let originalOnKeyDown;

  /** The stub standing in for the engine's own gamepad state reader. */
  let originalUpdateGamepadState;

  /**
   * Builds a gamepad shaped the way the browser reports one.
   * @param {boolean[]} pressedButtons Which buttons are currently held.
   * @param {number[]} axes The current deflection of each analog axis.
   * @returns {{buttons: {pressed: boolean}[], axes: number[]}}
   */
  const buildGamepad = (pressedButtons, axes) => ({
    buttons: pressedButtons.map(pressed => ({ pressed })),
    axes,
  });

  /** A pad that is connected but entirely untouched. */
  const idleGamepad = () => buildGamepad([ false, false ], [ 0, 0 ]);

  beforeAll(async () =>
  {
    vi.resetModules();

    // stand in for the engine methods the aliases wrap, so the alias chain can be observed.
    originalOnKeyDown = vi.fn();
    originalUpdateGamepadState = vi.fn();

    globalThis.Input = {
      _onKeyDown: originalOnKeyDown,
      _updateGamepadState: originalUpdateGamepadState,
      _currentState: {},
      _gamepadStates: [],

      // a trimmed stand-in for the engine's mapper; 90 is `Z`, and 123 (`F12`) is deliberately absent.
      keyMapper: { 90: 'ok' },
    };

    globalThis.J = { BASE: { Aliased: { Input: new Map() } } };

    InputDeviceTracker = (await import('../../../../../src/plugins/_base/core/managers/InputDeviceTracker.js')).default;

    await import('../../../../../src/plugins/_base/core/managers/Input.js');
  });

  beforeEach(() =>
  {
    InputDeviceTracker.reset();
    originalOnKeyDown.mockReset();
    originalUpdateGamepadState.mockReset();
  });

  describe('currentState', () =>
  {
    it('hands back the engine\'s merged input state', () =>
    {
      // Arrange.
      globalThis.Input._currentState = { ok: true };

      // Act & Assert.
      expect(globalThis.Input.currentState()).toEqual({ ok: true });
    });
  });

  describe('gamepadStates', () =>
  {
    it('hands back the per-pad state snapshots', () =>
    {
      // Arrange.
      globalThis.Input._gamepadStates = [ [ true ] ];

      // Act & Assert.
      expect(globalThis.Input.gamepadStates()).toEqual([ [ true ] ]);
    });
  });

  describe('gamepadAxisThreshold', () =>
  {
    it('matches the deflection the engine treats as a direction', () =>
    {
      // Act & Assert: staying in step with the engine keeps "pushed" meaning one thing.
      expect(globalThis.Input.gamepadAxisThreshold()).toBe(0.5);
    });
  });

  describe('isGamepadActive', () =>
  {
    it('reports active when a button is held', () =>
    {
      // Arrange: a pad with its second button down.
      const gamepad = buildGamepad([ false, true ], [ 0, 0 ]);

      // Act & Assert.
      expect(globalThis.Input.isGamepadActive(gamepad)).toBe(true);
    });

    it('reports active when an axis is pushed past the threshold', () =>
    {
      // Arrange: no buttons, but a stick shoved well past where the engine reads a direction.
      const gamepad = buildGamepad([ false, false ], [ 0, -0.9 ]);

      // Act & Assert: the sign does not matter, only the distance from rest.
      expect(globalThis.Input.isGamepadActive(gamepad)).toBe(true);
    });

    it('reports inactive when nothing is held and the sticks are near rest', () =>
    {
      // Arrange: slight drift, of the kind a worn stick reports constantly.
      const gamepad = buildGamepad([ false, false ], [ 0.1, -0.2 ]);

      // Act & Assert: drift below the threshold must not look like the player reaching for the pad.
      expect(globalThis.Input.isGamepadActive(gamepad)).toBe(false);
    });
  });

  describe('isMappedKeyCode', () =>
  {
    it('accepts a key the game binds', () =>
    {
      // Act & Assert.
      expect(globalThis.Input.isMappedKeyCode(90)).toBe(true);
    });

    it('rejects a key the game ignores', () =>
    {
      // Act & Assert.
      expect(globalThis.Input.isMappedKeyCode(123)).toBe(false);
    });
  });

  describe('_onKeyDown', () =>
  {
    it('records the keyboard as the current device for a bound key', () =>
    {
      // Arrange: start the player on a pad so the switch is observable.
      InputDeviceTracker.markGamepad();

      // Act.
      globalThis.Input._onKeyDown({ keyCode: 90 });

      // Assert.
      expect(InputDeviceTracker.isKeyboard()).toBe(true);
    });

    it('leaves the device alone for a key the game ignores', () =>
    {
      // Arrange: the player is on a pad.
      InputDeviceTracker.markGamepad();

      // Act: a screenshot hotkey, an F-key, a cat- none of which the game acts on.
      globalThis.Input._onKeyDown({ keyCode: 123 });

      // Assert: a stray keypress must not rewrite a controller player's legend.
      expect(InputDeviceTracker.isGamepad()).toBe(true);
    });

    it('still performs the original logic', () =>
    {
      // Arrange.
      const event = { keyCode: 90 };

      // Act.
      globalThis.Input._onKeyDown(event);

      // Assert: the engine's own handler must still see the event.
      expect(originalOnKeyDown).toHaveBeenCalledWith(event);
    });
  });

  describe('_updateGamepadState', () =>
  {
    it('still performs the original logic', () =>
    {
      // Arrange.
      const gamepad = idleGamepad();

      // Act.
      globalThis.Input._updateGamepadState(gamepad);

      // Assert.
      expect(originalUpdateGamepadState).toHaveBeenCalledWith(gamepad);
    });

    it('claims the device for an idle pad when the player has pressed nothing yet', () =>
    {
      // Act: a pad connected at boot reports itself every frame without being touched.
      globalThis.Input._updateGamepadState(idleGamepad());

      // Assert: presence alone is enough while there is no stronger evidence.
      expect(InputDeviceTracker.isGamepad()).toBe(true);
    });

    it('leaves an idle pad unable to overrule a keyboard the player actually used', () =>
    {
      // Arrange: the player typed.
      globalThis.Input._onKeyDown({ keyCode: 90 });

      // Act: the untouched pad keeps reporting.
      globalThis.Input._updateGamepadState(idleGamepad());

      // Assert: the legend does not flicker away from the device in use.
      expect(InputDeviceTracker.isKeyboard()).toBe(true);
    });

    it('claims the device when the pad is actually being held', () =>
    {
      // Arrange: the player typed, then reached for the pad.
      globalThis.Input._onKeyDown({ keyCode: 90 });

      // Act.
      globalThis.Input._updateGamepadState(buildGamepad([ true, false ], [ 0, 0 ]));

      // Assert: a real press outranks the earlier one.
      expect(InputDeviceTracker.isGamepad()).toBe(true);
    });
  });
});
//endregion plugins/_base/managers/input.test.js
