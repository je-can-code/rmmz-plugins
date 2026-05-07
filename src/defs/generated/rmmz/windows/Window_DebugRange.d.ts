/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_DebugRange
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_DebugRange
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _editWindow: Window_Base;
  _maxSwitches: unknown;
  _maxVariables: unknown;
  drawItem(index: number): void;
  initialize(rect: Rectangle): void;
  isCancelTriggered(): boolean;
  isSwitchMode(index: number): boolean;
  maxItems(): number;
  mode(index: number): string;
  processCancel(): void;
  setEditWindow(editWindow: Window_Base): void;
  topId(index: number): number;
  update(): void;
}
declare namespace Window_DebugRange
{
  const lastIndex: 0;
  const lastTopRow: 0;
}
