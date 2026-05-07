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
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_ShopBuy#setupGoods}.<br/>
   * Read in: {@link Window_ShopBuy#makeItemList}.<br/>
   */
  _shopGoods: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_ShopBuy#setStatusWindow}.<br/>
   * Read in: {@link Window_ShopBuy#updateHelp}.<br/>
   */
  _statusWindow: unknown;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: unknown): void;
  /**
   * Gets goods to item.
   * @param goods The goods parameter.
   * @returns The result.
   */
  goodsToItem(goods: unknown): null;
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
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Gets price.
   * @param item The item parameter.
   * @returns The result.
   */
  price(item: unknown): number;
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
  setMoney(money: unknown): void;
  /**
   * Sets status window.
   * @param statusWindow The statusWindow parameter.
   */
  setStatusWindow(statusWindow: unknown): void;
  /**
   * Performs setup goods.
   * @param shopGoods The shopGoods parameter.
   */
  setupGoods(shopGoods: unknown): void;
  /**
   * Updates help.
   */
  updateHelp(): void;
}
