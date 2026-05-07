/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_EquipSlot
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_EquipSlot extends Window_StatusBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window_EquipSlot#initialize}.<br/>
   * Written in: {@link Window_EquipSlot#initialize}, {@link Window_EquipSlot#setActor}.<br/>
   * Read in: {@link Window_EquipSlot#drawItem}, {@link Window_EquipSlot#isEnabled}, {@link Window_EquipSlot#itemAt}, {@link Window_EquipSlot#maxItems}, {@link Window_EquipSlot#setActor}.<br/>
   */
  _actor: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_EquipSlot#setItemWindow}.<br/>
   * Read in: {@link Window_EquipSlot#update}.<br/>
   */
  _itemWindow: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_EquipSlot#setStatusWindow}.<br/>
   * Read in: {@link Window_EquipSlot#updateHelp}.<br/>
   */
  _statusWindow: unknown;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: unknown): void;
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
   * @param index The index parameter.
   * @returns True if enabled; false otherwise.
   */
  isEnabled(index: unknown): boolean;
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
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Sets actor.
   * @param actor The actor parameter.
   */
  setActor(actor: unknown): void;
  /**
   * Sets item window.
   * @param itemWindow The itemWindow parameter.
   */
  setItemWindow(itemWindow: unknown): void;
  /**
   * Sets status window.
   * @param statusWindow The statusWindow parameter.
   */
  setStatusWindow(statusWindow: unknown): void;
  /**
   * Gets slot name width.
   * @returns The result.
   */
  slotNameWidth(): number;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates help.
   */
  updateHelp(): void;
}
