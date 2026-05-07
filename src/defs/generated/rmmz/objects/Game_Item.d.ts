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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _dataClass: string;
  _itemId: number;
  initialize(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
  isArmor(): boolean;
  isEquipItem(): boolean;
  isItem(): boolean;
  isNull(): boolean;
  isSkill(): boolean;
  isUsableItem(): boolean;
  isWeapon(): boolean;
  itemId(): number;
  object(): null;
  setEquip(isWeapon: boolean, itemId: number): void;
  setObject(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): void;
}
