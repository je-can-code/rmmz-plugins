/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_Base
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_Base extends Window
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_Base#initialize}.<br/>
   * Written in: {@link Window_Base#close}, {@link Window_Base#initialize}, {@link Window_Base#open}, {@link Window_Base#updateClose}.<br/>
   * Read in: {@link Window_Base#isClosing}, {@link Window_Base#updateClose}.<br/>
   */
  _closing: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: {@link Window_Base#initialize}.<br/>
   * Written in: {@link Window_Base#createDimmerSprite}, {@link Window_Base#initialize}.<br/>
   * Read in: {@link Window_Base#createDimmerSprite}, {@link Window_Base#destroy}, {@link Window_Base#hideBackgroundDimmer}, {@link Window_Base#refreshDimmerBitmap}, {@link Window_Base#showBackgroundDimmer}, {@link Window_Base#updateBackgroundDimmer}.<br/>
   */
  _dimmerSprite: null | Sprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Window_Base#initialize}.<br/>
   * Written in: {@link Window_Base#close}, {@link Window_Base#initialize}, {@link Window_Base#open}, {@link Window_Base#updateOpen}.<br/>
   * Read in: {@link Window_Base#isOpening}, {@link Window_Base#updateOpen}.<br/>
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
  actorName(n: unknown): string;
  /**
   * Gets base text rect.
   * @returns The result.
   */
  baseTextRect(): unknown;
  /**
   * Gets calc text height.
   * @param textState The textState parameter.
   * @returns The result.
   */
  calcTextHeight(textState: RPG_TextState): unknown;
  /**
   * Performs change outline color.
   * @param color The color parameter.
   */
  changeOutlineColor(color: unknown): void;
  /**
   * Performs change paint opacity.
   * @param enabled The enabled parameter.
   */
  changePaintOpacity(enabled: unknown): void;
  /**
   * Performs change text color.
   * @param color The color parameter.
   */
  changeTextColor(color: unknown): void;
  /**
   * Performs check rect object.
   * @param rect The rect parameter.
   */
  checkRectObject(rect: unknown): void;
  /**
   * Performs close.
   */
  close(): void;
  /**
   * Gets contents height.
   * @returns The result.
   */
  contentsHeight(): unknown;
  /**
   * Gets contents width.
   * @returns The result.
   */
  contentsWidth(): unknown;
  /**
   * Gets convert escape characters.
   * @param text The text parameter.
   * @returns The result.
   */
  convertEscapeCharacters(text: unknown): unknown;
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
  createTextBuffer(rtl: unknown): string;
  /**
   * Creates text state.
   * @param text The text parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @returns The result.
   */
  createTextState(text: unknown, x: unknown, y: unknown, width: unknown): RPG_TextState;
  /**
   * Performs deactivate.
   */
  deactivate(): void;
  /**
   * Performs destroy.
   * @param options The options parameter.
   */
  destroy(options: unknown): void;
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
  drawCharacter(characterName: unknown, characterIndex: unknown, x: unknown, y: unknown): void;
  /**
   * Performs draw currency value.
   * @param value The value parameter.
   * @param unit The unit parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawCurrencyValue(value: unknown, unit: unknown, x: unknown, y: unknown, width: unknown): void;
  /**
   * Performs draw face.
   * @param faceName The faceName parameter.
   * @param faceIndex The faceIndex parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  drawFace(faceName: unknown, faceIndex: unknown, x: unknown, y: unknown, width: unknown, height: unknown): void;
  /**
   * Performs draw icon.
   * @param iconIndex The iconIndex parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   */
  drawIcon(iconIndex: unknown, x: unknown, y: unknown): void;
  /**
   * Performs draw item name.
   * @param item The item parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   */
  drawItemName(item: unknown, x: unknown, y: unknown, width: unknown): void;
  /**
   * Performs draw rect.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  drawRect(x: unknown, y: unknown, width: unknown, height: unknown): void;
  /**
   * Performs draw text.
   * @param text The text parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param maxWidth The maxWidth parameter.
   * @param align The align parameter.
   */
  drawText(text: unknown, x: unknown, y: unknown, maxWidth: unknown, align: unknown): void;
  /**
   * Gets draw text ex.
   * @param text The text parameter.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @returns The result.
   */
  drawTextEx(text: unknown, x: unknown, y: unknown, width: unknown): number;
  /**
   * Gets fitting height.
   * @param numLines The numLines parameter.
   * @returns The result.
   */
  fittingHeight(numLines: unknown): unknown;
  /**
   * Performs flush text state.
   * @param textState The textState parameter.
   */
  flushTextState(textState: RPG_TextState): void;
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
  initialize(rect: unknown): void;
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
  itemHeight(): unknown;
  /**
   * Gets item padding.
   * @returns The result.
   */
  itemPadding(): number;
  /**
   * Gets item width.
   * @returns The result.
   */
  itemWidth(): unknown;
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
  maxFontSizeInLine(line: unknown): unknown;
  /**
   * Gets obtain escape code.
   * @param textState The textState parameter.
   * @returns The result.
   */
  obtainEscapeCode(textState: RPG_TextState): string;
  /**
   * Gets obtain escape param.
   * @param textState The textState parameter.
   * @returns The result.
   */
  obtainEscapeParam(textState: RPG_TextState): number | string;
  /**
   * Performs open.
   */
  open(): void;
  /**
   * Gets party member name.
   * @param n The n parameter.
   * @returns The result.
   */
  partyMemberName(n: unknown): string;
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
  processAllText(textState: RPG_TextState): void;
  /**
   * Performs process character.
   * @param textState The textState parameter.
   */
  processCharacter(textState: RPG_TextState): void;
  /**
   * Performs process color change.
   * @param colorIndex The colorIndex parameter.
   */
  processColorChange(colorIndex: unknown): void;
  /**
   * Performs process control character.
   * @param textState The textState parameter.
   * @param c The c parameter.
   */
  processControlCharacter(textState: RPG_TextState, c: unknown): void;
  /**
   * Performs process draw icon.
   * @param iconIndex The iconIndex parameter.
   * @param textState The textState parameter.
   */
  processDrawIcon(iconIndex: unknown, textState: RPG_TextState): void;
  /**
   * Performs process escape character.
   * @param code The code parameter.
   * @param textState The textState parameter.
   */
  processEscapeCharacter(code: unknown, textState: RPG_TextState): void;
  /**
   * Performs process new line.
   * @param textState The textState parameter.
   */
  processNewLine(textState: RPG_TextState): void;
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
  setBackgroundType(_type: unknown): void;
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
  systemColor(): unknown;
  /**
   * Gets text size ex.
   * @param text The text parameter.
   * @returns The result.
   */
  textSizeEx(text: unknown): { width: number; height: number };
  /**
   * Gets text width.
   * @param text The text parameter.
   * @returns The result.
   */
  textWidth(text: unknown): unknown;
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
