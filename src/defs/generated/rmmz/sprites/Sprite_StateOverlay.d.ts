/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_StateOverlay
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_StateOverlay extends Sprite
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_StateOverlay#initMembers}, {@link Sprite_StateOverlay#update}.<br/>
   * Read in: {@link Sprite_StateOverlay#update}.<br/>
   */
  _animationCount: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Game_Battler`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_StateOverlay#initMembers}, {@link Sprite_StateOverlay#setup}.<br/>
   * Read in: {@link Sprite_StateOverlay#updatePattern}.<br/>
   */
  _battler: null | Game_Battler;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_StateOverlay#initMembers}, {@link Sprite_StateOverlay#updatePattern}.<br/>
   * Read in: {@link Sprite_StateOverlay#updateFrame}.<br/>
   */
  _overlayIndex: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite_StateOverlay#initMembers}, {@link Sprite_StateOverlay#updatePattern}.<br/>
   * Read in: {@link Sprite_StateOverlay#updateFrame}.<br/>
   */
  _pattern: number;
  /**
   * Gets animation wait.
   * @returns The result.
   */
  animationWait(): number;
  /**
   * Initializes members.
   */
  initMembers(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Performs load bitmap.
   */
  loadBitmap(): void;
  /**
   * Performs setup.
   * @param battler The battler parameter.
   */
  setup(battler: Game_Battler): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates frame.
   */
  updateFrame(): void;
  /**
   * Updates pattern.
   */
  updatePattern(): void;
}
