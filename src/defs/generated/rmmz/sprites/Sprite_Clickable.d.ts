/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Clickable
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Clickable
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _hovered: boolean;
  _pressed: boolean;
  hitTest(x: number, y: number): boolean;
  initialize(): void;
  isBeingTouched(): boolean;
  isClickEnabled(): boolean;
  isPressed(): boolean;
  onClick(): void;
  onMouseEnter(): void;
  onMouseExit(): void;
  onPress(): void;
  processTouch(): void;
  update(): void;
}
