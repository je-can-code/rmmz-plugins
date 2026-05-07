/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_EventItem
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_EventItem extends Window_ItemList
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_EventItem#initialize}.<br/>
   * Written in: {@link Window_EventItem#initialize}.<br/>
   * Read in: none.<br/>
   */
  _canRepeat: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Sprite_Button`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_EventItem#createCancelButton}.<br/>
   * Read in: {@link Window_EventItem#createCancelButton}, {@link Window_EventItem#placeCancelButton}, {@link Window_EventItem#updateCancelButton}.<br/>
   */
  _cancelButton: Sprite_Button;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_EventItem#setMessageWindow}.<br/>
   * Read in: {@link Window_EventItem#onCancel}, {@link Window_EventItem#onOk}, {@link Window_EventItem#placeCancelButton}, {@link Window_EventItem#updatePlacement}.<br/>
   */
  _messageWindow: Window_Base;
  /**
   * Creates cancel button.
   */
  createCancelButton(): void;
  /**
   * Gets includes.
   * @param item The item parameter.
   * @returns The result.
   */
  includes(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether enabled.
   * @returns True if enabled; false otherwise.
   */
  isEnabled(): boolean;
  /**
   * Gets needs number.
   * @returns The result.
   */
  needsNumber(): boolean;
  /**
   * Performs on cancel.
   */
  onCancel(): void;
  /**
   * Performs on ok.
   */
  onOk(): void;
  /**
   * Performs place cancel button.
   */
  placeCancelButton(): void;
  /**
   * Sets message window.
   * @param messageWindow The messageWindow parameter.
   */
  setMessageWindow(messageWindow: Window_Base): void;
  /**
   * Performs start.
   */
  start(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates cancel button.
   */
  updateCancelButton(): void;
  /**
   * Updates placement.
   */
  updatePlacement(): void;
}
