/**
 * Generated from project/js/rmmz_objects.js
 * Class: Game_Message
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Game_Message
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _background: number;
  _choiceBackground: number;
  _choiceCallback: null | (n: number) => void;
  _choiceCancelType: number;
  _choiceDefaultType: number;
  _choicePositionType: number;
  _choices: unknown[] | string[];
  _faceIndex: number;
  _faceName: string;
  _itemChoiceItypeId: number;
  _itemChoiceVariableId: number;
  _numInputMaxDigits: number;
  _numInputVariableId: number;
  _positionType: number;
  _scrollMode: boolean;
  _scrollNoFast: boolean;
  _scrollSpeed: number;
  _speakerName: string;
  _texts: unknown[];
  add(text: string): void;
  allText(): string;
  background(): number;
  choiceBackground(): number;
  choiceCancelType(): number;
  choiceDefaultType(): number;
  choicePositionType(): number;
  choices(): string[];
  clear(): void;
  faceIndex(): number;
  faceName(): string;
  hasText(): boolean;
  initialize(): void;
  isBusy(): boolean;
  isChoice(): boolean;
  isItemChoice(): boolean;
  isNumberInput(): boolean;
  isRTL(): boolean;
  itemChoiceItypeId(): number;
  itemChoiceVariableId(): number;
  newPage(): void;
  numInputMaxDigits(): number;
  numInputVariableId(): number;
  onChoice(n: number): void;
  positionType(): number;
  scrollMode(): boolean;
  scrollNoFast(): boolean;
  scrollSpeed(): number;
  setBackground(background: number): void;
  setChoiceBackground(background: number): void;
  setChoiceCallback(callback: (n: number) => void): void;
  setChoicePositionType(positionType: number): void;
  setChoices(choices: string[], defaultType: number, cancelType: number): void;
  setFaceImage(faceName: string, faceIndex: number): void;
  setItemChoice(variableId: number, itemType: number): void;
  setNumberInput(variableId: number, maxDigits: number): void;
  setPositionType(positionType: number): void;
  setScroll(speed: number, noFast: boolean): void;
  setSpeakerName(speakerName: string): void;
  speakerName(): string;
}
