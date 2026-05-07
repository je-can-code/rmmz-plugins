/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Base
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Base
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _closing: boolean;
  _dimmerSprite: null | Sprite;
  _opening: boolean;
  activate(): void;
  actorName(n: number): string;
  baseTextRect(): Rectangle;
  calcTextHeight(textState: object): number;
  changeOutlineColor(color: string): string;
  changePaintOpacity(enabled: boolean): void;
  changeTextColor(color: string): string;
  checkRectObject(rect: Rectangle): void;
  close(): void;
  contentsHeight(): number;
  contentsWidth(): number;
  convertEscapeCharacters(text: string): string;
  createContents(): void;
  createDimmerSprite(): void;
  createTextBuffer(rtl: boolean): string;
  createTextState(text: string, x: number, y: number, width: number): object;
  deactivate(): void;
  destroy(options: object): void;
  destroyContents(): void;
  drawCharacter(characterName: string, characterIndex: number, x: number, y: number): void;
  drawCurrencyValue(value: number, unit: string, x: number, y: number, width: number): void;
  drawFace(faceName: string, faceIndex: number, x: number, y: number, width: number, height: number): void;
  drawIcon(iconIndex: number, x: number, y: number): void;
  drawItemName(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, x: number, y: number, width: number): void;
  drawRect(x: number, y: number, width: number, height: number): void;
  drawText(text: string, x: number, y: number, maxWidth: number, align: string): void;
  drawTextEx(text: string, x: number, y: number, width: number): number;
  fittingHeight(numLines: number): number;
  flushTextState(textState: object): void;
  hide(): void;
  hideBackgroundDimmer(): void;
  initialize(rect: Rectangle): void;
  isClosing(): boolean;
  isOpening(): boolean;
  itemHeight(): number;
  itemPadding(): number;
  itemWidth(): number;
  lineHeight(): number;
  loadWindowskin(): void;
  makeFontBigger(): void;
  makeFontSmaller(): void;
  maxFontSizeInLine(line: string): number;
  obtainEscapeCode(textState: object): string;
  obtainEscapeParam(textState: object): number | string;
  open(): void;
  partyMemberName(n: number): string;
  playBuzzerSound(): void;
  playCursorSound(): void;
  playOkSound(): void;
  processAllText(textState: object): void;
  processCharacter(textState: object): void;
  processColorChange(colorIndex: number): void;
  processControlCharacter(textState: object, c: string): void;
  processDrawIcon(iconIndex: number, textState: object): void;
  processEscapeCharacter(code: string, textState: object): void;
  processNewLine(textState: object): void;
  refreshDimmerBitmap(): void;
  resetFontSettings(): void;
  resetTextColor(): void;
  setBackgroundType(_type: number): void;
  show(): void;
  showBackgroundDimmer(): void;
  systemColor(): string;
  textSizeEx(text: string): object;
  textWidth(text: string): number;
  translucentOpacity(): number;
  update(): void;
  updateBackOpacity(): void;
  updateBackgroundDimmer(): void;
  updateClose(): void;
  updateOpen(): void;
  updatePadding(): void;
  updateTone(): void;
}
