/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_NumberInput
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_NumberInput extends Window_Selectable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_NumberInput#createButtons}.<br/>
   * Read in: {@link Window_NumberInput#createButtons}, {@link Window_NumberInput#placeButtons}, {@link Window_NumberInput#totalButtonWidth}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `push()`: {@link Window_NumberInput#createButtons}.<br/>
   */
  _buttons: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_NumberInput#initialize}.<br/>
   * Written in: {@link Window_NumberInput#initialize}.<br/>
   * Read in: none.<br/>
   */
  _canRepeat: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_NumberInput#initialize}.<br/>
   * Written in: {@link Window_NumberInput#initialize}, {@link Window_NumberInput#start}.<br/>
   * Read in: {@link Window_NumberInput#changeDigit}, {@link Window_NumberInput#drawItem}, {@link Window_NumberInput#maxCols}, {@link Window_NumberInput#maxItems}, {@link Window_NumberInput#start}.<br/>
   */
  _maxDigits: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_NumberInput#setMessageWindow}.<br/>
   * Read in: {@link Window_NumberInput#processOk}, {@link Window_NumberInput#updatePlacement}.<br/>
   */
  _messageWindow: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_NumberInput#initialize}.<br/>
   * Written in: {@link Window_NumberInput#changeDigit}, {@link Window_NumberInput#initialize}, {@link Window_NumberInput#start}.<br/>
   * Read in: {@link Window_NumberInput#changeDigit}, {@link Window_NumberInput#drawItem}, {@link Window_NumberInput#processOk}, {@link Window_NumberInput#start}.<br/>
   */
  _number: number;
  /**
   * Gets button spacing.
   * @returns The result.
   */
  buttonSpacing(): number;
  /**
   * Gets button y.
   * @returns The result.
   */
  buttonY(): unknown;
  /**
   * Performs change digit.
   * @param up The up parameter.
   */
  changeDigit(up: unknown): void;
  /**
   * Creates buttons.
   */
  createButtons(): void;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: unknown): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether cancel enabled.
   * @returns True if cancel enabled; false otherwise.
   */
  isCancelEnabled(): boolean;
  /**
   * Determines whether hover enabled.
   * @returns True if hover enabled; false otherwise.
   */
  isHoverEnabled(): boolean;
  /**
   * Determines whether ok enabled.
   * @returns True if ok enabled; false otherwise.
   */
  isOkEnabled(): boolean;
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
   * Gets item rect.
   * @param index The index parameter.
   * @returns The result.
   */
  itemRect(index: unknown): unknown;
  /**
   * Gets item width.
   * @returns The result.
   */
  itemWidth(): number;
  /**
   * Gets max cols.
   * @returns The result.
   */
  maxCols(): unknown;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): unknown;
  /**
   * Performs on button down.
   */
  onButtonDown(): void;
  /**
   * Performs on button ok.
   */
  onButtonOk(): void;
  /**
   * Performs on button up.
   */
  onButtonUp(): void;
  /**
   * Performs place buttons.
   */
  placeButtons(): void;
  /**
   * Performs process digit change.
   */
  processDigitChange(): void;
  /**
   * Performs process ok.
   */
  processOk(): void;
  /**
   * Sets message window.
   * @param messageWindow The messageWindow parameter.
   */
  setMessageWindow(messageWindow: unknown): void;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Gets total button width.
   * @returns The result.
   */
  totalButtonWidth(): unknown;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates placement.
   */
  updatePlacement(): void;
  /**
   * Gets window height.
   * @returns The result.
   */
  windowHeight(): unknown;
  /**
   * Gets window width.
   * @returns The result.
   */
  windowWidth(): unknown;
}
