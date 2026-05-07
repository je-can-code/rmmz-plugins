/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_AnimationMV
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_AnimationMV extends Sprite
{
  /**
   * Inferred engine backing field.
   *
   * Type: `null | object`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setup}.
   * Read in: {@link Sprite_AnimationMV#currentFrameIndex}, {@link Sprite_AnimationMV#loadBitmaps}, {@link Sprite_AnimationMV#setup}, {@link Sprite_AnimationMV#setupDuration}, {@link Sprite_AnimationMV#updateFrame}, {@link Sprite_AnimationMV#updatePosition}.
   */
  _animation: null | object;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#loadBitmaps}.
   * Read in: {@link Sprite_AnimationMV#isReady}, {@link Sprite_AnimationMV#updateCellSprite}.
   */
  _bitmap1: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#loadBitmaps}.
   * Read in: {@link Sprite_AnimationMV#isReady}, {@link Sprite_AnimationMV#updateCellSprite}.
   */
  _bitmap2: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#createCellSprites}, {@link Sprite_AnimationMV#initMembers}.
   * Read in: {@link Sprite_AnimationMV#createCellSprites}, {@link Sprite_AnimationMV#updateAllCellSprites}.
   *
   * Consumed by:
   * - `.length`: {@link Sprite_AnimationMV#updateAllCellSprites}.
   * - `push()`: {@link Sprite_AnimationMV#createCellSprites}.
   */
  _cellSprites: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setup}, {@link Sprite_AnimationMV#updateMain}.
   * Read in: {@link Sprite_AnimationMV#updateMain}.
   */
  _delay: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setupDuration}, {@link Sprite_AnimationMV#updateMain}.
   * Read in: {@link Sprite_AnimationMV#currentFrameIndex}, {@link Sprite_AnimationMV#isPlaying}, {@link Sprite_AnimationMV#updateFrame}, {@link Sprite_AnimationMV#updateMain}.
   */
  _duration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number[]`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#startFlash}.
   * Read in: {@link Sprite_AnimationMV#updateFlash}.
   */
  _flashColor: number[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#onEnd}, {@link Sprite_AnimationMV#startFlash}, {@link Sprite_AnimationMV#updateFlash}.
   * Read in: {@link Sprite_AnimationMV#updateFlash}.
   */
  _flashDuration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#onEnd}, {@link Sprite_AnimationMV#startHiding}, {@link Sprite_AnimationMV#updateHiding}.
   * Read in: {@link Sprite_AnimationMV#updateHiding}.
   */
  _hidingDuration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#loadBitmaps}.
   * Read in: {@link Sprite_AnimationMV#updateCellSprite}.
   */
  _hue1: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#loadBitmaps}.
   * Read in: {@link Sprite_AnimationMV#updateCellSprite}.
   */
  _hue2: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setup}.
   * Read in: {@link Sprite_AnimationMV#updateCellSprite}.
   */
  _mirror: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setupRate}.
   * Read in: {@link Sprite_AnimationMV#currentFrameIndex}, {@link Sprite_AnimationMV#processTimingData}, {@link Sprite_AnimationMV#setupDuration}, {@link Sprite_AnimationMV#updateMain}.
   */
  _rate: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#onEnd}, {@link Sprite_AnimationMV#startScreenFlash}, {@link Sprite_AnimationMV#updateScreenFlash}.
   * Read in: {@link Sprite_AnimationMV#updateScreenFlash}.
   */
  _screenFlashDuration: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | ScreenSprite`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#createScreenFlashSprite}, {@link Sprite_AnimationMV#initMembers}.
   * Read in: {@link Sprite_AnimationMV#createScreenFlashSprite}, {@link Sprite_AnimationMV#startScreenFlash}, {@link Sprite_AnimationMV#updateScreenFlash}.
   */
  _screenFlashSprite: null | ScreenSprite;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[] | Sprite[]`.
   * Initialized in: none.
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setup}.
   * Read in: {@link Sprite_AnimationMV#onEnd}, {@link Sprite_AnimationMV#startHiding}, {@link Sprite_AnimationMV#updateAllCellSprites}, {@link Sprite_AnimationMV#updateFlash}, {@link Sprite_AnimationMV#updateHiding}, {@link Sprite_AnimationMV#updatePosition}.
   *
   * Consumed by:
   * - `.length`: {@link Sprite_AnimationMV#updateAllCellSprites}, {@link Sprite_AnimationMV#updatePosition}.
   */
  _targets: unknown[] | Sprite[];
  /**
   * Gets absolute x.
   * @returns The result.
   */
  absoluteX(): number;
  /**
   * Gets absolute y.
   * @returns The result.
   */
  absoluteY(): number;
  /**
   * Creates cell sprites.
   */
  createCellSprites(): void;
  /**
   * Creates screen flash sprite.
   */
  createScreenFlashSprite(): void;
  /**
   * Gets current frame index.
   * @returns The result.
   */
  currentFrameIndex(): number;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether playing.
   * @returns True if playing; false otherwise.
   */
  isPlaying(): boolean;
  /**
   * Determines whether ready.
   * @returns True if ready; false otherwise.
   */
  isReady(): boolean;
  /**
   * Performs load bitmaps.
   */
  loadBitmaps(): void;
  /**
   * Performs on end.
   */
  onEnd(): void;
  /**
   * Performs process timing data.
   * @param timing The timing parameter.
   */
  processTimingData(timing: number): void;
  /**
   * Performs setup.
   * @param targets The targets parameter.
   * @param animation The animation parameter.
   * @param mirror The mirror parameter.
   * @param delay The delay parameter.
   */
  setup(targets: Sprite[], animation: object, mirror: boolean, delay: number): void;
  /**
   * Performs setup duration.
   */
  setupDuration(): void;
  /**
   * Performs setup rate.
   */
  setupRate(): void;
  /**
   * Performs start flash.
   * @param color The color parameter.
   * @param duration The duration parameter.
   */
  startFlash(color: [number, number, number, number], duration: number): void;
  /**
   * Performs start hiding.
   * @param duration The duration parameter.
   */
  startHiding(duration: number): void;
  /**
   * Performs start screen flash.
   * @param color The color parameter.
   * @param duration The duration parameter.
   */
  startScreenFlash(color: [number, number, number, number], duration: number): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates all cell sprites.
   * @param frame The frame parameter.
   */
  updateAllCellSprites(frame: number[][]): void;
  /**
   * Updates cell sprite.
   * @param sprite The sprite parameter.
   * @param cell The cell parameter.
   */
  updateCellSprite(sprite: Sprite, cell: number[]): void;
  /**
   * Updates flash.
   */
  updateFlash(): void;
  /**
   * Updates frame.
   */
  updateFrame(): void;
  /**
   * Updates hiding.
   */
  updateHiding(): void;
  /**
   * Updates main.
   */
  updateMain(): void;
  /**
   * Updates position.
   */
  updatePosition(): void;
  /**
   * Updates screen flash.
   */
  updateScreenFlash(): void;
}
