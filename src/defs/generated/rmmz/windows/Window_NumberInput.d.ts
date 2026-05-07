/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_NumberInput
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_NumberInput
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _buttons: unknown[];
  _canRepeat: boolean;
  _maxDigits: number;
  _messageWindow: Window_Base;
  _number: number;
  buttonSpacing(): number;
  buttonY(): number;
  changeDigit(up: boolean): void;
  createButtons(): void;
  drawItem(index: number): void;
  initialize(): void;
  isCancelEnabled(): boolean;
  isHoverEnabled(): boolean;
  isOkEnabled(): boolean;
  isScrollEnabled(): boolean;
  isTouchOkEnabled(): boolean;
  itemRect(index: number): Rectangle;
  itemWidth(): number;
  maxCols(): number;
  maxItems(): number;
  onButtonDown(): void;
  onButtonOk(): void;
  onButtonUp(): void;
  placeButtons(): void;
  processDigitChange(): void;
  processOk(): void;
  setMessageWindow(messageWindow: Window_Base): void;
  start(): void;
  totalButtonWidth(): number;
  update(): void;
  updatePlacement(): void;
  windowHeight(): number;
  windowWidth(): number;
}
