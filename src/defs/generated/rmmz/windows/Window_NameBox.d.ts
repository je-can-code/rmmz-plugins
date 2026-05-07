/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_NameBox
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_NameBox extends Window_Base
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Base`.
   * Initialized in: none.
   * Written in: {@link Window_NameBox#setMessageWindow}.
   * Read in: {@link Window_NameBox#updatePlacement}.
   */
  _messageWindow: Window_Base;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: {@link Window_NameBox#initialize}.
   * Written in: {@link Window_NameBox#initialize}, {@link Window_NameBox#setName}.
   * Read in: {@link Window_NameBox#refresh}, {@link Window_NameBox#setName}, {@link Window_NameBox#windowWidth}.
   */
  _name: string;
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Sets message window.
   * @param messageWindow The messageWindow parameter.
   */
  setMessageWindow(messageWindow: Window_Base): void;
  /**
   * Sets name.
   * @param name The name parameter.
   */
  setName(name: string): void;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Updates background.
   */
  updateBackground(): void;
  /**
   * Updates placement.
   */
  updatePlacement(): void;
  /**
   * Gets window height.
   * @returns The result.
   */
  windowHeight(): number;
  /**
   * Gets window width.
   * @returns The result.
   */
  windowWidth(): number;
}
