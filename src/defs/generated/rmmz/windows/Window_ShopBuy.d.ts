/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ShopBuy
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ShopBuy extends Window_Selectable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_ShopBuy#makeItemList}.<br/>
   * Read in: {@link Window_ShopBuy#isCurrentItemEnabled}, {@link Window_ShopBuy#itemAt}, {@link Window_ShopBuy#makeItemList}, {@link Window_ShopBuy#maxItems}, {@link Window_ShopBuy#price}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Window_ShopBuy#maxItems}.<br/>
   * - `push()`: {@link Window_ShopBuy#makeItemList}.<br/>
   */
  _data: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_ShopBuy#initialize}.<br/>
   * Written in: {@link Window_ShopBuy#initialize}, {@link Window_ShopBuy#setMoney}.<br/>
   * Read in: {@link Window_ShopBuy#isEnabled}.<br/>
   */
  _money: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_ShopBuy#makeItemList}.<br/>
   * Read in: {@link Window_ShopBuy#makeItemList}, {@link Window_ShopBuy#price}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Window_ShopBuy#makeItemList}.<br/>
   */
  _price: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `[number, number, number?, number?][]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_ShopBuy#setupGoods}.<br/>
   * Read in: {@link Window_ShopBuy#makeItemList}.<br/>
   */
  _shopGoods: [number, number, number?, number?][];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_ShopBuy#setStatusWindow}.<br/>
   * Read in: {@link Window_ShopBuy#updateHelp}.<br/>
   */
  _statusWindow: Window_Base;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: number): void;
  /**
   * Gets goods to item.
   * @param goods The goods parameter.
   * @returns The result.
   */
  goodsToItem(goods: [number, number, number?, number?]): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
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
  itemAt(index: number): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  /**
   * Creates item list.
   */
  makeItemList(): void;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Gets price.
   * @param item The item parameter.
   * @returns The result.
   */
  price(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): number;
  /**
   * Gets price width.
   * @returns The result.
   */
  priceWidth(): number;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Sets money.
   * @param money The money parameter.
   */
  setMoney(money: number): void;
  /**
   * Sets status window.
   * @param statusWindow The statusWindow parameter.
   */
  setStatusWindow(statusWindow: Window_Base): void;
  /**
   * Performs setup goods.
   * @param shopGoods The shopGoods parameter.
   */
  setupGoods(shopGoods: [number, number, number?, number?][]): void;
  /**
   * Updates help.
   */
  updateHelp(): void;
}
