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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: null | Game_Actor;
  _itemWindow: Window_Base;
  _statusWindow: Window_Base;
  drawItem(index: number): void;
  initialize(rect: Rectangle): void;
  isCurrentItemEnabled(): boolean;
  isEnabled(index: number): boolean;
  item(): RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null;
  itemAt(index: number): null;
  maxItems(): number;
  setActor(actor: Game_Actor): void;
  setItemWindow(itemWindow: Window_Base): void;
  setStatusWindow(statusWindow: Window_Base): void;
  slotNameWidth(): number;
  update(): void;
  updateHelp(): void;
}
