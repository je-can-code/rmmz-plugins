/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ItemCategory
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ItemCategory
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _itemWindow: Window_Base;
  initialize(rect: Rectangle): void;
  makeCommandList(): void;
  maxCols(): number;
  needsCommand(name: string): boolean;
  needsSelection(): boolean;
  setItemWindow(itemWindow: Window_Base): void;
  update(): void;
}
