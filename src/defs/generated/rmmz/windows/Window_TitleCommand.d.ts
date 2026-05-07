/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_TitleCommand
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_TitleCommand extends Window_Command
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init, {@link Window_TitleCommand#initCommandPosition}.<br/>
   * Read in: none.<br/>
   */
  _lastCommandSymbol: null;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Determines whether continue enabled.
   * @returns True if continue enabled; false otherwise.
   */
  isContinueEnabled(): boolean;
  /**
   * Creates command list.
   */
  makeCommandList(): void;
  /**
   * Performs process ok.
   */
  processOk(): void;
  /**
   * Performs select last.
   */
  selectLast(): void;
}
declare namespace Window_TitleCommand
{
  /**
   * Initializes command position.
   */
  function initCommandPosition(): void;
}
