/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_MenuCommand
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_MenuCommand
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _canRepeat: boolean;
  _lastCommandSymbol: null;
  addFormationCommand(): void;
  addGameEndCommand(): void;
  addMainCommands(): void;
  addOptionsCommand(): void;
  addOriginalCommands(): void;
  addSaveCommand(): void;
  areMainCommandsEnabled(): boolean;
  initialize(rect: Rectangle): void;
  isFormationEnabled(): boolean;
  isGameEndEnabled(): boolean;
  isOptionsEnabled(): boolean;
  isSaveEnabled(): boolean;
  makeCommandList(): void;
  needsCommand(name: string): boolean;
  processOk(): void;
  selectLast(): void;
}
declare namespace Window_MenuCommand
{
  function initCommandPosition(): void;
}
