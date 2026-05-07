/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Damage
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Damage
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _colorType: number;
  _duration: number;
  _flashColor: number[];
  _flashDuration: number;
  createBitmap(width: number, height: number): Bitmap;
  createChildSprite(width: number, height: number): Sprite;
  createDigits(value: number): void;
  createMiss(): void;
  damageColor(): number;
  destroy(options: object): void;
  fontFace(): string;
  fontSize(): number;
  initialize(): void;
  isPlaying(): boolean;
  outlineColor(): string;
  outlineWidth(): number;
  setup(target: Game_Battler): void;
  setupCriticalEffect(): void;
  update(): void;
  updateChild(sprite: Sprite): void;
  updateFlash(): void;
  updateOpacity(): void;
}
