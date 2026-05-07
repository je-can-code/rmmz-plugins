/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Name
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Name
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _battler: null | Game_Battler;
  _name: string;
  _textColor: string;
  bitmapHeight(): number;
  bitmapWidth(): number;
  createBitmap(): void;
  destroy(options: object): void;
  fontFace(): string;
  fontSize(): number;
  initMembers(): void;
  initialize(): void;
  name(): string;
  outlineColor(): string;
  outlineWidth(): number;
  redraw(): void;
  setup(battler: Game_Battler): void;
  setupFont(): void;
  textColor(): string;
  update(): void;
  updateBitmap(): void;
}
