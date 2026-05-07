/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ChoiceList
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ChoiceList extends Window_Command
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_ChoiceList#initialize}.<br/>
   * Written in: {@link Window_ChoiceList#initialize}, {@link Window_ChoiceList#updateBackground}.<br/>
   * Read in: {@link Window_ChoiceList#updateBackground}.<br/>
   */
  _background: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_ChoiceList#initialize}.<br/>
   * Written in: {@link Window_ChoiceList#initialize}.<br/>
   * Read in: none.<br/>
   */
  _canRepeat: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_Button`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_ChoiceList#createCancelButton}.<br/>
   * Read in: {@link Window_ChoiceList#createCancelButton}, {@link Window_ChoiceList#placeCancelButton}, {@link Window_ChoiceList#updateCancelButton}.<br/>
   */
  _cancelButton: Sprite_Button;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_ChoiceList#setMessageWindow}.<br/>
   * Read in: {@link Window_ChoiceList#callCancelHandler}, {@link Window_ChoiceList#callOkHandler}, {@link Window_ChoiceList#maxLines}, {@link Window_ChoiceList#windowY}.<br/>
   */
  _messageWindow: unknown;
  /**
   * Performs call cancel handler.
   */
  callCancelHandler(): void;
  /**
   * Performs call ok handler.
   */
  callOkHandler(): void;
  /**
   * Creates cancel button.
   */
  createCancelButton(): void;
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
   * Creates command list.
   */
  makeCommandList(): void;
  /**
   * Gets max choice width.
   * @returns The result.
   */
  maxChoiceWidth(): unknown;
  /**
   * Gets max lines.
   * @returns The result.
   */
  maxLines(): number;
  /**
   * Gets needs cancel button.
   * @returns The result.
   */
  needsCancelButton(): boolean;
  /**
   * Gets num visible rows.
   * @returns The result.
   */
  numVisibleRows(): unknown;
  /**
   * Performs place cancel button.
   */
  placeCancelButton(): void;
  /**
   * Performs select default.
   */
  selectDefault(): void;
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
   * Performs update.
   */
  update(): void;
  /**
   * Updates background.
   */
  updateBackground(): void;
  /**
   * Updates cancel button.
   */
  updateCancelButton(): void;
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
  /**
   * Gets window x.
   * @returns The result.
   */
  windowX(): number;
  /**
   * Gets window y.
   * @returns The result.
   */
  windowY(): unknown;
}
