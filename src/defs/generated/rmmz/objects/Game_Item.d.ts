/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Item
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Item
{
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: {@link Game_Item#initialize}.
   * Written in: {@link Game_Item#initialize}, {@link Game_Item#setEquip}, {@link Game_Item#setObject}.
   * Read in: {@link Game_Item#isArmor}, {@link Game_Item#isItem}, {@link Game_Item#isNull}, {@link Game_Item#isSkill}, {@link Game_Item#isWeapon}.
   */
  _dataClass: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Game_Item#initialize}.
   * Written in: {@link Game_Item#initialize}, {@link Game_Item#setEquip}, {@link Game_Item#setObject}.
   * Read in: {@link Game_Item#itemId}, {@link Game_Item#object}.
   */
  _itemId: number;
  /**
   * Initializes initialize.
   * @param item The item parameter.
   */
  initialize(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  /**
   * Determines whether armor.
   * @returns True if armor; false otherwise.
   */
  isArmor(): boolean;
  /**
   * Determines whether equip item.
   * @returns True if equip item; false otherwise.
   */
  isEquipItem(): boolean;
  /**
   * Determines whether item.
   * @returns True if item; false otherwise.
   */
  isItem(): boolean;
  /**
   * Determines whether null.
   * @returns True if null; false otherwise.
   */
  isNull(): boolean;
  /**
   * Determines whether skill.
   * @returns True if skill; false otherwise.
   */
  isSkill(): boolean;
  /**
   * Determines whether usable item.
   * @returns True if usable item; false otherwise.
   */
  isUsableItem(): boolean;
  /**
   * Determines whether weapon.
   * @returns True if weapon; false otherwise.
   */
  isWeapon(): boolean;
  /**
   * Gets item id.
   * @returns The result.
   */
  itemId(): number;
  /**
   * Gets object.
   * @returns The result.
   */
  object(): null;
  /**
   * Sets equip.
   * @param isWeapon The isWeapon parameter.
   * @param itemId The itemId parameter.
   */
  setEquip(isWeapon: boolean, itemId: number): void;
  /**
   * Sets object.
   * @param item The item parameter.
   */
  setObject(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
}
