/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ShopNumber
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ShopNumber
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _buttons: unknown[];
  _canRepeat: boolean;
  _currencyUnit: string;
  _item: null | RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor;
  _max: number;
  _number: number;
  _price: number;
  buttonSpacing(): number;
  buttonY(): number;
  changeNumber(amount: number): void;
  createButtons(): void;
  cursorWidth(): number;
  cursorX(): number;
  drawCurrentItemName(): void;
  drawHorzLine(): void;
  drawMultiplicationSign(): void;
  drawNumber(): void;
  drawTotalPrice(): void;
  initialize(rect: Rectangle): void;
  isScrollEnabled(): boolean;
  isTouchOkEnabled(): boolean;
  itemNameY(): number;
  itemRect(): Rectangle;
  maxDigits(): number;
  multiplicationSign(): string;
  multiplicationSignX(): number;
  number(): number;
  onButtonDown(): void;
  onButtonDown2(): void;
  onButtonOk(): void;
  onButtonUp(): void;
  onButtonUp2(): void;
  placeButtons(): void;
  playOkSound(): void;
  processNumberChange(): void;
  refresh(): void;
  setCurrencyUnit(currencyUnit: string): void;
  setup(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, max: number, price: number): void;
  totalButtonWidth(): number;
  totalPriceY(): number;
  update(): void;
}
