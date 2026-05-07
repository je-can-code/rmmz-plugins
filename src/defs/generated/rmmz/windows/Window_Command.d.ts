/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Command
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Command
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _list: unknown[];
  addCommand(name: string, _symbol: string, enabled?: boolean, ext?: object | string | number | boolean | null): void;
  callOkHandler(): void;
  clearCommandList(): void;
  commandName(index: number): string;
  commandSymbol(index: number): string;
  currentData(): { name: string; symbol: string; enabled: boolean; ext: object | string | number | boolean | null } | null;
  currentExt(): object | string | number | boolean | null | null;
  currentSymbol(): string | null;
  drawItem(index: number): void;
  findExt(ext: object | string | number | boolean | null): number;
  findSymbol(_symbol: string): number;
  initialize(rect: Rectangle): void;
  isCommandEnabled(index: number): boolean;
  isCurrentItemEnabled(): boolean;
  isOkEnabled(): boolean;
  itemTextAlign(): string;
  makeCommandList(): void;
  maxItems(): number;
  refresh(): void;
  selectExt(ext: object | string | number | boolean | null): void;
  selectSymbol(_symbol: string): void;
}
