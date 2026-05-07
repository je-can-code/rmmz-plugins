/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_StateIcon
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_StateIcon
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _animationCount: number;
  _animationIndex: number;
  _battler: null | Game_Battler;
  _iconIndex: number;
  animationWait(): number;
  initMembers(): void;
  initialize(): void;
  loadBitmap(): void;
  setup(battler: Game_Battler): void;
  shouldDisplay(): boolean;
  update(): void;
  updateFrame(): void;
  updateIcon(): void;
}
