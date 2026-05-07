/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Weapon
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Weapon
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _animationCount: number;
  _pattern: number;
  _weaponImageId: number;
  animationWait(): number;
  initMembers(): void;
  initialize(): void;
  isPlaying(): boolean;
  loadBitmap(): void;
  setup(weaponImageId: number): void;
  update(): void;
  updateFrame(): void;
  updatePattern(): void;
}
