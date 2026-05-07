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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_NameBox#setMessageWindow}.<br/>
   * Read in: {@link Window_NameBox#updatePlacement}.<br/>
   */
  _messageWindow: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link Window_NameBox#initialize}.<br/>
   * Written in: {@link Window_NameBox#initialize}, {@link Window_NameBox#setName}.<br/>
   * Read in: {@link Window_NameBox#refresh}, {@link Window_NameBox#setName}, {@link Window_NameBox#windowWidth}.<br/>
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
  setMessageWindow(messageWindow: unknown): void;
  /**
   * Sets name.
   * @param name The name parameter.
   */
  setName(name: unknown): void;
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
  windowHeight(): unknown;
  /**
   * Gets window width.
   * @returns The result.
   */
  windowWidth(): number;
}
