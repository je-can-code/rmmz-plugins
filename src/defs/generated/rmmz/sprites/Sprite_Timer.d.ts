/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Timer
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Timer
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _seconds: number;
  createBitmap(): void;
  destroy(options: object): void;
  fontFace(): string;
  fontSize(): number;
  initialize(): void;
  redraw(): void;
  timerText(): string;
  update(): void;
  updateBitmap(): void;
  updatePosition(): void;
  updateVisibility(): void;
}
