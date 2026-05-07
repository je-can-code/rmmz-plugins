/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_EquipItem
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_EquipItem
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: null | Game_Actor;
  _slotId: number;
  _statusWindow: Window_Base;
  colSpacing(): number;
  etypeId(): number;
  includes(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  initialize(rect: Rectangle): void;
  isEnabled(): boolean;
  maxCols(): number;
  playOkSound(): void;
  selectLast(): void;
  setActor(actor: Game_Actor): void;
  setSlotId(slotId: number): void;
  setStatusWindow(statusWindow: Window_Base): void;
  updateHelp(): void;
}
