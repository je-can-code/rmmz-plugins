/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Shop
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Shop extends Scene_MenuBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_ShopBuy`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#createBuyWindow}.<br/>
   * Read in: {@link Scene_Shop#activateBuyWindow}, {@link Scene_Shop#buyingPrice}, {@link Scene_Shop#createBuyWindow}, {@link Scene_Shop#onBuyCancel}, {@link Scene_Shop#onBuyOk}.<br/>
   */
  _buyWindow: Window_ShopBuy;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_ItemCategory`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#createCategoryWindow}.<br/>
   * Read in: {@link Scene_Shop#activateSellWindow}, {@link Scene_Shop#commandSell}, {@link Scene_Shop#createCategoryWindow}, {@link Scene_Shop#createSellWindow}, {@link Scene_Shop#onCategoryCancel}, {@link Scene_Shop#onSellCancel}, {@link Scene_Shop#onSellOk}, {@link Scene_Shop#sellWindowRect}.<br/>
   */
  _categoryWindow: Window_ItemCategory;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_ShopCommand`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#createCommandWindow}.<br/>
   * Read in: {@link Scene_Shop#createCommandWindow}, {@link Scene_Shop#dummyWindowRect}, {@link Scene_Shop#endNumberInput}, {@link Scene_Shop#onBuyCancel}, {@link Scene_Shop#onCategoryCancel}, {@link Scene_Shop#onNumberOk}, {@link Scene_Shop#sellWindowRect}.<br/>
   */
  _commandWindow: Window_ShopCommand;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#createDummyWindow}.<br/>
   * Read in: {@link Scene_Shop#buyWindowRect}, {@link Scene_Shop#categoryWindowRect}, {@link Scene_Shop#commandBuy}, {@link Scene_Shop#commandSell}, {@link Scene_Shop#createDummyWindow}, {@link Scene_Shop#numberWindowRect}, {@link Scene_Shop#onBuyCancel}, {@link Scene_Shop#onCategoryCancel}, {@link Scene_Shop#statusWindowRect}.<br/>
   */
  _dummyWindow: Window_Base;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_Gold`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#createGoldWindow}.<br/>
   * Read in: {@link Scene_Shop#commandWindowRect}, {@link Scene_Shop#createGoldWindow}, {@link Scene_Shop#currencyUnit}, {@link Scene_Shop#money}, {@link Scene_Shop#onNumberOk}.<br/>
   */
  _goldWindow: Window_Gold;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `[number, number, number?, number?][]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#prepare}.<br/>
   * Read in: {@link Scene_Shop#createBuyWindow}.<br/>
   */
  _goods: [number, number, number?, number?][];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#onBuyOk}, {@link Scene_Shop#onSellOk}, {@link Scene_Shop#prepare}.<br/>
   * Read in: {@link Scene_Shop#buyingPrice}, {@link Scene_Shop#doBuy}, {@link Scene_Shop#doSell}, {@link Scene_Shop#maxBuy}, {@link Scene_Shop#maxSell}, {@link Scene_Shop#onBuyOk}, {@link Scene_Shop#onSellOk}, {@link Scene_Shop#sellingPrice}.<br/>
   */
  _item: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_ShopNumber`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#createNumberWindow}.<br/>
   * Read in: {@link Scene_Shop#createNumberWindow}, {@link Scene_Shop#endNumberInput}, {@link Scene_Shop#onBuyOk}, {@link Scene_Shop#onNumberOk}, {@link Scene_Shop#onSellOk}.<br/>
   */
  _numberWindow: Window_ShopNumber;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#prepare}.<br/>
   * Read in: {@link Scene_Shop#createCommandWindow}.<br/>
   */
  _purchaseOnly: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_ShopSell`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#createSellWindow}.<br/>
   * Read in: {@link Scene_Shop#activateSellWindow}, {@link Scene_Shop#commandSell}, {@link Scene_Shop#createSellWindow}, {@link Scene_Shop#onCategoryCancel}, {@link Scene_Shop#onCategoryOk}, {@link Scene_Shop#onSellCancel}, {@link Scene_Shop#onSellOk}.<br/>
   */
  _sellWindow: Window_ShopSell;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_ShopStatus`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Scene_Shop#createStatusWindow}.<br/>
   * Read in: {@link Scene_Shop#activateBuyWindow}, {@link Scene_Shop#activateSellWindow}, {@link Scene_Shop#createBuyWindow}, {@link Scene_Shop#createStatusWindow}, {@link Scene_Shop#onBuyCancel}, {@link Scene_Shop#onNumberOk}, {@link Scene_Shop#onSellCancel}, {@link Scene_Shop#onSellOk}.<br/>
   */
  _statusWindow: Window_ShopStatus;
  /**
   * Performs activate buy window.
   */
  activateBuyWindow(): void;
  /**
   * Performs activate sell window.
   */
  activateSellWindow(): void;
  /**
   * Gets buy window rect.
   * @returns The result.
   */
  buyWindowRect(): Rectangle;
  /**
   * Gets buying price.
   * @returns The result.
   */
  buyingPrice(): number;
  /**
   * Gets category window rect.
   * @returns The result.
   */
  categoryWindowRect(): Rectangle;
  /**
   * Performs command buy.
   */
  commandBuy(): void;
  /**
   * Performs command sell.
   */
  commandSell(): void;
  /**
   * Gets command window rect.
   * @returns The result.
   */
  commandWindowRect(): Rectangle;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates buy window.
   */
  createBuyWindow(): void;
  /**
   * Creates category window.
   */
  createCategoryWindow(): void;
  /**
   * Creates command window.
   */
  createCommandWindow(): void;
  /**
   * Creates dummy window.
   */
  createDummyWindow(): void;
  /**
   * Creates gold window.
   */
  createGoldWindow(): void;
  /**
   * Creates number window.
   */
  createNumberWindow(): void;
  /**
   * Creates sell window.
   */
  createSellWindow(): void;
  /**
   * Creates status window.
   */
  createStatusWindow(): void;
  /**
   * Gets currency unit.
   * @returns The result.
   */
  currencyUnit(): string;
  /**
   * Performs do buy.
   * @param _number The number parameter.
   */
  doBuy(_number: number): void;
  /**
   * Performs do sell.
   * @param _number The number parameter.
   */
  doSell(_number: number): void;
  /**
   * Gets dummy window rect.
   * @returns The result.
   */
  dummyWindowRect(): Rectangle;
  /**
   * Performs end number input.
   */
  endNumberInput(): void;
  /**
   * Gets gold window rect.
   * @returns The result.
   */
  goldWindowRect(): Rectangle;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Gets max buy.
   * @returns The result.
   */
  maxBuy(): number;
  /**
   * Gets max sell.
   * @returns The result.
   */
  maxSell(): number;
  /**
   * Gets money.
   * @returns The result.
   */
  money(): number;
  /**
   * Gets number window rect.
   * @returns The result.
   */
  numberWindowRect(): Rectangle;
  /**
   * Performs on buy cancel.
   */
  onBuyCancel(): void;
  /**
   * Performs on buy ok.
   */
  onBuyOk(): void;
  /**
   * Performs on category cancel.
   */
  onCategoryCancel(): void;
  /**
   * Performs on category ok.
   */
  onCategoryOk(): void;
  /**
   * Performs on number cancel.
   */
  onNumberCancel(): void;
  /**
   * Performs on number ok.
   */
  onNumberOk(): void;
  /**
   * Performs on sell cancel.
   */
  onSellCancel(): void;
  /**
   * Performs on sell ok.
   */
  onSellOk(): void;
  /**
   * Performs prepare.
   * @param goods The goods parameter.
   * @param purchaseOnly The purchaseOnly parameter.
   */
  prepare(goods: [number, number, number?, number?][], purchaseOnly: boolean): void;
  /**
   * Gets sell window rect.
   * @returns The result.
   */
  sellWindowRect(): Rectangle;
  /**
   * Gets selling price.
   * @returns The result.
   */
  sellingPrice(): number;
  /**
   * Gets status width.
   * @returns The result.
   */
  statusWidth(): number;
  /**
   * Gets status window rect.
   * @returns The result.
   */
  statusWindowRect(): Rectangle;
}
