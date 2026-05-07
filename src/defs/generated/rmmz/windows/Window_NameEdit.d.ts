/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_NameEdit
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_NameEdit extends Window_StatusBase
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Window_NameEdit#initialize}.<br/>
   * Written in: {@link Window_NameEdit#initialize}, {@link Window_NameEdit#setup}.<br/>
   * Read in: {@link Window_NameEdit#refresh}.<br/>
   */
  _actor: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_NameEdit#initialize}.<br/>
   * Written in: {@link Window_NameEdit#initialize}, {@link Window_NameEdit#setup}.<br/>
   * Read in: {@link Window_NameEdit#restoreDefault}.<br/>
   */
  _defaultName: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_NameEdit#initialize}.<br/>
   * Written in: {@link Window_NameEdit#add}, {@link Window_NameEdit#back}, {@link Window_NameEdit#initialize}, {@link Window_NameEdit#restoreDefault}, {@link Window_NameEdit#setup}.<br/>
   * Read in: {@link Window_NameEdit#add}, {@link Window_NameEdit#back}, {@link Window_NameEdit#refresh}.<br/>
   */
  _index: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_NameEdit#initialize}.<br/>
   * Written in: {@link Window_NameEdit#initialize}, {@link Window_NameEdit#setup}.<br/>
   * Read in: {@link Window_NameEdit#add}, {@link Window_NameEdit#left}, {@link Window_NameEdit#refresh}, {@link Window_NameEdit#setup}.<br/>
   */
  _maxLength: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link Window_NameEdit#initialize}.<br/>
   * Written in: {@link Window_NameEdit#add}, {@link Window_NameEdit#back}, {@link Window_NameEdit#initialize}, {@link Window_NameEdit#restoreDefault}, {@link Window_NameEdit#setup}.<br/>
   * Read in: {@link Window_NameEdit#back}, {@link Window_NameEdit#drawChar}, {@link Window_NameEdit#name}, {@link Window_NameEdit#refresh}, {@link Window_NameEdit#restoreDefault}, {@link Window_NameEdit#setup}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Window_NameEdit#refresh}, {@link Window_NameEdit#restoreDefault}, {@link Window_NameEdit#setup}.<br/>
   */
  _name: string;
  /**
   * Gets add.
   * @param ch The ch parameter.
   * @returns The result.
   */
  add(ch: unknown): boolean;
  /**
   * Gets back.
   * @returns The result.
   */
  back(): boolean;
  /**
   * Gets char width.
   * @returns The result.
   */
  charWidth(): unknown;
  /**
   * Performs draw char.
   * @param index The index parameter.
   */
  drawChar(index: unknown): void;
  /**
   * Performs draw underline.
   * @param index The index parameter.
   */
  drawUnderline(index: unknown): void;
  /**
   * Gets face width.
   * @returns The result.
   */
  faceWidth(): number;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: unknown): void;
  /**
   * Gets item rect.
   * @param index The index parameter.
   * @returns The result.
   */
  itemRect(index: unknown): Rectangle;
  /**
   * Gets left.
   * @returns The result.
   */
  left(): unknown;
  /**
   * Gets name.
   * @returns The result.
   */
  name(): unknown;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Gets restore default.
   * @returns The result.
   */
  restoreDefault(): boolean;
  /**
   * Performs setup.
   * @param actor The actor parameter.
   * @param maxLength The maxLength parameter.
   */
  setup(actor: unknown, maxLength: unknown): void;
  /**
   * Gets underline color.
   * @returns The result.
   */
  underlineColor(): unknown;
  /**
   * Gets underline rect.
   * @param index The index parameter.
   * @returns The result.
   */
  underlineRect(index: unknown): unknown;
}
