/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Debug
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Debug
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _debugHelpWindow: Window_Base;
  _editWindow: Window_DebugEdit;
  _rangeWindow: Window_DebugRange;
  create(): void;
  createDebugHelpWindow(): void;
  createEditWindow(): void;
  createRangeWindow(): void;
  debugHelpWindowRect(): Rectangle;
  editWindowRect(): Rectangle;
  helpText(): string;
  initialize(): void;
  needsCancelButton(): boolean;
  onEditCancel(): void;
  onRangeOk(): void;
  rangeWindowRect(): Rectangle;
  refreshHelpWindow(): void;
}
