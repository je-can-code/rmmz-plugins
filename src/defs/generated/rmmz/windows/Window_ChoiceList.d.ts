/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ChoiceList
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ChoiceList
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _background: number;
  _canRepeat: boolean;
  _cancelButton: Sprite_Button;
  _messageWindow: Window_Base;
  callCancelHandler(): void;
  callOkHandler(): void;
  createCancelButton(): void;
  drawItem(index: number): void;
  initialize(): void;
  isCancelEnabled(): boolean;
  makeCommandList(): void;
  maxChoiceWidth(): number;
  maxLines(): number;
  needsCancelButton(): boolean;
  numVisibleRows(): number;
  placeCancelButton(): void;
  selectDefault(): void;
  setMessageWindow(messageWindow: Window_Base): void;
  start(): void;
  update(): void;
  updateBackground(): void;
  updateCancelButton(): void;
  updatePlacement(): void;
  windowHeight(): number;
  windowWidth(): number;
  windowX(): number;
  windowY(): number;
}
