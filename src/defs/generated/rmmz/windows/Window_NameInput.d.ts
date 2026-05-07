/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_NameInput
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_NameInput extends Window_Selectable
{
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Window_Base`.
   * Initialized in: {@link Window_NameInput#initialize}.
   * Written in: {@link Window_NameInput#initialize}, {@link Window_NameInput#setEditWindow}.
   * Read in: {@link Window_NameInput#onNameAdd}, {@link Window_NameInput#onNameOk}, {@link Window_NameInput#processBack}.
   */
  _editWindow: null | Window_Base;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_NameInput#initialize}.
   * Written in: {@link Window_NameInput#cursorDown}, {@link Window_NameInput#cursorLeft}, {@link Window_NameInput#cursorRight}, {@link Window_NameInput#cursorUp}, {@link Window_NameInput#initialize}, {@link Window_NameInput#processJump}.
   * Read in: {@link Window_NameInput#character}, {@link Window_NameInput#cursorDown}, {@link Window_NameInput#cursorLeft}, {@link Window_NameInput#cursorRight}, {@link Window_NameInput#cursorUp}, {@link Window_NameInput#isOk}, {@link Window_NameInput#isPageChange}, {@link Window_NameInput#processJump}, {@link Window_NameInput#updateCursor}.
   */
  _index: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_NameInput#initialize}.
   * Written in: {@link Window_NameInput#cursorPagedown}, {@link Window_NameInput#cursorPageup}, {@link Window_NameInput#initialize}.
   * Read in: {@link Window_NameInput#character}, {@link Window_NameInput#cursorPagedown}, {@link Window_NameInput#cursorPageup}, {@link Window_NameInput#drawItem}, {@link Window_NameInput#processCursorMove}.
   */
  _page: number;
  /**
   * Gets character.
   * @returns The result.
   */
  character(): string;
  /**
   * Performs cursor down.
   * @param wrap The wrap parameter.
   */
  cursorDown(wrap: boolean): void;
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
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: number): void;
  /**
   * Gets group spacing.
   * @returns The result.
   */
  groupSpacing(): number;
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
   * Determines whether cursor movable.
   * @returns True if cursor movable; false otherwise.
   */
  isCursorMovable(): boolean;
  /**
   * Determines whether ok.
   * @returns True if ok; false otherwise.
   */
  isOk(): boolean;
  /**
   * Determines whether page change.
   * @returns True if page change; false otherwise.
   */
  isPageChange(): boolean;
  /**
   * Gets item rect.
   * @param index The index parameter.
   * @returns The result.
   */
  itemRect(index: number): Rectangle;
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
   * Performs on name add.
   */
  onNameAdd(): void;
  /**
   * Performs on name ok.
   */
  onNameOk(): void;
  /**
   * Performs process back.
   */
  processBack(): void;
  /**
   * Performs process cancel.
   */
  processCancel(): void;
  /**
   * Performs process cursor move.
   */
  processCursorMove(): void;
  /**
   * Performs process handling.
   */
  processHandling(): void;
  /**
   * Performs process jump.
   */
  processJump(): void;
  /**
   * Performs process ok.
   */
  processOk(): void;
  /**
   * Sets edit window.
   * @param editWindow The editWindow parameter.
   */
  setEditWindow(editWindow: Window_Base): void;
  /**
   * Gets table.
   * @returns The result.
   */
  table(): string[][];
  /**
   * Updates cursor.
   */
  updateCursor(): void;
}
