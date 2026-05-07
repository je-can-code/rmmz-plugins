/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_EquipItem
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_EquipItem extends Window_ItemList
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Actor`.<br/>
   * Initialized in: {@link Window_EquipItem#initialize}.<br/>
   * Written in: {@link Window_EquipItem#initialize}, {@link Window_EquipItem#setActor}.<br/>
   * Read in: {@link Window_EquipItem#etypeId}, {@link Window_EquipItem#includes}, {@link Window_EquipItem#setActor}, {@link Window_EquipItem#updateHelp}.<br/>
   */
  _actor: null | Game_Actor;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_EquipItem#initialize}.<br/>
   * Written in: {@link Window_EquipItem#initialize}, {@link Window_EquipItem#setSlotId}.<br/>
   * Read in: {@link Window_EquipItem#etypeId}, {@link Window_EquipItem#setSlotId}, {@link Window_EquipItem#updateHelp}.<br/>
   */
  _slotId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `Window_Base`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Window_EquipItem#setStatusWindow}.<br/>
   * Read in: {@link Window_EquipItem#updateHelp}.<br/>
   */
  _statusWindow: Window_Base;
  /**
   * Gets col spacing.
   * @returns The result.
   */
  colSpacing(): number;
  /**
   * Gets etype id.
   * @returns The result.
   */
  etypeId(): number;
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
   * Gets max cols.
   * @returns The result.
   */
  maxCols(): number;
  /**
   * Performs play ok sound.
   */
  playOkSound(): void;
  /**
   * Performs select last.
   */
  selectLast(): void;
  /**
   * Sets actor.
   * @param actor The actor parameter.
   */
  setActor(actor: Game_Actor): void;
  /**
   * Sets slot id.
   * @param slotId The slotId parameter.
   */
  setSlotId(slotId: number): void;
  /**
   * Sets status window.
   * @param statusWindow The statusWindow parameter.
   */
  setStatusWindow(statusWindow: Window_Base): void;
  /**
   * Updates help.
   */
  updateHelp(): void;
}
