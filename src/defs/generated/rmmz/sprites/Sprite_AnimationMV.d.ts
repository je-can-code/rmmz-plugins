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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setup}.<br/>
   * Read in: {@link Sprite_AnimationMV#currentFrameIndex}, {@link Sprite_AnimationMV#loadBitmaps}, {@link Sprite_AnimationMV#setup}, {@link Sprite_AnimationMV#setupDuration}, {@link Sprite_AnimationMV#updateFrame}, {@link Sprite_AnimationMV#updatePosition}.<br/>
   */
  _animation: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#loadBitmaps}.<br/>
   * Read in: {@link Sprite_AnimationMV#isReady}, {@link Sprite_AnimationMV#updateCellSprite}.<br/>
   */
  _bitmap1: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#loadBitmaps}.<br/>
   * Read in: {@link Sprite_AnimationMV#isReady}, {@link Sprite_AnimationMV#updateCellSprite}.<br/>
   */
  _bitmap2: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#createCellSprites}, {@link Sprite_AnimationMV#initMembers}.<br/>
   * Read in: {@link Sprite_AnimationMV#createCellSprites}, {@link Sprite_AnimationMV#updateAllCellSprites}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Sprite_AnimationMV#updateAllCellSprites}.<br/>
   * - `push()`: {@link Sprite_AnimationMV#createCellSprites}.<br/>
   */
  _cellSprites: unknown[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setup}, {@link Sprite_AnimationMV#updateMain}.<br/>
   * Read in: {@link Sprite_AnimationMV#updateMain}.<br/>
   */
  _delay: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setupDuration}, {@link Sprite_AnimationMV#updateMain}.<br/>
   * Read in: {@link Sprite_AnimationMV#currentFrameIndex}, {@link Sprite_AnimationMV#isPlaying}, {@link Sprite_AnimationMV#updateFrame}, {@link Sprite_AnimationMV#updateMain}.<br/>
   */
  _duration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#startFlash}.<br/>
   * Read in: {@link Sprite_AnimationMV#updateFlash}.<br/>
   */
  _flashColor: number[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#onEnd}, {@link Sprite_AnimationMV#startFlash}, {@link Sprite_AnimationMV#updateFlash}.<br/>
   * Read in: {@link Sprite_AnimationMV#updateFlash}.<br/>
   */
  _flashDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#onEnd}, {@link Sprite_AnimationMV#startHiding}, {@link Sprite_AnimationMV#updateHiding}.<br/>
   * Read in: {@link Sprite_AnimationMV#updateHiding}.<br/>
   */
  _hidingDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#loadBitmaps}.<br/>
   * Read in: {@link Sprite_AnimationMV#updateCellSprite}.<br/>
   */
  _hue1: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#loadBitmaps}.<br/>
   * Read in: {@link Sprite_AnimationMV#updateCellSprite}.<br/>
   */
  _hue2: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setup}.<br/>
   * Read in: {@link Sprite_AnimationMV#updateCellSprite}.<br/>
   */
  _mirror: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setupRate}.<br/>
   * Read in: {@link Sprite_AnimationMV#currentFrameIndex}, {@link Sprite_AnimationMV#processTimingData}, {@link Sprite_AnimationMV#setupDuration}, {@link Sprite_AnimationMV#updateMain}.<br/>
   */
  _rate: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#onEnd}, {@link Sprite_AnimationMV#startScreenFlash}, {@link Sprite_AnimationMV#updateScreenFlash}.<br/>
   * Read in: {@link Sprite_AnimationMV#updateScreenFlash}.<br/>
   */
  _screenFlashDuration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | ScreenSprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#createScreenFlashSprite}, {@link Sprite_AnimationMV#initMembers}.<br/>
   * Read in: {@link Sprite_AnimationMV#createScreenFlashSprite}, {@link Sprite_AnimationMV#startScreenFlash}, {@link Sprite_AnimationMV#updateScreenFlash}.<br/>
   */
  _screenFlashSprite: null | ScreenSprite;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown[]`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_AnimationMV#initMembers}, {@link Sprite_AnimationMV#setup}.<br/>
   * Read in: {@link Sprite_AnimationMV#onEnd}, {@link Sprite_AnimationMV#startHiding}, {@link Sprite_AnimationMV#updateAllCellSprites}, {@link Sprite_AnimationMV#updateFlash}, {@link Sprite_AnimationMV#updateHiding}, {@link Sprite_AnimationMV#updatePosition}.<br/>
   *<br/>
   * Consumed by:<br/>
   * - `.length`: {@link Sprite_AnimationMV#updateAllCellSprites}, {@link Sprite_AnimationMV#updatePosition}.<br/>
   */
  _targets: unknown[];
  /**
   * Gets absolute x.
   * @returns The result.
   */
  absoluteX(): unknown;
  /**
   * Gets absolute y.
   * @returns The result.
   */
  absoluteY(): unknown;
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
  currentFrameIndex(): unknown;
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
  processTimingData(timing: unknown): void;
  /**
   * Performs setup.
   * @param targets The targets parameter.
   * @param animation The animation parameter.
   * @param mirror The mirror parameter.
   * @param delay The delay parameter.
   */
  setup(targets: unknown, animation: unknown, mirror: unknown, delay: unknown): void;
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
  startFlash(color: unknown, duration: unknown): void;
  /**
   * Performs start hiding.
   * @param duration The duration parameter.
   */
  startHiding(duration: unknown): void;
  /**
   * Performs start screen flash.
   * @param color The color parameter.
   * @param duration The duration parameter.
   */
  startScreenFlash(color: unknown, duration: unknown): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates all cell sprites.
   * @param frame The frame parameter.
   */
  updateAllCellSprites(frame: unknown): void;
  /**
   * Updates cell sprite.
   * @param sprite The sprite parameter.
   * @param cell The cell parameter.
   */
  updateCellSprite(sprite: unknown, cell: unknown): void;
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
