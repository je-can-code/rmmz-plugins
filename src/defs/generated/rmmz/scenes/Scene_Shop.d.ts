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
   * Inferred engine backing field.
   *
   * Type: `Window_ShopBuy`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#createBuyWindow}.
   * Read in: {@link Scene_Shop#activateBuyWindow}, {@link Scene_Shop#buyingPrice}, {@link Scene_Shop#createBuyWindow}, {@link Scene_Shop#onBuyCancel}, {@link Scene_Shop#onBuyOk}.
   */
  _buyWindow: Window_ShopBuy;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_ItemCategory`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#createCategoryWindow}.
   * Read in: {@link Scene_Shop#activateSellWindow}, {@link Scene_Shop#commandSell}, {@link Scene_Shop#createCategoryWindow}, {@link Scene_Shop#createSellWindow}, {@link Scene_Shop#onCategoryCancel}, {@link Scene_Shop#onSellCancel}, {@link Scene_Shop#onSellOk}, {@link Scene_Shop#sellWindowRect}.
   */
  _categoryWindow: Window_ItemCategory;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_ShopCommand`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#createCommandWindow}.
   * Read in: {@link Scene_Shop#createCommandWindow}, {@link Scene_Shop#dummyWindowRect}, {@link Scene_Shop#endNumberInput}, {@link Scene_Shop#onBuyCancel}, {@link Scene_Shop#onCategoryCancel}, {@link Scene_Shop#onNumberOk}, {@link Scene_Shop#sellWindowRect}.
   */
  _commandWindow: Window_ShopCommand;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Base`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#createDummyWindow}.
   * Read in: {@link Scene_Shop#buyWindowRect}, {@link Scene_Shop#categoryWindowRect}, {@link Scene_Shop#commandBuy}, {@link Scene_Shop#commandSell}, {@link Scene_Shop#createDummyWindow}, {@link Scene_Shop#numberWindowRect}, {@link Scene_Shop#onBuyCancel}, {@link Scene_Shop#onCategoryCancel}, {@link Scene_Shop#statusWindowRect}.
   */
  _dummyWindow: Window_Base;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Gold`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#createGoldWindow}.
   * Read in: {@link Scene_Shop#commandWindowRect}, {@link Scene_Shop#createGoldWindow}, {@link Scene_Shop#currencyUnit}, {@link Scene_Shop#money}, {@link Scene_Shop#onNumberOk}.
   */
  _goldWindow: Window_Gold;
  /**
   * Inferred engine backing field.
   *
   * Type: `[number, number, number?, number?][]`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#prepare}.
   * Read in: {@link Scene_Shop#createBuyWindow}.
   */
  _goods: [number, number, number?, number?][];
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#onBuyOk}, {@link Scene_Shop#onSellOk}, {@link Scene_Shop#prepare}.
   * Read in: {@link Scene_Shop#buyingPrice}, {@link Scene_Shop#doBuy}, {@link Scene_Shop#doSell}, {@link Scene_Shop#maxBuy}, {@link Scene_Shop#maxSell}, {@link Scene_Shop#onBuyOk}, {@link Scene_Shop#onSellOk}, {@link Scene_Shop#sellingPrice}.
   */
  _item: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_ShopNumber`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#createNumberWindow}.
   * Read in: {@link Scene_Shop#createNumberWindow}, {@link Scene_Shop#endNumberInput}, {@link Scene_Shop#onBuyOk}, {@link Scene_Shop#onNumberOk}, {@link Scene_Shop#onSellOk}.
   */
  _numberWindow: Window_ShopNumber;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#prepare}.
   * Read in: {@link Scene_Shop#createCommandWindow}.
   */
  _purchaseOnly: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_ShopSell`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#createSellWindow}.
   * Read in: {@link Scene_Shop#activateSellWindow}, {@link Scene_Shop#commandSell}, {@link Scene_Shop#createSellWindow}, {@link Scene_Shop#onCategoryCancel}, {@link Scene_Shop#onCategoryOk}, {@link Scene_Shop#onSellCancel}, {@link Scene_Shop#onSellOk}.
   */
  _sellWindow: Window_ShopSell;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_ShopStatus`.
   * Initialized in: none.
   * Written in: {@link Scene_Shop#createStatusWindow}.
   * Read in: {@link Scene_Shop#activateBuyWindow}, {@link Scene_Shop#activateSellWindow}, {@link Scene_Shop#createBuyWindow}, {@link Scene_Shop#createStatusWindow}, {@link Scene_Shop#onBuyCancel}, {@link Scene_Shop#onNumberOk}, {@link Scene_Shop#onSellCancel}, {@link Scene_Shop#onSellOk}.
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
