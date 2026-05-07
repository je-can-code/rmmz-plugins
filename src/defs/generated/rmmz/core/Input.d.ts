/**
 * Generated from project/js/rmmz_core.js
 * Class: Input
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Input
{
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Input#clear}.
   * Read in: {@link Input#_onKeyDown}, {@link Input#_onKeyUp}, {@link Input#_updateGamepadState}, {@link Input#isPressed}, {@link Input#update}.
   */
  _currentState: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Input#clear}, {@link Input#update}.
   * Read in: none.
   */
  _date: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Input#_updateDirection}, {@link Input#clear}.
   * Read in: none.
   */
  _dir4: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Input#_updateDirection}, {@link Input#clear}.
   * Read in: none.
   */
  _dir8: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link Input#clear}.
   * Read in: {@link Input#_updateGamepadState}.
   */
  _gamepadStates: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `null | string`.
   * Initialized in: none.
   * Written in: {@link Input#clear}, {@link Input#update}.
   * Read in: {@link Input#isLongPressed}, {@link Input#isRepeated}, {@link Input#isTriggered}, {@link Input#update}.
   */
  _latestButton: null | string;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: none.
   * Written in: {@link Input#_updateDirection}, {@link Input#clear}.
   * Read in: {@link Input#_updateDirection}.
   */
  _preferredAxis: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Input#clear}, {@link Input#update}.
   * Read in: {@link Input#isLongPressed}, {@link Input#isRepeated}, {@link Input#isTriggered}.
   */
  _pressedTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: none.
   * Written in: {@link Input#clear}.
   * Read in: {@link Input#update}.
   */
  _previousState: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | string`.
   * Initialized in: none.
   * Written in: {@link Input#clear}, {@link Input#update}, {@link Input#virtualClick}.
   * Read in: {@link Input#update}.
   */
  _virtualButton: null | string;
}
declare function Input(): never;
declare namespace Input
{
  /**
   * Gets is escape compatible.
   * @param keyName The keyName parameter.
   * @returns The result.
   */
  function _isEscapeCompatible(keyName: string): boolean;
  /**
   * Gets make numpad direction.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  function _makeNumpadDirection(x: number, y: number): number;
  /**
   * The time of the last input in milliseconds.
   * @param event The event parameter.
   */
  function _onKeyDown(event: KeyboardEvent): void;
  /**
   * Performs on key up.
   * @param event The event parameter.
   */
  function _onKeyUp(event: KeyboardEvent): void;
  /**
   * Performs on lost focus.
   */
  function _onLostFocus(): void;
  /**
   * Performs poll gamepads.
   */
  function _pollGamepads(): void;
  /**
   * The time of the last input in milliseconds.
   */
  function _setupEventHandlers(): void;
  /**
   * The time of the last input in milliseconds.
   * @param keyCode The keyCode parameter.
   * @returns The result.
   */
  function _shouldPreventDefault(keyCode: number): boolean;
  /**
   * Gets sign x.
   * @returns The result.
   */
  function _signX(): number;
  /**
   * Gets sign y.
   * @returns The result.
   */
  function _signY(): number;
  /**
   * Performs update direction.
   */
  function _updateDirection(): void;
  /**
   * Performs update gamepad state.
   * @param gamepad The gamepad parameter.
   */
  function _updateGamepadState(gamepad: Gamepad): void;
  /**
   * Clears all the input data.
   */
  function clear(): void;
  /**
   * The time of the last input in milliseconds.
   * @returns The result.
   */
  get date(): unknown;
  /**
   * The four direction value as a number of the numpad, or 0 for neutral.
   * @returns The result.
   */
  get dir4(): unknown;
  /**
   * The eight direction value as a number of the numpad, or 0 for neutral.
   * @returns The result.
   */
  get dir8(): unknown;
  /**
   * Initializes the input system.
   */
  function initialize(): void;
  /**
   * Checks whether a key is kept depressed.
   * @param keyName The mapped name of the key.
   * @returns True if long pressed; false otherwise.
   */
  function isLongPressed(keyName: string): boolean;
  /**
   * Checks whether a key is currently pressed down.
   * @param keyName The mapped name of the key.
   * @returns True if pressed; false otherwise.
   */
  function isPressed(keyName: string): boolean;
  /**
   * Checks whether a key is just pressed or a key repeat occurred.
   * @param keyName The mapped name of the key.
   * @returns True if repeated; false otherwise.
   */
  function isRepeated(keyName: string): boolean;
  /**
   * Checks whether a key is just pressed.
   * @param keyName The mapped name of the key.
   * @returns True if triggered; false otherwise.
   */
  function isTriggered(keyName: string): boolean;
  /**
   * Updates the input data.
   */
  function update(): void;
  /**
   * The time of the last input in milliseconds.
   * @param buttonName The buttonName parameter.
   */
  function virtualClick(buttonName: string): void;
  /**
   * Engine static constant.
   */
  const keyRepeatInterval: 6;
  /**
   * Engine static constant.
   */
  const keyRepeatWait: 24;
}
