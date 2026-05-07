/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_NameBox
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_NameBox
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _messageWindow: Window_Base;
  _name: string;
  clear(): void;
  initialize(): void;
  refresh(): void;
  setMessageWindow(messageWindow: Window_Base): void;
  setName(name: string): void;
  start(): void;
  updateBackground(): void;
  updatePlacement(): void;
  windowHeight(): number;
  windowWidth(): number;
}
