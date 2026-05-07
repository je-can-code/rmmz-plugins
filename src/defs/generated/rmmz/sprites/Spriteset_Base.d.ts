/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Spriteset_Base
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Spriteset_Base
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _animationSprites: unknown[];
  _baseColorFilter: ColorFilter;
  _baseSprite: Sprite;
  _blackScreen: ScreenSprite;
  _overallColorFilter: ColorFilter;
  _pictureContainer: Sprite;
  _timerSprite: Sprite_Timer;
  animationBaseDelay(): number;
  animationNextDelay(): number;
  animationShouldMirror(target: Game_Battler): boolean;
  createAnimation(request: object): void;
  createAnimationSprite(targets: Game_Battler[], animation: object, mirror: boolean, delay: number): void;
  createBaseFilters(): void;
  createBaseSprite(): void;
  createLowerLayer(): void;
  createOverallFilters(): void;
  createPictures(): void;
  createTimer(): void;
  createUpperLayer(): void;
  destroy(options: object): void;
  findTargetSprite(): null;
  initialize(): void;
  isAnimationForEach(animation: object): boolean;
  isAnimationPlaying(): boolean;
  isMVAnimation(animation: object): boolean;
  lastAnimationSprite(): Sprite | undefined;
  loadSystemImages(): void;
  makeTargetSprites(targets: Game_Battler[]): Sprite[];
  pictureContainerRect(): Rectangle;
  processAnimationRequests(): void;
  removeAllAnimations(): void;
  removeAnimation(sprite: Sprite): void;
  update(): void;
  updateAnimations(): void;
  updateBaseFilters(): void;
  updateOverallFilters(): void;
  updatePosition(): void;
}
