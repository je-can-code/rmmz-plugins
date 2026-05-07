/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ShopBuy
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ShopBuy
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _data: unknown[];
  _money: number;
  _price: unknown[];
  _shopGoods: [number, number, number?, number?][];
  _statusWindow: Window_Base;
  drawItem(index: number): void;
  goodsToItem(goods: [number, number, number?, number?]): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  initialize(rect: Rectangle): void;
  isCurrentItemEnabled(): boolean;
  isEnabled(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  item(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  itemAt(index: number): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  makeItemList(): void;
  maxItems(): number;
  price(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): number;
  priceWidth(): number;
  refresh(): void;
  setMoney(money: number): void;
  setStatusWindow(statusWindow: Window_Base): void;
  setupGoods(shopGoods: [number, number, number?, number?][]): void;
  updateHelp(): void;
}
