/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Balloon
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Balloon
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _balloonId: number;
  _duration: number;
  _target: null | Sprite;
  frameIndex(): number;
  initMembers(): void;
  initialize(): void;
  isPlaying(): boolean;
  loadBitmap(): void;
  setup(targetSprite: Sprite, balloonId: number): void;
  speed(): number;
  update(): void;
  updateFrame(): void;
  updatePosition(): void;
  waitTime(): number;
}
