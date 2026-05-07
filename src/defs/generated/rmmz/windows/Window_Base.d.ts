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
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Window_Base#initialize}.
   * Written in: {@link Window_Base#close}, {@link Window_Base#initialize}, {@link Window_Base#open}, {@link Window_Base#updateClose}.
   * Read in: {@link Window_Base#isClosing}, {@link Window_Base#updateClose}.
   */
  _closing: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Sprite`.
   * Initialized in: {@link Window_Base#initialize}.
   * Written in: {@link Window_Base#createDimmerSprite}, {@link Window_Base#initialize}.
   * Read in: {@link Window_Base#createDimmerSprite}, {@link Window_Base#destroy}, {@link Window_Base#hideBackgroundDimmer}, {@link Window_Base#refreshDimmerBitmap}, {@link Window_Base#showBackgroundDimmer}, {@link Window_Base#updateBackgroundDimmer}.
   */
  _dimmerSprite: null | Sprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Window_Base#initialize}.
   * Written in: {@link Window_Base#close}, {@link Window_Base#initialize}, {@link Window_Base#open}, {@link Window_Base#updateOpen}.
   * Read in: {@link Window_Base#isOpening}, {@link Window_Base#updateOpen}.
   */
  _opening: boolean;
  /**
   * Performs activate.
   */
  activate(): void;
  /**
   * Gets actor name.
   * @param n The n parameter.
   * @returns The result.
   */
  actorName(n: number): string;
  /**
   * Gets base text rect.
   * @returns The result.
   */
  baseTextRect(): Rectangle;
  /**
   * Gets calc text height.
   * @param textState The textState parameter.
   * @returns The result.
   */
  calcTextHeight(textState: object): number;
  /**
   * Gets change outline color.
   * @param color The color parameter.
   * @returns The result.
   */
  changeOutlineColor(color: string): string;
  /**
   * Performs change paint opacity.
   * @param enabled The enabled parameter.
   */
  changePaintOpacity(enabled: boolean): void;
  /**
   * Gets change text color.
   * @param color The color parameter.
   * @returns The result.
   */
  changeTextColor(color: string): string;
  /**
   * Performs check rect object.
   * @param rect The rect parameter.
   */
  checkRectObject(rect: Rectangle): void;
  /**
   * Performs close.
   */
  close(): void;
  /**
   * Gets contents height.
   * @returns The result.
   */
  contentsHeight(): number;
  /**
   * Gets contents width.
   * @returns The result.
   */
  contentsWidth(): number;
  /**
   * Gets convert escape characters.
   * @param text The text parameter.
   * @returns The result.
   */
  convertEscapeCharacters(text: string): string;
  /**
   * Creates contents.
   */
  createContents(): void;
  /**
   * Creates dimmer sprite.
   */
  createDimmerSprite(): void;
  /**
   * Creates text buffer.
   * @param rtl The rtl parameter.
   * @returns The result.
   */
  createTextBuffer(rtl: boolean): string;
  /**
   * Creates text state.
   * @param text The text parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @returns The result.
   */
  createTextState(text: string, x: number, y: number, width: number): object;
  /**
   * Performs deactivate.
   */
  deactivate(): void;
  /**
   * Performs destroy.
   * @param options The options parameter.
   */
  destroy(options: object): void;
  /**
   * Performs destroy contents.
   */
  destroyContents(): void;
  /**
   * Performs draw character.
   * @param characterName The characterName parameter.
   * @param characterIndex The characterIndex parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawCharacter(characterName: string, characterIndex: number, x: number, y: number): void;
  /**
   * Performs draw currency value.
   * @param value The value parameter.
   * @param unit The unit parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawCurrencyValue(value: number, unit: string, x: number, y: number, width: number): void;
  /**
   * Performs draw face.
   * @param faceName The faceName parameter.
   * @param faceIndex The faceIndex parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  drawFace(faceName: string, faceIndex: number, x: number, y: number, width: number, height: number): void;
  /**
   * Performs draw icon.
   * @param iconIndex The iconIndex parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawIcon(iconIndex: number, x: number, y: number): void;
  /**
   * Performs draw item name.
   * @param item The item parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawItemName(item: RPG_Item | RPG_Skill | RPG_Weapon | RPG_Armor | null, x: number, y: number, width: number): void;
  /**
   * Performs draw rect.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  drawRect(x: number, y: number, width: number, height: number): void;
  /**
   * Performs draw text.
   * @param text The text parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param maxWidth The maxWidth parameter.
   * @param align The align parameter.
   */
  drawText(text: string, x: number, y: number, maxWidth: number, align: string): void;
  /**
   * Gets draw text ex.
   * @param text The text parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @returns The result.
   */
  drawTextEx(text: string, x: number, y: number, width: number): number;
  /**
   * Gets fitting height.
   * @param numLines The numLines parameter.
   * @returns The result.
   */
  fittingHeight(numLines: number): number;
  /**
   * Performs flush text state.
   * @param textState The textState parameter.
   */
  flushTextState(textState: object): void;
  /**
   * Performs hide.
   */
  hide(): void;
  /**
   * Performs hide background dimmer.
   */
  hideBackgroundDimmer(): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Determines whether closing.
   * @returns True if closing; false otherwise.
   */
  isClosing(): boolean;
  /**
   * Determines whether opening.
   * @returns True if opening; false otherwise.
   */
  isOpening(): boolean;
  /**
   * Gets item height.
   * @returns The result.
   */
  itemHeight(): number;
  /**
   * Gets item padding.
   * @returns The result.
   */
  itemPadding(): number;
  /**
   * Gets item width.
   * @returns The result.
   */
  itemWidth(): number;
  /**
   * Gets line height.
   * @returns The result.
   */
  lineHeight(): number;
  /**
   * Performs load windowskin.
   */
  loadWindowskin(): void;
  /**
   * Creates font bigger.
   */
  makeFontBigger(): void;
  /**
   * Creates font smaller.
   */
  makeFontSmaller(): void;
  /**
   * Gets max font size in line.
   * @param line The line parameter.
   * @returns The result.
   */
  maxFontSizeInLine(line: string): number;
  /**
   * Gets obtain escape code.
   * @param textState The textState parameter.
   * @returns The result.
   */
  obtainEscapeCode(textState: object): string;
  /**
   * Gets obtain escape param.
   * @param textState The textState parameter.
   * @returns The result.
   */
  obtainEscapeParam(textState: object): number | string;
  /**
   * Performs open.
   */
  open(): void;
  /**
   * Gets party member name.
   * @param n The n parameter.
   * @returns The result.
   */
  partyMemberName(n: number): string;
  /**
   * Performs play buzzer sound.
   */
  playBuzzerSound(): void;
  /**
   * Performs play cursor sound.
   */
  playCursorSound(): void;
  /**
   * Performs play ok sound.
   */
  playOkSound(): void;
  /**
   * Performs process all text.
   * @param textState The textState parameter.
   */
  processAllText(textState: object): void;
  /**
   * Performs process character.
   * @param textState The textState parameter.
   */
  processCharacter(textState: object): void;
  /**
   * Performs process color change.
   * @param colorIndex The colorIndex parameter.
   */
  processColorChange(colorIndex: number): void;
  /**
   * Performs process control character.
   * @param textState The textState parameter.
   * @param c The c parameter.
   */
  processControlCharacter(textState: object, c: string): void;
  /**
   * Performs process draw icon.
   * @param iconIndex The iconIndex parameter.
   * @param textState The textState parameter.
   */
  processDrawIcon(iconIndex: number, textState: object): void;
  /**
   * Performs process escape character.
   * @param code The code parameter.
   * @param textState The textState parameter.
   */
  processEscapeCharacter(code: string, textState: object): void;
  /**
   * Performs process new line.
   * @param textState The textState parameter.
   */
  processNewLine(textState: object): void;
  /**
   * Performs refresh dimmer bitmap.
   */
  refreshDimmerBitmap(): void;
  /**
   * Clears font settings.
   */
  resetFontSettings(): void;
  /**
   * Clears text color.
   */
  resetTextColor(): void;
  /**
   * Sets background type.
   * @param _type The type parameter.
   */
  setBackgroundType(_type: number): void;
  /**
   * Performs show.
   */
  show(): void;
  /**
   * Performs show background dimmer.
   */
  showBackgroundDimmer(): void;
  /**
   * Gets system color.
   * @returns The result.
   */
  systemColor(): string;
  /**
   * Gets text size ex.
   * @param text The text parameter.
   * @returns The result.
   */
  textSizeEx(text: string): object;
  /**
   * Gets text width.
   * @param text The text parameter.
   * @returns The result.
   */
  textWidth(text: string): number;
  /**
   * Gets translucent opacity.
   * @returns The result.
   */
  translucentOpacity(): number;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates back opacity.
   */
  updateBackOpacity(): void;
  /**
   * Updates background dimmer.
   */
  updateBackgroundDimmer(): void;
  /**
   * Updates close.
   */
  updateClose(): void;
  /**
   * Updates open.
   */
  updateOpen(): void;
  /**
   * Updates padding.
   */
  updatePadding(): void;
  /**
   * Updates tone.
   */
  updateTone(): void;
}
