/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Shop
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Shop
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _buyWindow: Window_ShopBuy;
  _categoryWindow: Window_ItemCategory;
  _commandWindow: Window_ShopCommand;
  _dummyWindow: Window_Base;
  _goldWindow: Window_Gold;
  _goods: [number, number, number?, number?][];
  _item: null;
  _numberWindow: Window_ShopNumber;
  _purchaseOnly: boolean;
  _sellWindow: Window_ShopSell;
  _statusWindow: Window_ShopStatus;
  activateBuyWindow(): void;
  activateSellWindow(): void;
  buyWindowRect(): Rectangle;
  buyingPrice(): number;
  categoryWindowRect(): Rectangle;
  commandBuy(): void;
  commandSell(): void;
  commandWindowRect(): Rectangle;
  create(): void;
  createBuyWindow(): void;
  createCategoryWindow(): void;
  createCommandWindow(): void;
  createDummyWindow(): void;
  createGoldWindow(): void;
  createNumberWindow(): void;
  createSellWindow(): void;
  createStatusWindow(): void;
  currencyUnit(): string;
  doBuy(_number: number): void;
  doSell(_number: number): void;
  dummyWindowRect(): Rectangle;
  endNumberInput(): void;
  goldWindowRect(): Rectangle;
  initialize(): void;
  maxBuy(): number;
  maxSell(): number;
  money(): number;
  numberWindowRect(): Rectangle;
  onBuyCancel(): void;
  onBuyOk(): void;
  onCategoryCancel(): void;
  onCategoryOk(): void;
  onNumberCancel(): void;
  onNumberOk(): void;
  onSellCancel(): void;
  onSellOk(): void;
  prepare(goods: [number, number, number?, number?][], purchaseOnly: boolean): void;
  sellWindowRect(): Rectangle;
  sellingPrice(): number;
  statusWidth(): number;
  statusWindowRect(): Rectangle;
}
