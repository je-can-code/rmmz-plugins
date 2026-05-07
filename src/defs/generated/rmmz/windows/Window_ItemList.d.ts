/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ItemList
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ItemList
{
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: {@link Window_ItemList#initialize}.
   * Written in: {@link Window_ItemList#initialize}, {@link Window_ItemList#setCategory}.
   * Read in: {@link Window_ItemList#includes}, {@link Window_ItemList#needsNumber}, {@link Window_ItemList#setCategory}.
   */
  _category: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Window_ItemList#initialize}.
   * Written in: {@link Window_ItemList#initialize}, {@link Window_ItemList#makeItemList}.
   * Read in: {@link Window_ItemList#itemAt}, {@link Window_ItemList#makeItemList}, {@link Window_ItemList#maxItems}, {@link Window_ItemList#selectLast}.
   *
   * Consumed by:
   * - `.length`: {@link Window_ItemList#maxItems}.
   * - `push()`: {@link Window_ItemList#makeItemList}.
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
  drawItem(index: number): void;
  /**
   * Performs draw item number.
   * @param item The item parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawItemNumber(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, x: number, y: number, width: number): void;
  /**
   * Gets includes.
   * @param item The item parameter.
   * @returns The result.
   */
  includes(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
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
  isEnabled(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Gets item.
   * @returns The result.
   */
  item(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Gets item at.
   * @param index The index parameter.
   * @returns The result.
   */
  itemAt(index: number): null;
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
  numberWidth(): number;
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
  setCategory(category: string): void;
  /**
   * Updates help.
   */
  updateHelp(): void;
}
