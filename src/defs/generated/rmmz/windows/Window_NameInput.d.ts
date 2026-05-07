/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_NameInput
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_NameInput
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _editWindow: null | Window_Base;
  _index: number;
  _page: number;
  character(): string;
  cursorDown(wrap: boolean): void;
  cursorLeft(wrap: boolean): void;
  cursorPagedown(): void;
  cursorPageup(): void;
  cursorRight(wrap: boolean): void;
  cursorUp(wrap: boolean): void;
  drawItem(index: number): void;
  groupSpacing(): number;
  initialize(rect: Rectangle): void;
  isCancelEnabled(): boolean;
  isCursorMovable(): boolean;
  isOk(): boolean;
  isPageChange(): boolean;
  itemRect(index: number): Rectangle;
  itemWidth(): number;
  maxCols(): number;
  maxItems(): number;
  onNameAdd(): void;
  onNameOk(): void;
  processBack(): void;
  processCancel(): void;
  processCursorMove(): void;
  processHandling(): void;
  processJump(): void;
  processOk(): void;
  setEditWindow(editWindow: Window_Base): void;
  table(): string[][];
  updateCursor(): void;
}
