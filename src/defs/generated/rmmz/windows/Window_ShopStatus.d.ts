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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _item: null | RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor;
  _pageIndex: number;
  changePage(): void;
  currentEquippedItem(actor: Game_Actor, etypeId: number): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  drawActorEquipInfo(x: number, y: number, actor: Game_Actor): void;
  drawActorParamChange(x: number, y: number, actor: Game_Actor, item1: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  drawEquipInfo(x: number, y: number): void;
  drawPossession(x: number, y: number): void;
  initialize(rect: Rectangle): void;
  isEquipItem(): boolean;
  isPageChangeEnabled(): boolean;
  isPageChangeRequested(): boolean;
  maxPages(): number;
  pageSize(): number;
  paramId(): number;
  refresh(): void;
  setItem(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  statusMembers(): Game_Actor[];
  update(): void;
  updatePage(): void;
}
