/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Picture
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Picture
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _pictureId: number;
  _pictureName: string;
  initialize(pictureId: number): void;
  loadBitmap(): void;
  picture(): Game_Picture | null;
  update(): void;
  updateBitmap(): void;
  updateOrigin(): void;
  updateOther(): void;
  updatePosition(): void;
  updateScale(): void;
  updateTone(): void;
}
