/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Selectable
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Selectable extends Window_Scrollable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_Selectable#initialize}.<br/>
   * Written in: {@link Window_Selectable#initialize}.<br/>
   * Read in: {@link Window_Selectable#isOkTriggered}.<br/>
   */
  _canRepeat: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_Selectable#initialize}.<br/>
   * Written in: {@link Window_Selectable#initialize}, {@link Window_Selectable#setCursorAll}.<br/>
   * Read in: {@link Window_Selectable#cursorAll}, {@link Window_Selectable#ensureCursorVisible}, {@link Window_Selectable#isCursorMovable}, {@link Window_Selectable#isTouchOkEnabled}, {@link Window_Selectable#refreshCursor}.<br/>
   */
  _cursorAll: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_Selectable#initialize}.<br/>
   * Written in: {@link Window_Selectable#initialize}, {@link Window_Selectable#setCursorFixed}.<br/>
   * Read in: {@link Window_Selectable#cursorFixed}, {@link Window_Selectable#isCursorMovable}, {@link Window_Selectable#isTouchOkEnabled}, {@link Window_Selectable#onTouchOk}.<br/>
   */
  _cursorFixed: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_Selectable#initialize}.<br/>
   * Written in: {@link Window_Selectable#initialize}, {@link Window_Selectable#onTouchSelect}.<br/>
   * Read in: {@link Window_Selectable#isTouchOkEnabled}.<br/>
   */
  _doubleTouch: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `RPG_WindowSelectableHandlers`.<br/>
   * Initialized in: {@link Window_Selectable#initialize}.<br/>
   * Written in: {@link Window_Selectable#initialize}.<br/>
   * Read in: {@link Window_Selectable#callHandler}, {@link Window_Selectable#isHandled}, {@link Window_Selectable#setHandler}.<br/>
   */
  _handlers: RPG_WindowSelectableHandlers;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window_Selectable#initialize}.<br/>
   * Written in: {@link Window_Selectable#initialize}, {@link Window_Selectable#setHelpWindow}.<br/>
   * Read in: {@link Window_Selectable#callUpdateHelp}, {@link Window_Selectable#hideHelpWindow}, {@link Window_Selectable#setHelpWindowItem}, {@link Window_Selectable#showHelpWindow}, {@link Window_Selectable#updateHelp}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `clear()`: {@link Window_Selectable#updateHelp}.<br/>
   */
  _helpWindow: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_Selectable#initialize}.<br/>
   * Written in: {@link Window_Selectable#initialize}, {@link Window_Selectable#select}.<br/>
   * Read in: {@link Window_Selectable#index}, {@link Window_Selectable#reselect}.<br/>
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
  callHandler(_symbol: unknown): void;
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
  clearItem(index: unknown): void;
  /**
   * Gets col spacing.
   * @returns The result.
   */
  colSpacing(): number;
  /**
   * Gets contents height.
   * @returns The result.
   */
  contentsHeight(): unknown;
  /**
   * Gets cursor all.
   * @returns The result.
   */
  cursorAll(): unknown;
  /**
   * Performs cursor down.
   * @param wrap The wrap parameter.
   */
  cursorDown(wrap: unknown): void;
  /**
   * Gets cursor fixed.
   * @returns The result.
   */
  cursorFixed(): unknown;
  /**
   * Performs cursor left.
   * @param wrap The wrap parameter.
   */
  cursorLeft(wrap: unknown): void;
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
  cursorRight(wrap: unknown): void;
  /**
   * Performs cursor up.
   * @param wrap The wrap parameter.
   */
  cursorUp(wrap: unknown): void;
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
  drawBackgroundRect(rect: unknown): void;
  /**
   * Performs draw item.
   */
  drawItem(): void;
  /**
   * Performs draw item background.
   * @param index The index parameter.
   */
  drawItemBackground(index: unknown): void;
  /**
   * Performs ensure cursor visible.
   * @param smooth The smooth parameter.
   */
  ensureCursorVisible(smooth: unknown): void;
  /**
   * Performs force select.
   * @param index The index parameter.
   */
  forceSelect(index: unknown): void;
  /**
   * Performs hide help window.
   */
  hideHelpWindow(): void;
  /**
   * Gets hit index.
   * @returns The result.
   */
  hitIndex(): unknown;
  /**
   * Gets hit test.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  hitTest(x: unknown, y: unknown): unknown;
  /**
   * Gets index.
   * @returns The result.
   */
  index(): unknown;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
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
  isHandled(_symbol: unknown): boolean;
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
  itemHeight(): unknown;
  /**
   * Gets item line rect.
   * @param index The index parameter.
   * @returns The result.
   */
  itemLineRect(index: unknown): unknown;
  /**
   * Gets item rect.
   * @param index The index parameter.
   * @returns The result.
   */
  itemRect(index: unknown): Rectangle;
  /**
   * Gets item rect with padding.
   * @param index The index parameter.
   * @returns The result.
   */
  itemRectWithPadding(index: unknown): unknown;
  /**
   * Gets item width.
   * @returns The result.
   */
  itemWidth(): unknown;
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
  maxPageItems(): unknown;
  /**
   * Gets max page rows.
   * @returns The result.
   */
  maxPageRows(): unknown;
  /**
   * Gets max rows.
   * @returns The result.
   */
  maxRows(): unknown;
  /**
   * Gets max top row.
   * @returns The result.
   */
  maxTopRow(): unknown;
  /**
   * Gets max visible items.
   * @returns The result.
   */
  maxVisibleItems(): unknown;
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
  onTouchSelect(trigger: unknown): void;
  /**
   * Gets overall height.
   * @returns The result.
   */
  overallHeight(): unknown;
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
  processHandling(): unknown;
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
  redrawItem(index: unknown): void;
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
  row(): unknown;
  /**
   * Gets row spacing.
   * @returns The result.
   */
  rowSpacing(): number;
  /**
   * Performs select.
   * @param index The index parameter.
   */
  select(index: unknown): void;
  /**
   * Sets cursor all.
   * @param cursorAll The cursorAll parameter.
   */
  setCursorAll(cursorAll: unknown): void;
  /**
   * Sets cursor fixed.
   * @param cursorFixed The cursorFixed parameter.
   */
  setCursorFixed(cursorFixed: unknown): void;
  /**
   * Sets handler.
   * @param _symbol The symbol parameter.
   * @param method The method parameter.
   */
  setHandler(_symbol: unknown, method: unknown): void;
  /**
   * Sets help window.
   * @param helpWindow The helpWindow parameter.
   */
  setHelpWindow(helpWindow: unknown): void;
  /**
   * Sets help window item.
   * @param item The item parameter.
   */
  setHelpWindowItem(item: unknown): void;
  /**
   * Sets top row.
   * @param row The row parameter.
   */
  setTopRow(row: unknown): void;
  /**
   * Performs show help window.
   */
  showHelpWindow(): void;
  /**
   * Performs smooth select.
   * @param index The index parameter.
   */
  smoothSelect(index: unknown): void;
  /**
   * Gets top index.
   * @returns The result.
   */
  topIndex(): unknown;
  /**
   * Gets top row.
   * @returns The result.
   */
  topRow(): unknown;
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
