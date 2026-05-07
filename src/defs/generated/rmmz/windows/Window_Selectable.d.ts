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
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Window_Selectable#initialize}.
   * Written in: {@link Window_Selectable#initialize}.
   * Read in: {@link Window_Selectable#isOkTriggered}.
   */
  _canRepeat: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Window_Selectable#initialize}.
   * Written in: {@link Window_Selectable#initialize}, {@link Window_Selectable#setCursorAll}.
   * Read in: {@link Window_Selectable#cursorAll}, {@link Window_Selectable#ensureCursorVisible}, {@link Window_Selectable#isCursorMovable}, {@link Window_Selectable#isTouchOkEnabled}, {@link Window_Selectable#refreshCursor}.
   */
  _cursorAll: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Window_Selectable#initialize}.
   * Written in: {@link Window_Selectable#initialize}, {@link Window_Selectable#setCursorFixed}.
   * Read in: {@link Window_Selectable#cursorFixed}, {@link Window_Selectable#isCursorMovable}, {@link Window_Selectable#isTouchOkEnabled}, {@link Window_Selectable#onTouchOk}.
   */
  _cursorFixed: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Window_Selectable#initialize}.
   * Written in: {@link Window_Selectable#initialize}, {@link Window_Selectable#onTouchSelect}.
   * Read in: {@link Window_Selectable#isTouchOkEnabled}.
   */
  _doubleTouch: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `object`.
   * Initialized in: {@link Window_Selectable#initialize}.
   * Written in: {@link Window_Selectable#initialize}.
   * Read in: {@link Window_Selectable#callHandler}, {@link Window_Selectable#isHandled}, {@link Window_Selectable#setHandler}.
   */
  _handlers: object;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Window_Base`.
   * Initialized in: {@link Window_Selectable#initialize}.
   * Written in: {@link Window_Selectable#initialize}, {@link Window_Selectable#setHelpWindow}.
   * Read in: {@link Window_Selectable#callUpdateHelp}, {@link Window_Selectable#hideHelpWindow}, {@link Window_Selectable#setHelpWindowItem}, {@link Window_Selectable#showHelpWindow}, {@link Window_Selectable#updateHelp}.
   *
   * Consumed by:
   * - `clear()`: {@link Window_Selectable#updateHelp}.
   */
  _helpWindow: null | Window_Base;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_Selectable#initialize}.
   * Written in: {@link Window_Selectable#initialize}, {@link Window_Selectable#select}.
   * Read in: {@link Window_Selectable#index}, {@link Window_Selectable#reselect}.
   */
  _index: number;
  /**
   * Performs activate.
   */
  activate(): void;
  /**
   * Performs call cancel handler.
   */
  callCancelHandler(): void;
  /**
   * Performs call handler.
   * @param _symbol The symbol parameter.
   */
  callHandler(_symbol: string): void;
  /**
   * Performs call ok handler.
   */
  callOkHandler(): void;
  /**
   * Performs call update help.
   */
  callUpdateHelp(): void;
  /**
   * Clears item.
   * @param index The index parameter.
   */
  clearItem(index: number): void;
  /**
   * Gets col spacing.
   * @returns The result.
   */
  colSpacing(): number;
  /**
   * Gets contents height.
   * @returns The result.
   */
  contentsHeight(): number;
  /**
   * Gets cursor all.
   * @returns The result.
   */
  cursorAll(): boolean;
  /**
   * Performs cursor down.
   * @param wrap The wrap parameter.
   */
  cursorDown(wrap: boolean): void;
  /**
   * Gets cursor fixed.
   * @returns The result.
   */
  cursorFixed(): boolean;
  /**
   * Performs cursor left.
   * @param wrap The wrap parameter.
   */
  cursorLeft(wrap: boolean): void;
  /**
   * Performs cursor pagedown.
   */
  cursorPagedown(): void;
  /**
   * Performs cursor pageup.
   */
  cursorPageup(): void;
  /**
   * Performs cursor right.
   * @param wrap The wrap parameter.
   */
  cursorRight(wrap: boolean): void;
  /**
   * Performs cursor up.
   * @param wrap The wrap parameter.
   */
  cursorUp(wrap: boolean): void;
  /**
   * Performs deactivate.
   */
  deactivate(): void;
  /**
   * Performs deselect.
   */
  deselect(): void;
  /**
   * Performs draw all items.
   */
  drawAllItems(): void;
  /**
   * Performs draw background rect.
   * @param rect The rect parameter.
   */
  drawBackgroundRect(rect: Rectangle): void;
  /**
   * Performs draw item.
   */
  drawItem(): void;
  /**
   * Performs draw item background.
   * @param index The index parameter.
   */
  drawItemBackground(index: number): void;
  /**
   * Performs ensure cursor visible.
   * @param smooth The smooth parameter.
   */
  ensureCursorVisible(smooth: boolean): void;
  /**
   * Performs force select.
   * @param index The index parameter.
   */
  forceSelect(index: number): void;
  /**
   * Performs hide help window.
   */
  hideHelpWindow(): void;
  /**
   * Gets hit index.
   * @returns The result.
   */
  hitIndex(): number;
  /**
   * Gets hit test.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  hitTest(x: number, y: number): number;
  /**
   * Gets index.
   * @returns The result.
   */
  index(): number;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether cancel enabled.
   * @returns True if cancel enabled; false otherwise.
   */
  isCancelEnabled(): boolean;
  /**
   * Determines whether cancel triggered.
   * @returns True if cancel triggered; false otherwise.
   */
  isCancelTriggered(): boolean;
  /**
   * Determines whether current item enabled.
   * @returns True if current item enabled; false otherwise.
   */
  isCurrentItemEnabled(): boolean;
  /**
   * Determines whether cursor movable.
   * @returns True if cursor movable; false otherwise.
   */
  isCursorMovable(): boolean;
  /**
   * Determines whether handled.
   * @param _symbol The symbol parameter.
   * @returns True if handled; false otherwise.
   */
  isHandled(_symbol: string): boolean;
  /**
   * Determines whether horizontal.
   * @returns True if horizontal; false otherwise.
   */
  isHorizontal(): boolean;
  /**
   * Determines whether hover enabled.
   * @returns True if hover enabled; false otherwise.
   */
  isHoverEnabled(): boolean;
  /**
   * Determines whether ok enabled.
   * @returns True if ok enabled; false otherwise.
   */
  isOkEnabled(): boolean;
  /**
   * Determines whether ok triggered.
   * @returns True if ok triggered; false otherwise.
   */
  isOkTriggered(): boolean;
  /**
   * Determines whether open and active.
   * @returns True if open and active; false otherwise.
   */
  isOpenAndActive(): boolean;
  /**
   * Determines whether scroll enabled.
   * @returns True if scroll enabled; false otherwise.
   */
  isScrollEnabled(): boolean;
  /**
   * Determines whether touch ok enabled.
   * @returns True if touch ok enabled; false otherwise.
   */
  isTouchOkEnabled(): boolean;
  /**
   * Gets item height.
   * @returns The result.
   */
  itemHeight(): number;
  /**
   * Gets item line rect.
   * @param index The index parameter.
   * @returns The result.
   */
  itemLineRect(index: number): Rectangle;
  /**
   * Gets item rect.
   * @param index The index parameter.
   * @returns The result.
   */
  itemRect(index: number): Rectangle;
  /**
   * Gets item rect with padding.
   * @param index The index parameter.
   * @returns The result.
   */
  itemRectWithPadding(index: number): Rectangle;
  /**
   * Gets item width.
   * @returns The result.
   */
  itemWidth(): number;
  /**
   * Gets max cols.
   * @returns The result.
   */
  maxCols(): number;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Gets max page items.
   * @returns The result.
   */
  maxPageItems(): number;
  /**
   * Gets max page rows.
   * @returns The result.
   */
  maxPageRows(): number;
  /**
   * Gets max rows.
   * @returns The result.
   */
  maxRows(): number;
  /**
   * Gets max top row.
   * @returns The result.
   */
  maxTopRow(): number;
  /**
   * Gets max visible items.
   * @returns The result.
   */
  maxVisibleItems(): number;
  /**
   * Performs on touch cancel.
   */
  onTouchCancel(): void;
  /**
   * Performs on touch ok.
   */
  onTouchOk(): void;
  /**
   * Performs on touch select.
   * @param trigger The trigger parameter.
   */
  onTouchSelect(trigger: boolean): void;
  /**
   * Gets overall height.
   * @returns The result.
   */
  overallHeight(): number;
  /**
   * Performs paint.
   */
  paint(): void;
  /**
   * Performs process cancel.
   */
  processCancel(): void;
  /**
   * Performs process cursor move.
   */
  processCursorMove(): void;
  /**
   * Gets process handling.
   * @returns The result.
   */
  processHandling(): boolean;
  /**
   * Performs process ok.
   */
  processOk(): void;
  /**
   * Performs process pagedown.
   */
  processPagedown(): void;
  /**
   * Performs process pageup.
   */
  processPageup(): void;
  /**
   * Performs process touch.
   */
  processTouch(): void;
  /**
   * Performs redraw current item.
   */
  redrawCurrentItem(): void;
  /**
   * Performs redraw item.
   * @param index The index parameter.
   */
  redrawItem(index: number): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs refresh cursor.
   */
  refreshCursor(): void;
  /**
   * Performs refresh cursor for all.
   */
  refreshCursorForAll(): void;
  /**
   * Performs reselect.
   */
  reselect(): void;
  /**
   * Gets row.
   * @returns The result.
   */
  row(): number;
  /**
   * Gets row spacing.
   * @returns The result.
   */
  rowSpacing(): number;
  /**
   * Performs select.
   * @param index The index parameter.
   */
  select(index: number): void;
  /**
   * Sets cursor all.
   * @param cursorAll The cursorAll parameter.
   */
  setCursorAll(cursorAll: boolean): void;
  /**
   * Sets cursor fixed.
   * @param cursorFixed The cursorFixed parameter.
   */
  setCursorFixed(cursorFixed: boolean): void;
  /**
   * Sets handler.
   * @param _symbol The symbol parameter.
   * @param method The method parameter.
   */
  setHandler(_symbol: string, method: () => void): void;
  /**
   * Sets help window.
   * @param helpWindow The helpWindow parameter.
   */
  setHelpWindow(helpWindow: Window_Base): void;
  /**
   * Sets help window item.
   * @param item The item parameter.
   */
  setHelpWindowItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Sets top row.
   * @param row The row parameter.
   */
  setTopRow(row: number): void;
  /**
   * Performs show help window.
   */
  showHelpWindow(): void;
  /**
   * Performs smooth select.
   * @param index The index parameter.
   */
  smoothSelect(index: number): void;
  /**
   * Gets top index.
   * @returns The result.
   */
  topIndex(): number;
  /**
   * Gets top row.
   * @returns The result.
   */
  topRow(): number;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates help.
   */
  updateHelp(): void;
  /**
   * Updates input data.
   */
  updateInputData(): void;
}
