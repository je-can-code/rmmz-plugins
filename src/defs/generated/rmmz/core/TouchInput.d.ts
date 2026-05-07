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
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link TouchInput#clear}, {@link TouchInput#update}.
   * Read in: {@link TouchInput#isClicked}.
   */
  _clicked: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link TouchInput#clear}, {@link TouchInput#update}.
   * Read in: {@link TouchInput#isCancelled}, {@link TouchInput#isHovered}, {@link TouchInput#isMoved}, {@link TouchInput#isReleased}, {@link TouchInput#isRepeated}, {@link TouchInput#isTriggered}, {@link TouchInput#update}.
   */
  _currentState: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link TouchInput#_onTrigger}, {@link TouchInput#clear}.
   * Read in: none.
   */
  _date: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link TouchInput#_onLeftButtonDown}, {@link TouchInput#_onMouseUp}, {@link TouchInput#clear}.
   * Read in: {@link TouchInput#_onMouseMove}, {@link TouchInput#isPressed}.
   */
  _mousePressed: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link TouchInput#_onMove}, {@link TouchInput#_onTrigger}, {@link TouchInput#clear}.
   * Read in: {@link TouchInput#_onMove}, {@link TouchInput#update}.
   */
  _moved: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: none.
   * Written in: {@link TouchInput#clear}, {@link TouchInput#update}.
   * Read in: {@link TouchInput#_onCancel}, {@link TouchInput#_onHover}, {@link TouchInput#_onMove}, {@link TouchInput#_onRelease}, {@link TouchInput#_onTrigger}, {@link TouchInput#_onWheel}, {@link TouchInput#update}.
   */
  _newState: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link TouchInput#_onLeftButtonDown}, {@link TouchInput#_onTouchStart}, {@link TouchInput#clear}, {@link TouchInput#update}.
   * Read in: {@link TouchInput#isLongPressed}, {@link TouchInput#isRepeated}.
   */
  _pressedTime: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link TouchInput#_onTouchCancel}, {@link TouchInput#_onTouchEnd}, {@link TouchInput#_onTouchStart}, {@link TouchInput#clear}.
   * Read in: {@link TouchInput#isPressed}.
   */
  _screenPressed: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link TouchInput#_onTrigger}, {@link TouchInput#clear}.
   * Read in: {@link TouchInput#_onMove}.
   */
  _triggerX: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link TouchInput#_onTrigger}, {@link TouchInput#clear}.
   * Read in: {@link TouchInput#_onMove}.
   */
  _triggerY: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link TouchInput#_onCancel}, {@link TouchInput#_onHover}, {@link TouchInput#_onMove}, {@link TouchInput#_onRelease}, {@link TouchInput#_onTrigger}, {@link TouchInput#clear}.
   * Read in: none.
   */
  _x: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link TouchInput#_onCancel}, {@link TouchInput#_onHover}, {@link TouchInput#_onMove}, {@link TouchInput#_onRelease}, {@link TouchInput#_onTrigger}, {@link TouchInput#clear}.
   * Read in: none.
   */
  _y: number;
}
declare function TouchInput(): never;
declare namespace TouchInput
{
  /**
   * The time of the last input in milliseconds.
   * @returns The result.
   */
  function _createNewState(): object;
  /**
   * Performs on cancel.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  function _onCancel(x: number, y: number): void;
  /**
   * Performs on hover.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  function _onHover(x: number, y: number): void;
  /**
   * Performs on left button down.
   * @param event The event parameter.
   */
  function _onLeftButtonDown(event: MouseEvent): void;
  /**
   * Performs on lost focus.
   */
  function _onLostFocus(): void;
  /**
   * Performs on middle button down.
   */
  function _onMiddleButtonDown(): void;
  /**
   * Performs on mouse down.
   * @param event The event parameter.
   */
  function _onMouseDown(event: MouseEvent): void;
  /**
   * Performs on mouse move.
   * @param event The event parameter.
   */
  function _onMouseMove(event: MouseEvent): void;
  /**
   * Performs on mouse up.
   * @param event The event parameter.
   */
  function _onMouseUp(event: MouseEvent): void;
  /**
   * Performs on move.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  function _onMove(x: number, y: number): void;
  /**
   * Performs on release.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  function _onRelease(x: number, y: number): void;
  /**
   * Performs on right button down.
   * @param event The event parameter.
   */
  function _onRightButtonDown(event: MouseEvent): void;
  /**
   * Performs on touch cancel.
   */
  function _onTouchCancel(): void;
  /**
   * Performs on touch end.
   * @param event The event parameter.
   */
  function _onTouchEnd(event: TouchEvent): void;
  /**
   * Performs on touch move.
   * @param event The event parameter.
   */
  function _onTouchMove(event: TouchEvent): void;
  /**
   * Performs on touch start.
   * @param event The event parameter.
   */
  function _onTouchStart(event: TouchEvent): void;
  /**
   * Performs on trigger.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  function _onTrigger(x: number, y: number): void;
  /**
   * Performs on wheel.
   * @param event The event parameter.
   */
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
   * @returns True if cancelled; false otherwise.
   */
  function isCancelled(): boolean;
  /**
   * Checks whether the mouse button or touchscreen has been pressed and released at the same position.
   * @returns True if clicked; false otherwise.
   */
  function isClicked(): boolean;
  /**
   * Checks whether the mouse is moved without pressing a button.
   * @returns True if hovered; false otherwise.
   */
  function isHovered(): boolean;
  /**
   * Checks whether the left mouse button or touchscreen is kept depressed.
   * @returns True if long pressed; false otherwise.
   */
  function isLongPressed(): boolean;
  /**
   * Checks whether the mouse or a finger on the touchscreen is moved.
   * @returns True if moved; false otherwise.
   */
  function isMoved(): boolean;
  /**
   * Checks whether the mouse button or touchscreen is currently pressed down.
   * @returns True if pressed; false otherwise.
   */
  function isPressed(): boolean;
  /**
   * Checks whether the left mouse button or touchscreen is released.
   * @returns True if released; false otherwise.
   */
  function isReleased(): boolean;
  /**
   * Checks whether the left mouse button or touchscreen is just pressed or a pseudo key repeat occurred.
   * @returns True if repeated; false otherwise.
   */
  function isRepeated(): boolean;
  /**
   * Checks whether the left mouse button or touchscreen is just pressed.
   * @returns True if triggered; false otherwise.
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
