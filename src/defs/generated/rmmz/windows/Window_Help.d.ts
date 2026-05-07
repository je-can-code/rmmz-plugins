/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Help
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Help extends Window_Base
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link Window_Help#initialize}.<br/>
   * Written in: {@link Window_Help#initialize}, {@link Window_Help#setText}.<br/>
   * Read in: {@link Window_Help#refresh}, {@link Window_Help#setText}.<br/>
   */
  _text: string;
  /**
   * Performs clear.
   */
  clear(): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Sets item.
   * @param item The item parameter.
   */
  setItem(item: unknown): void;
  /**
   * Sets text.
   * @param text The text parameter.
   */
  setText(text: unknown): void;
}
