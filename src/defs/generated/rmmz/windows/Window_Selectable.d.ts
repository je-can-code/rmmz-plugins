/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Selectable
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Selectable
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _canRepeat: boolean;
  _cursorAll: boolean;
  _cursorFixed: boolean;
  _doubleTouch: boolean;
  _handlers: object;
  _helpWindow: null | Window_Base;
  _index: number;
  activate(): void;
  callCancelHandler(): void;
  callHandler(_symbol: string): void;
  callOkHandler(): void;
  callUpdateHelp(): void;
  clearItem(index: number): void;
  colSpacing(): number;
  contentsHeight(): number;
  cursorAll(): boolean;
  cursorDown(wrap: boolean): void;
  cursorFixed(): boolean;
  cursorLeft(wrap: boolean): void;
  cursorPagedown(): void;
  cursorPageup(): void;
  cursorRight(wrap: boolean): void;
  cursorUp(wrap: boolean): void;
  deactivate(): void;
  deselect(): void;
  drawAllItems(): void;
  drawBackgroundRect(rect: Rectangle): void;
  drawItem(): void;
  drawItemBackground(index: number): void;
  ensureCursorVisible(smooth: boolean): void;
  forceSelect(index: number): void;
  hideHelpWindow(): void;
  hitIndex(): number;
  hitTest(x: number, y: number): number;
  index(): number;
  initialize(rect: Rectangle): void;
  isCancelEnabled(): boolean;
  isCancelTriggered(): boolean;
  isCurrentItemEnabled(): boolean;
  isCursorMovable(): boolean;
  isHandled(_symbol: string): boolean;
  isHorizontal(): boolean;
  isHoverEnabled(): boolean;
  isOkEnabled(): boolean;
  isOkTriggered(): boolean;
  isOpenAndActive(): boolean;
  isScrollEnabled(): boolean;
  isTouchOkEnabled(): boolean;
  itemHeight(): number;
  itemLineRect(index: number): Rectangle;
  itemRect(index: number): Rectangle;
  itemRectWithPadding(index: number): Rectangle;
  itemWidth(): number;
  maxCols(): number;
  maxItems(): number;
  maxPageItems(): number;
  maxPageRows(): number;
  maxRows(): number;
  maxTopRow(): number;
  maxVisibleItems(): number;
  onTouchCancel(): void;
  onTouchOk(): void;
  onTouchSelect(trigger: boolean): void;
  overallHeight(): number;
  paint(): void;
  processCancel(): void;
  processCursorMove(): void;
  processHandling(): boolean;
  processOk(): void;
  processPagedown(): void;
  processPageup(): void;
  processTouch(): void;
  redrawCurrentItem(): void;
  redrawItem(index: number): void;
  refresh(): void;
  refreshCursor(): void;
  refreshCursorForAll(): void;
  reselect(): void;
  row(): number;
  rowSpacing(): number;
  select(index: number): void;
  setCursorAll(cursorAll: boolean): void;
  setCursorFixed(cursorFixed: boolean): void;
  setHandler(_symbol: string, method: () => void): void;
  setHelpWindow(helpWindow: Window_Base): void;
  setHelpWindowItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  setTopRow(row: number): void;
  showHelpWindow(): void;
  smoothSelect(index: number): void;
  topIndex(): number;
  topRow(): number;
  update(): void;
  updateHelp(): void;
  updateInputData(): void;
}
