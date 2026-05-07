/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_EquipCommand
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_EquipCommand extends Window_HorzCommand
{
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Creates command list.
   */
  makeCommandList(): void;
  /**
   * Gets max cols.
   * @returns The result.
   */
  maxCols(): number;
}
