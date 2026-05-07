/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_AnimationMV
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_AnimationMV
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _animation: null | object;
  _bitmap1: null;
  _bitmap2: null;
  _cellSprites: unknown[];
  _delay: number;
  _duration: number;
  _flashColor: number[];
  _flashDuration: number;
  _hidingDuration: number;
  _hue1: number;
  _hue2: number;
  _mirror: boolean;
  _rate: number;
  _screenFlashDuration: number;
  _screenFlashSprite: null | ScreenSprite;
  _targets: unknown[] | Sprite[];
  absoluteX(): number;
  absoluteY(): number;
  createCellSprites(): void;
  createScreenFlashSprite(): void;
  currentFrameIndex(): number;
  initMembers(): void;
  initialize(): void;
  isPlaying(): boolean;
  isReady(): boolean;
  loadBitmaps(): void;
  onEnd(): void;
  processTimingData(timing: number): void;
  setup(targets: Sprite[], animation: object, mirror: boolean, delay: number): void;
  setupDuration(): void;
  setupRate(): void;
  startFlash(color: [number, number, number, number], duration: number): void;
  startHiding(duration: number): void;
  startScreenFlash(color: [number, number, number, number], duration: number): void;
  update(): void;
  updateAllCellSprites(frame: number[][]): void;
  updateCellSprite(sprite: Sprite, cell: number[]): void;
  updateFlash(): void;
  updateFrame(): void;
  updateHiding(): void;
  updateMain(): void;
  updatePosition(): void;
  updateScreenFlash(): void;
}
