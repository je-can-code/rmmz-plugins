/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_NameEdit
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_NameEdit
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: null | Game_Actor;
  _defaultName: number;
  _index: number;
  _maxLength: number;
  _name: string;
  add(ch: string): boolean;
  back(): boolean;
  charWidth(): number;
  drawChar(index: number): void;
  drawUnderline(index: number): void;
  faceWidth(): number;
  initialize(rect: Rectangle): void;
  itemRect(index: number): Rectangle;
  left(): number;
  name(): string;
  refresh(): void;
  restoreDefault(): boolean;
  setup(actor: Game_Actor, maxLength: number): void;
  underlineColor(): string;
  underlineRect(index: number): Rectangle;
}
