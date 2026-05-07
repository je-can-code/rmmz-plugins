/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ShopCommand
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ShopCommand
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _purchaseOnly: boolean;
  initialize(rect: Rectangle): void;
  makeCommandList(): void;
  maxCols(): number;
  setPurchaseOnly(purchaseOnly: boolean): void;
}
