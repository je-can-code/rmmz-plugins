/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ShopStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ShopStatus extends Window_StatusBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window_ShopStatus#initialize}.<br/>
   * Written in: {@link Window_ShopStatus#initialize}, {@link Window_ShopStatus#setItem}.<br/>
   * Read in: {@link Window_ShopStatus#drawActorEquipInfo}, {@link Window_ShopStatus#drawActorParamChange}, {@link Window_ShopStatus#drawPossession}, {@link Window_ShopStatus#isEquipItem}, {@link Window_ShopStatus#paramId}, {@link Window_ShopStatus#refresh}.<br/>
   */
  _item: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_ShopStatus#initialize}.<br/>
   * Written in: {@link Window_ShopStatus#changePage}, {@link Window_ShopStatus#initialize}.<br/>
   * Read in: {@link Window_ShopStatus#changePage}, {@link Window_ShopStatus#statusMembers}.<br/>
   */
  _pageIndex: number;
  /**
   * Performs change page.
   */
  changePage(): void;
  /**
   * Gets current equipped item.
   * @param actor The actor parameter.
   * @param etypeId The etypeId parameter.
   * @returns The result.
   */
  currentEquippedItem(actor: unknown, etypeId: unknown): unknown;
  /**
   * Performs draw actor equip info.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param actor The actor parameter.
   */
  drawActorEquipInfo(x: unknown, y: unknown, actor: unknown): void;
  /**
   * Performs draw actor param change.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param actor The actor parameter.
   * @param item1 The item1 parameter.
   */
  drawActorParamChange(x: unknown, y: unknown, actor: unknown, item1: unknown): void;
  /**
   * Performs draw equip info.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawEquipInfo(x: unknown, y: unknown): void;
  /**
   * Performs draw possession.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawPossession(x: unknown, y: unknown): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Determines whether equip item.
   * @returns True if equip item; false otherwise.
   */
  isEquipItem(): boolean;
  /**
   * Determines whether page change enabled.
   * @returns True if page change enabled; false otherwise.
   */
  isPageChangeEnabled(): boolean;
  /**
   * Determines whether page change requested.
   * @returns True if page change requested; false otherwise.
   */
  isPageChangeRequested(): boolean;
  /**
   * Gets max pages.
   * @returns The result.
   */
  maxPages(): unknown;
  /**
   * Gets page size.
   * @returns The result.
   */
  pageSize(): number;
  /**
   * Gets param id.
   * @returns The result.
   */
  paramId(): number;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Sets item.
   * @param item The item parameter.
   */
  setItem(item: unknown): void;
  /**
   * Gets status members.
   * @returns The result.
   */
  statusMembers(): unknown;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates page.
   */
  updatePage(): void;
}
