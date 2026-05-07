/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ShopNumber
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ShopNumber extends Window_Selectable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_ShopNumber#createButtons}.<br/>
   * Read in: {@link Window_ShopNumber#createButtons}, {@link Window_ShopNumber#placeButtons}, {@link Window_ShopNumber#totalButtonWidth}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Window_ShopNumber#createButtons}.<br/>
   */
  _buttons: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_ShopNumber#initialize}.<br/>
   * Written in: {@link Window_ShopNumber#initialize}.<br/>
   * Read in: none.<br/>
   */
  _canRepeat: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link Window_ShopNumber#initialize}.<br/>
   * Written in: {@link Window_ShopNumber#initialize}, {@link Window_ShopNumber#setCurrencyUnit}.<br/>
   * Read in: {@link Window_ShopNumber#drawTotalPrice}.<br/>
   */
  _currencyUnit: string;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor`.<br/>
   * Initialized in: {@link Window_ShopNumber#initialize}.<br/>
   * Written in: {@link Window_ShopNumber#initialize}, {@link Window_ShopNumber#setup}.<br/>
   * Read in: {@link Window_ShopNumber#drawCurrentItemName}.<br/>
   */
  _item: null | RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_ShopNumber#initialize}.<br/>
   * Written in: {@link Window_ShopNumber#initialize}, {@link Window_ShopNumber#setup}.<br/>
   * Read in: {@link Window_ShopNumber#changeNumber}.<br/>
   */
  _max: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_ShopNumber#initialize}.<br/>
   * Written in: {@link Window_ShopNumber#changeNumber}, {@link Window_ShopNumber#initialize}, {@link Window_ShopNumber#setup}.<br/>
   * Read in: {@link Window_ShopNumber#changeNumber}, {@link Window_ShopNumber#drawNumber}, {@link Window_ShopNumber#drawTotalPrice}, {@link Window_ShopNumber#number}.<br/>
   */
  _number: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_ShopNumber#initialize}.<br/>
   * Written in: {@link Window_ShopNumber#initialize}, {@link Window_ShopNumber#setup}.<br/>
   * Read in: {@link Window_ShopNumber#drawTotalPrice}.<br/>
   */
  _price: number;
  /**
   * Gets button spacing.
   * @returns The result.
   */
  buttonSpacing(): number;
  /**
   * Gets button y.
   * @returns The result.
   */
  buttonY(): number;
  /**
   * Performs change number.
   * @param amount The amount parameter.
   */
  changeNumber(amount: number): void;
  /**
   * Creates buttons.
   */
  createButtons(): void;
  /**
   * Gets cursor width.
   * @returns The result.
   */
  cursorWidth(): number;
  /**
   * Gets cursor x.
   * @returns The result.
   */
  cursorX(): number;
  /**
   * Performs draw current item name.
   */
  drawCurrentItemName(): void;
  /**
   * Performs draw horz line.
   */
  drawHorzLine(): void;
  /**
   * Performs draw multiplication sign.
   */
  drawMultiplicationSign(): void;
  /**
   * Performs draw number.
   */
  drawNumber(): void;
  /**
   * Performs draw total price.
   */
  drawTotalPrice(): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether scroll enabled.
   * @returns True if scroll enabled; false otherwise.
   */
  isScrollEnabled(): boolean;
  /**
   * Determines whether touch ok enabled.
   * @returns True if touch ok enabled; false otherwise.
   */
  isTouchOkEnabled(): boolean;
  /**
   * Gets item name y.
   * @returns The result.
   */
  itemNameY(): number;
  /**
   * Gets item rect.
   * @returns The result.
   */
  itemRect(): Rectangle;
  /**
   * Gets max digits.
   * @returns The result.
   */
  maxDigits(): number;
  /**
   * Gets multiplication sign.
   * @returns The result.
   */
  multiplicationSign(): string;
  /**
   * Gets multiplication sign x.
   * @returns The result.
   */
  multiplicationSignX(): number;
  /**
   * Gets number.
   * @returns The result.
   */
  number(): number;
  /**
   * Performs on button down.
   */
  onButtonDown(): void;
  /**
   * Performs on button down2.
   */
  onButtonDown2(): void;
  /**
   * Performs on button ok.
   */
  onButtonOk(): void;
  /**
   * Performs on button up.
   */
  onButtonUp(): void;
  /**
   * Performs on button up2.
   */
  onButtonUp2(): void;
  /**
   * Performs place buttons.
   */
  placeButtons(): void;
  /**
   * Performs play ok sound.
   */
  playOkSound(): void;
  /**
   * Performs process number change.
   */
  processNumberChange(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Sets currency unit.
   * @param currencyUnit The currencyUnit parameter.
   */
  setCurrencyUnit(currencyUnit: string): void;
  /**
   * Performs setup.
   * @param item The item parameter.
   * @param max The max parameter.
   * @param price The price parameter.
   */
  setup(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, max: number, price: number): void;
  /**
   * Gets total button width.
   * @returns The result.
   */
  totalButtonWidth(): number;
  /**
   * Gets total price y.
   * @returns The result.
   */
  totalPriceY(): number;
  /**
   * Performs update.
   */
  update(): void;
}
