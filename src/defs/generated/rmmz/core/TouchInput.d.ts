/**
 * Generated from project/js/rmmz_core.js
 * Class: TouchInput
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface TouchInput
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _clicked: boolean;
  _currentState: unknown;
  _date: number;
  _mousePressed: boolean;
  _moved: boolean;
  _newState: unknown;
  _pressedTime: number;
  _screenPressed: boolean;
  _triggerX: number;
  _triggerY: number;
  _x: number;
  _y: number;
}
declare function TouchInput(): never;
declare namespace TouchInput
{
  /**
   * The time of the last input in milliseconds.
   */
  function _createNewState(): object;
  function _onCancel(x: number, y: number): void;
  function _onHover(x: number, y: number): void;
  function _onLeftButtonDown(event: MouseEvent): void;
  function _onLostFocus(): void;
  function _onMiddleButtonDown(): void;
  function _onMouseDown(event: MouseEvent): void;
  function _onMouseMove(event: MouseEvent): void;
  function _onMouseUp(event: MouseEvent): void;
  function _onMove(x: number, y: number): void;
  function _onRelease(x: number, y: number): void;
  function _onRightButtonDown(event: MouseEvent): void;
  function _onTouchCancel(): void;
  function _onTouchEnd(event: TouchEvent): void;
  function _onTouchMove(event: TouchEvent): void;
  function _onTouchStart(event: TouchEvent): void;
  function _onTrigger(x: number, y: number): void;
  function _onWheel(event: MouseEvent): void;
  /**
   * The time of the last input in milliseconds.
   */
  function _setupEventHandlers(): void;
  /**
   * Clears all the touch data.
   */
  function clear(): void;
  /**
   * Initializes the touch system.
   */
  function initialize(): void;
  /**
   * Checks whether the right mouse button is just pressed.
   */
  function isCancelled(): boolean;
  /**
   * Checks whether the mouse button or touchscreen has been pressed and released at the same position.
   */
  function isClicked(): boolean;
  /**
   * Checks whether the mouse is moved without pressing a button.
   */
  function isHovered(): boolean;
  /**
   * Checks whether the left mouse button or touchscreen is kept depressed.
   */
  function isLongPressed(): boolean;
  /**
   * Checks whether the mouse or a finger on the touchscreen is moved.
   */
  function isMoved(): boolean;
  /**
   * Checks whether the mouse button or touchscreen is currently pressed down.
   */
  function isPressed(): boolean;
  /**
   * Checks whether the left mouse button or touchscreen is released.
   */
  function isReleased(): boolean;
  /**
   * Checks whether the left mouse button or touchscreen is just pressed or a pseudo key repeat occurred.
   */
  function isRepeated(): boolean;
  /**
   * Checks whether the left mouse button or touchscreen is just pressed.
   */
  function isTriggered(): boolean;
  /**
   * Updates the touch data.
   */
  function update(): void;
  const keyRepeatInterval: 6;
  const keyRepeatWait: 24;
  const moveThreshold: 10;
}
