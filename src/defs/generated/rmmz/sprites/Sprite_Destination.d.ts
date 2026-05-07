/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Destination
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Destination
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _frameCount: number;
  createBitmap(): void;
  destroy(options: object): void;
  initialize(): void;
  update(): void;
  updateAnimation(): void;
  updatePosition(): void;
}
