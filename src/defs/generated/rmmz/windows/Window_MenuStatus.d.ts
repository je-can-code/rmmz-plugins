/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_MenuStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_MenuStatus
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _formationMode: boolean;
  _pendingIndex: number;
  actor(index: number): Game_Actor | undefined;
  drawItem(index: number): void;
  drawItemImage(index: number): void;
  drawItemStatus(index: number): void;
  drawPendingItemBackground(index: number): void;
  formationMode(): boolean;
  initialize(rect: Rectangle): void;
  isCurrentItemEnabled(): boolean;
  itemHeight(): number;
  maxItems(): number;
  numVisibleRows(): number;
  pendingIndex(): number;
  processOk(): void;
  selectLast(): void;
  setFormationMode(formationMode: boolean): void;
  setPendingIndex(index: number): void;
}
