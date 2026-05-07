/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_DebugEdit
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_DebugEdit
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _mode: string;
  _topId: number;
  currentId(): number;
  deltaForVariable(): number;
  drawItem(index: number): void;
  initialize(rect: Rectangle): void;
  itemName(dataId: number): string;
  itemStatus(dataId: number): string;
  maxItems(): number;
  setMode(mode: string): void;
  setTopId(id: number): void;
  update(): void;
  updateSwitch(): void;
  updateVariable(): void;
}
