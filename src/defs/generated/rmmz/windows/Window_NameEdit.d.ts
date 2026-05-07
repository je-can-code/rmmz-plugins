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
   * Inferred engine backing field.
   *
   * Type: `null | Game_Actor`.
   * Initialized in: {@link Window_NameEdit#initialize}.
   * Written in: {@link Window_NameEdit#initialize}, {@link Window_NameEdit#setup}.
   * Read in: {@link Window_NameEdit#refresh}.
   */
  _actor: null | Game_Actor;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_NameEdit#initialize}.
   * Written in: {@link Window_NameEdit#initialize}, {@link Window_NameEdit#setup}.
   * Read in: {@link Window_NameEdit#restoreDefault}.
   */
  _defaultName: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_NameEdit#initialize}.
   * Written in: {@link Window_NameEdit#add}, {@link Window_NameEdit#back}, {@link Window_NameEdit#initialize}, {@link Window_NameEdit#restoreDefault}, {@link Window_NameEdit#setup}.
   * Read in: {@link Window_NameEdit#add}, {@link Window_NameEdit#back}, {@link Window_NameEdit#refresh}.
   */
  _index: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Window_NameEdit#initialize}.
   * Written in: {@link Window_NameEdit#initialize}, {@link Window_NameEdit#setup}.
   * Read in: {@link Window_NameEdit#add}, {@link Window_NameEdit#left}, {@link Window_NameEdit#refresh}, {@link Window_NameEdit#setup}.
   */
  _maxLength: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: {@link Window_NameEdit#initialize}.
   * Written in: {@link Window_NameEdit#add}, {@link Window_NameEdit#back}, {@link Window_NameEdit#initialize}, {@link Window_NameEdit#restoreDefault}, {@link Window_NameEdit#setup}.
   * Read in: {@link Window_NameEdit#back}, {@link Window_NameEdit#drawChar}, {@link Window_NameEdit#name}, {@link Window_NameEdit#refresh}, {@link Window_NameEdit#restoreDefault}, {@link Window_NameEdit#setup}.
   *
   * Consumed by:
   * - `.length`: {@link Window_NameEdit#refresh}, {@link Window_NameEdit#restoreDefault}, {@link Window_NameEdit#setup}.
   */
  _name: string;
  /**
   * Gets add.
   * @param ch The ch parameter.
   * @returns The result.
   */
  add(ch: string): boolean;
  /**
   * Gets back.
   * @returns The result.
   */
  back(): boolean;
  /**
   * Gets char width.
   * @returns The result.
   */
  charWidth(): number;
  /**
   * Performs draw char.
   * @param index The index parameter.
   */
  drawChar(index: number): void;
  /**
   * Performs draw underline.
   * @param index The index parameter.
   */
  drawUnderline(index: number): void;
  /**
   * Gets face width.
   * @returns The result.
   */
  faceWidth(): number;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Gets item rect.
   * @param index The index parameter.
   * @returns The result.
   */
  itemRect(index: number): Rectangle;
  /**
   * Gets left.
   * @returns The result.
   */
  left(): number;
  /**
   * Gets name.
   * @returns The result.
   */
  name(): string;
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
  setup(actor: Game_Actor, maxLength: number): void;
  /**
   * Gets underline color.
   * @returns The result.
   */
  underlineColor(): string;
  /**
   * Gets underline rect.
   * @param index The index parameter.
   * @returns The result.
   */
  underlineRect(index: number): Rectangle;
}
