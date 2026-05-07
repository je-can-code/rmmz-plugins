/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_MenuActor
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_MenuActor extends Window_MenuStatus
{
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Performs process ok.
   */
  processOk(): void;
  /**
   * Performs select for item.
   * @param item The item parameter.
   */
  selectForItem(item: unknown): void;
  /**
   * Performs select last.
   */
  selectLast(): void;
}
