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
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Spriteset_Base#initialize}.
   * Written in: {@link Spriteset_Base#initialize}.
   * Read in: {@link Spriteset_Base#createAnimationSprite}, {@link Spriteset_Base#isAnimationPlaying}, {@link Spriteset_Base#lastAnimationSprite}, {@link Spriteset_Base#removeAllAnimations}, {@link Spriteset_Base#removeAnimation}, {@link Spriteset_Base#updateAnimations}.
   *
   * Consumed by:
   * - `.length`: {@link Spriteset_Base#isAnimationPlaying}, {@link Spriteset_Base#lastAnimationSprite}.
   * - `push()`: {@link Spriteset_Base#createAnimationSprite}.
   */
  _animationSprites: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `ColorFilter`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Base#createBaseFilters}.
   * Read in: {@link Spriteset_Base#createBaseFilters}, {@link Spriteset_Base#updateBaseFilters}.
   */
  _baseColorFilter: ColorFilter;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Base#createBaseSprite}.
   * Read in: {@link Spriteset_Base#createBaseFilters}, {@link Spriteset_Base#createBaseSprite}.
   */
  _baseSprite: Sprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `ScreenSprite`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Base#createBaseSprite}.
   * Read in: {@link Spriteset_Base#createBaseSprite}.
   */
  _blackScreen: ScreenSprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `ColorFilter`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Base#createOverallFilters}.
   * Read in: {@link Spriteset_Base#createOverallFilters}, {@link Spriteset_Base#updateOverallFilters}.
   */
  _overallColorFilter: ColorFilter;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Base#createPictures}.
   * Read in: {@link Spriteset_Base#createPictures}.
   */
  _pictureContainer: Sprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `Sprite_Timer`.
   * Initialized in: none.
   * Written in: {@link Spriteset_Base#createTimer}.
   * Read in: {@link Spriteset_Base#createTimer}.
   */
  _timerSprite: Sprite_Timer;
  /**
   * Gets animation base delay.
   * @returns The result.
   */
  animationBaseDelay(): number;
  /**
   * Gets animation next delay.
   * @returns The result.
   */
  animationNextDelay(): number;
  /**
   * Gets animation should mirror.
   * @param target The target parameter.
   * @returns The result.
   */
  animationShouldMirror(target: Game_Battler): boolean;
  /**
   * Creates animation.
   * @param request The request parameter.
   */
  createAnimation(request: object): void;
  /**
   * Creates animation sprite.
   * @param targets The targets parameter.
   * @param animation The animation parameter.
   * @param mirror The mirror parameter.
   * @param delay The delay parameter.
   */
  createAnimationSprite(targets: Game_Battler[], animation: object, mirror: boolean, delay: number): void;
  /**
   * Creates base filters.
   */
  createBaseFilters(): void;
  /**
   * Creates base sprite.
   */
  createBaseSprite(): void;
  /**
   * Creates lower layer.
   */
  createLowerLayer(): void;
  /**
   * Creates overall filters.
   */
  createOverallFilters(): void;
  /**
   * Creates pictures.
   */
  createPictures(): void;
  /**
   * Creates timer.
   */
  createTimer(): void;
  /**
   * Creates upper layer.
   */
  createUpperLayer(): void;
  /**
   * Performs destroy.
   * @param options The options parameter.
   */
  destroy(options: object): void;
  /**
   * Gets find target sprite.
   * @returns The result.
   */
  findTargetSprite(): null;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether animation for each.
   * @param animation The animation parameter.
   * @returns True if animation for each; false otherwise.
   */
  isAnimationForEach(animation: object): boolean;
  /**
   * Determines whether animation playing.
   * @returns True if animation playing; false otherwise.
   */
  isAnimationPlaying(): boolean;
  /**
   * Determines whether mvanimation.
   * @param animation The animation parameter.
   * @returns True if mvanimation; false otherwise.
   */
  isMVAnimation(animation: object): boolean;
  /**
   * Gets last animation sprite.
   * @returns The result.
   */
  lastAnimationSprite(): Sprite | undefined;
  /**
   * Performs load system images.
   */
  loadSystemImages(): void;
  /**
   * Creates target sprites.
   * @param targets The targets parameter.
   * @returns The result.
   */
  makeTargetSprites(targets: Game_Battler[]): Sprite[];
  /**
   * Gets picture container rect.
   * @returns The result.
   */
  pictureContainerRect(): Rectangle;
  /**
   * Performs process animation requests.
   */
  processAnimationRequests(): void;
  /**
   * Removes all animations.
   */
  removeAllAnimations(): void;
  /**
   * Removes animation.
   * @param sprite The sprite parameter.
   */
  removeAnimation(sprite: Sprite): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates animations.
   */
  updateAnimations(): void;
  /**
   * Updates base filters.
   */
  updateBaseFilters(): void;
  /**
   * Updates overall filters.
   */
  updateOverallFilters(): void;
  /**
   * Updates position.
   */
  updatePosition(): void;
}
