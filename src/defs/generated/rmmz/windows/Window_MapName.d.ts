/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_MapName
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_MapName
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _showCount: number;
  close(): void;
  drawBackground(x: number, y: number, width: number, height: number): void;
  initialize(rect: Rectangle): void;
  open(): void;
  refresh(): void;
  update(): void;
  updateFadeIn(): void;
  updateFadeOut(): void;
}
