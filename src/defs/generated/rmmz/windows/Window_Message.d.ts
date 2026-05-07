/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Message
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Message
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _background: number;
  _choiceListWindow: null | Window_Base;
  _eventItemWindow: null | Window_Base;
  _faceBitmap: null;
  _goldWindow: null | Window_Base;
  _lineShowFast: boolean;
  _nameBoxWindow: null | Window_Base;
  _numberInputWindow: null | Window_Base;
  _pauseSkip: boolean;
  _positionType: number;
  _showFast: boolean;
  _textState: null | object;
  _waitCount: number;
  areSettingsChanged(): boolean;
  canBreakHere(textState: object): boolean;
  canStart(): boolean;
  cancelWait(): void;
  checkToNotClose(): void;
  clearFlags(): void;
  doesContinue(): boolean;
  drawMessageFace(): void;
  initMembers(): void;
  initialize(rect: Rectangle): void;
  isAnySubWindowActive(): boolean;
  isEndOfText(textState: object): boolean;
  isTriggered(): boolean;
  isWaiting(): boolean;
  loadMessageFace(): void;
  needsNewPage(textState: object): boolean;
  newLineX(textState: object): number;
  newPage(textState: object): void;
  onEndOfText(): void;
  processControlCharacter(textState: object, c: string): void;
  processEscapeCharacter(code: string, textState: object): void;
  processNewLine(textState: object): void;
  processNewPage(textState: object): void;
  setChoiceListWindow(choiceListWindow: Window_Base): void;
  setEventItemWindow(eventItemWindow: Window_Base): void;
  setGoldWindow(goldWindow: Window_Base): void;
  setNameBoxWindow(nameBoxWindow: Window_Base): void;
  setNumberInputWindow(numberInputWindow: Window_Base): void;
  shouldBreakHere(textState: object): boolean;
  startInput(): boolean;
  startMessage(): void;
  startPause(): void;
  startWait(count: number): void;
  synchronizeNameBox(): void;
  terminateMessage(): void;
  update(): void;
  updateBackground(): void;
  updateInput(): boolean;
  updateLoading(): boolean;
  updateMessage(): boolean;
  updatePlacement(): void;
  updateShowFast(): void;
  updateSpeakerName(): void;
  updateWait(): boolean;
}
