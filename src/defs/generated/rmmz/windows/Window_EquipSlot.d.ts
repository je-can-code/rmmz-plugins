/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_EquipSlot
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_EquipSlot
{
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Game_Actor`.
   * Initialized in: {@link Window_EquipSlot#initialize}.
   * Written in: {@link Window_EquipSlot#initialize}, {@link Window_EquipSlot#setActor}.
   * Read in: {@link Window_EquipSlot#drawItem}, {@link Window_EquipSlot#isEnabled}, {@link Window_EquipSlot#itemAt}, {@link Window_EquipSlot#maxItems}, {@link Window_EquipSlot#setActor}.
   */
  _actor: null | Game_Actor;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Base`.
   * Initialized in: none.
   * Written in: {@link Window_EquipSlot#setItemWindow}.
   * Read in: {@link Window_EquipSlot#update}.
   */
  _itemWindow: Window_Base;
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Base`.
   * Initialized in: none.
   * Written in: {@link Window_EquipSlot#setStatusWindow}.
   * Read in: {@link Window_EquipSlot#updateHelp}.
   */
  _statusWindow: Window_Base;
  /**
   * Performs draw item.
   * @param index The index parameter.
   */
  drawItem(index: number): void;
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
   * @param index The index parameter.
   * @returns True if enabled; false otherwise.
   */
  isEnabled(index: number): boolean;
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
  itemAt(index: number): null;
  /**
   * Gets max items.
   * @returns The result.
   */
  maxItems(): number;
  /**
   * Sets actor.
   * @param actor The actor parameter.
   */
  setActor(actor: Game_Actor): void;
  /**
   * Sets item window.
   * @param itemWindow The itemWindow parameter.
   */
  setItemWindow(itemWindow: Window_Base): void;
  /**
   * Sets status window.
   * @param statusWindow The statusWindow parameter.
   */
  setStatusWindow(statusWindow: Window_Base): void;
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
