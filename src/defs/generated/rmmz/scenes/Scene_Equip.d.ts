/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Equip
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Equip
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _commandWindow: Window_EquipCommand;
  _itemWindow: Window_EquipItem;
  _slotWindow: Window_EquipSlot;
  _statusWindow: Window_EquipStatus;
  arePageButtonsEnabled(): boolean;
  commandClear(): void;
  commandEquip(): void;
  commandOptimize(): void;
  commandWindowRect(): Rectangle;
  create(): void;
  createCommandWindow(): void;
  createItemWindow(): void;
  createSlotWindow(): void;
  createStatusWindow(): void;
  executeEquipChange(): void;
  hideItemWindow(): void;
  initialize(): void;
  itemWindowRect(): Rectangle;
  needsPageButtons(): boolean;
  onActorChange(): void;
  onItemCancel(): void;
  onItemOk(): void;
  onSlotCancel(): void;
  onSlotOk(): void;
  refreshActor(): void;
  slotWindowRect(): Rectangle;
  statusWidth(): number;
  statusWindowRect(): Rectangle;
}
