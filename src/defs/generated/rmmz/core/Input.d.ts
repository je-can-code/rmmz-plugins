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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _currentState: object;
  _date: number;
  _dir4: number;
  _dir8: number;
  _gamepadStates: unknown[];
  _latestButton: null | string;
  _preferredAxis: string;
  _pressedTime: number;
  _previousState: object;
  _virtualButton: null | string;
}
declare function Input(): never;
declare namespace Input
{
  function _isEscapeCompatible(keyName: string): boolean;
  function _makeNumpadDirection(x: number, y: number): number;
  /**
   * The time of the last input in milliseconds.
   */
  function _onKeyDown(event: KeyboardEvent): void;
  function _onKeyUp(event: KeyboardEvent): void;
  function _onLostFocus(): void;
  function _pollGamepads(): void;
  /**
   * The time of the last input in milliseconds.
   */
  function _setupEventHandlers(): void;
  /**
   * The time of the last input in milliseconds.
   */
  function _shouldPreventDefault(keyCode: number): boolean;
  function _signX(): number;
  function _signY(): number;
  function _updateDirection(): void;
  function _updateGamepadState(gamepad: Gamepad): void;
  /**
   * Clears all the input data.
   */
  function clear(): void;
  /**
   * Initializes the input system.
   */
  function initialize(): void;
  /**
   * Checks whether a key is kept depressed.
   * @param keyName The mapped name of the key.
   */
  function isLongPressed(keyName: string): boolean;
  /**
   * Checks whether a key is currently pressed down.
   * @param keyName The mapped name of the key.
   */
  function isPressed(keyName: string): boolean;
  /**
   * Checks whether a key is just pressed or a key repeat occurred.
   * @param keyName The mapped name of the key.
   */
  function isRepeated(keyName: string): boolean;
  /**
   * Checks whether a key is just pressed.
   * @param keyName The mapped name of the key.
   */
  function isTriggered(keyName: string): boolean;
  /**
   * Updates the input data.
   */
  function update(): void;
  /**
   * The time of the last input in milliseconds.
   */
  function virtualClick(buttonName: string): void;
  const keyRepeatInterval: 6;
  const keyRepeatWait: 24;
}
