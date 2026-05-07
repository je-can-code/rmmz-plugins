/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ItemCategory
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ItemCategory extends Window_HorzCommand
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Base`.
   * Initialized in: none.
   * Written in: {@link Window_ItemCategory#setItemWindow}.
   * Read in: {@link Window_ItemCategory#update}.
   */
  _itemWindow: Window_Base;
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
  /**
   * Gets needs command.
   * @param name The name parameter.
   * @returns The result.
   */
  needsCommand(name: string): boolean;
  /**
   * Gets needs selection.
   * @returns The result.
   */
  needsSelection(): boolean;
  /**
   * Sets item window.
   * @param itemWindow The itemWindow parameter.
   */
  setItemWindow(itemWindow: Window_Base): void;
  /**
   * Performs update.
   */
  update(): void;
}
