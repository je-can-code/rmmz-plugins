/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_SavefileList
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_SavefileList
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _autosave: boolean;
  _mode: null | string;
  drawContents(info: object, rect: Rectangle): void;
  drawItem(index: number): void;
  drawPartyCharacters(info: object, x: number, y: number): void;
  drawPlaytime(info: object, x: number, y: number, width: number): void;
  drawTitle(savefileId: number, x: number, y: number): void;
  indexToSavefileId(index: number): number;
  initialize(rect: Rectangle): void;
  isEnabled(savefileId: number): boolean;
  itemHeight(): number;
  maxItems(): number;
  numVisibleRows(): number;
  playOkSound(): void;
  savefileId(): number;
  savefileIdToIndex(savefileId: number): number;
  selectSavefile(savefileId: number): void;
  setMode(mode: string, autosave: boolean): void;
}
