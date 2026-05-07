/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_ScrollText
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_ScrollText
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _allTextHeight: number;
  _blockHeight: number;
  _blockIndex: number;
  _maxBitmapHeight: number;
  _reservedRect: Rectangle;
  _scrollY: number;
  _text: string | null;
  contentsHeight(): number;
  fastForwardRate(): number;
  initialize(rect: Rectangle): void;
  isFastForward(): boolean;
  refresh(): void;
  scrollSpeed(): number;
  startMessage(): void;
  terminateMessage(): void;
  update(): void;
  updateMessage(): void;
  updatePlacement(): void;
}
