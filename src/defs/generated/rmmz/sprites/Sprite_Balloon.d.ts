/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Balloon
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Balloon extends Sprite
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Balloon#initMembers}, {@link Sprite_Balloon#setup}.<br/>
   * Read in: {@link Sprite_Balloon#updateFrame}.<br/>
   */
  _balloonId: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Balloon#initMembers}, {@link Sprite_Balloon#setup}, {@link Sprite_Balloon#update}.<br/>
   * Read in: {@link Sprite_Balloon#frameIndex}, {@link Sprite_Balloon#isPlaying}, {@link Sprite_Balloon#update}.<br/>
   */
  _duration: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Sprite`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_Balloon#initMembers}, {@link Sprite_Balloon#setup}.<br/>
   * Read in: {@link Sprite_Balloon#updatePosition}.<br/>
   */
  _target: null | Sprite;
  /**
   * Gets frame index.
   * @returns The result.
   */
  frameIndex(): number;
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
   * Performs load bitmap.
   */
  loadBitmap(): void;
  /**
   * Performs setup.
   * @param targetSprite The targetSprite parameter.
   * @param balloonId The balloonId parameter.
   */
  setup(targetSprite: Sprite, balloonId: number): void;
  /**
   * Gets speed.
   * @returns The result.
   */
  speed(): number;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates frame.
   */
  updateFrame(): void;
  /**
   * Updates position.
   */
  updatePosition(): void;
  /**
   * Gets wait time.
   * @returns The result.
   */
  waitTime(): number;
}
