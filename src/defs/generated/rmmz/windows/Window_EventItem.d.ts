/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_EventItem
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_EventItem
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _canRepeat: boolean;
  _cancelButton: Sprite_Button;
  _messageWindow: Window_Base;
  createCancelButton(): void;
  includes(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null): boolean;
  initialize(rect: Rectangle): void;
  isEnabled(): boolean;
  needsNumber(): boolean;
  onCancel(): void;
  onOk(): void;
  placeCancelButton(): void;
  setMessageWindow(messageWindow: Window_Base): void;
  start(): void;
  update(): void;
  updateCancelButton(): void;
  updatePlacement(): void;
}
