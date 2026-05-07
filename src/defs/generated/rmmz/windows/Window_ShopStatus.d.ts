/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ShopStatus
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ShopStatus
{
  /**
   * Inferred engine backing field.
   *
   * Type: `null | RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor`.
   * Initialized in: {@link Window_ShopStatus#initialize}.
   * Written in: {@link Window_ShopStatus#initialize}, {@link Window_ShopStatus#setItem}.
   * Read in: {@link Window_ShopStatus#drawActorEquipInfo}, {@link Window_ShopStatus#drawActorParamChange}, {@link Window_ShopStatus#drawPossession}, {@link Window_ShopStatus#isEquipItem}, {@link Window_ShopStatus#paramId}, {@link Window_ShopStatus#refresh}.
   */
  _item: null | RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_ShopStatus#initialize}.
   * Written in: {@link Window_ShopStatus#changePage}, {@link Window_ShopStatus#initialize}.
   * Read in: {@link Window_ShopStatus#changePage}, {@link Window_ShopStatus#statusMembers}.
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
  currentEquippedItem(actor: Game_Actor, etypeId: number): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Performs draw actor equip info.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param actor The actor parameter.
   */
  drawActorEquipInfo(x: number, y: number, actor: Game_Actor): void;
  /**
   * Performs draw actor param change.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param actor The actor parameter.
   * @param item1 The item1 parameter.
   */
  drawActorParamChange(x: number, y: number, actor: Game_Actor, item1: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Performs draw equip info.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawEquipInfo(x: number, y: number): void;
  /**
   * Performs draw possession.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawPossession(x: number, y: number): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
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
  maxPages(): number;
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
  setItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Gets status members.
   * @returns The result.
   */
  statusMembers(): Game_Actor[];
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates page.
   */
  updatePage(): void;
}
