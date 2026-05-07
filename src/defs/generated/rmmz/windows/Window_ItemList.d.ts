/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ItemList
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ItemList extends Window_Selectable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link Window_ItemList#initialize}.<br/>
   * Written in: {@link Window_ItemList#initialize}, {@link Window_ItemList#setCategory}.<br/>
   * Read in: {@link Window_ItemList#includes}, {@link Window_ItemList#needsNumber}, {@link Window_ItemList#setCategory}.<br/>
   */
  _category: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: {@link Window_ItemList#initialize}.<br/>
   * Written in: {@link Window_ItemList#initialize}, {@link Window_ItemList#makeItemList}.<br/>
   * Read in: {@link Window_ItemList#itemAt}, {@link Window_ItemList#makeItemList}, {@link Window_ItemList#maxItems}, {@link Window_ItemList#selectLast}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Window_ItemList#maxItems}.<br/>
   * - `push()`: {@link Window_ItemList#makeItemList}.<br/>
   */
  _data: unknown[];
  /**
   * Gets col spacing.
   * @returns The result.
   */
  colSpacing(): number;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: unknown): void;
  /**
   * Performs draw item number.
   * @param item The item parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawItemNumber(item: unknown, x: unknown, y: unknown, width: unknown): void;
  /**
   * Gets includes.
   * @param item The item parameter.
   * @returns The result.
   */
  includes(item: unknown): boolean;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Determines whether current item enabled.
   * @returns True if current item enabled; false otherwise.
   */
  isCurrentItemEnabled(): boolean;
  /**
   * Determines whether enabled.
   * @param item The item parameter.
   * @returns True if enabled; false otherwise.
   */
  isEnabled(item: unknown): boolean;
  /**
   * Gets item.
   * @returns The result.
   */
  item(): unknown;
  /**
   * Gets item at.
   * @param index The index parameter.
   * @returns The result.
   */
  itemAt(index: unknown): null;
  /**
   * Creates item list.
   */
  makeItemList(): void;
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
   * Gets needs number.
   * @returns The result.
   */
  needsNumber(): boolean;
  /**
   * Gets number width.
   * @returns The result.
   */
  numberWidth(): unknown;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs select last.
   */
  selectLast(): void;
  /**
   * Sets category.
   * @param category The category parameter.
   */
  setCategory(category: unknown): void;
  /**
   * Updates help.
   */
  updateHelp(): void;
}
