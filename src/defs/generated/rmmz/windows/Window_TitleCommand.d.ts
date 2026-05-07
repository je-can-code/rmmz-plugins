/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_TitleCommand
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_TitleCommand
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _lastCommandSymbol: null;
  initialize(rect: Rectangle): void;
  isContinueEnabled(): boolean;
  makeCommandList(): void;
  processOk(): void;
  selectLast(): void;
}
declare namespace Window_TitleCommand
{
  function initCommandPosition(): void;
}
