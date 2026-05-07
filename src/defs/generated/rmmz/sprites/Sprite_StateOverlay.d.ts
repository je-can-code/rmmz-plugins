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
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_StateOverlay#initMembers}, {@link Sprite_StateOverlay#update}.
   * Read in: {@link Sprite_StateOverlay#update}.
   */
  _animationCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Game_Battler`.
   * Initialized in: none.
   * Written in: {@link Sprite_StateOverlay#initMembers}, {@link Sprite_StateOverlay#setup}.
   * Read in: {@link Sprite_StateOverlay#updatePattern}.
   */
  _battler: null | Game_Battler;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_StateOverlay#initMembers}, {@link Sprite_StateOverlay#updatePattern}.
   * Read in: {@link Sprite_StateOverlay#updateFrame}.
   */
  _overlayIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_StateOverlay#initMembers}, {@link Sprite_StateOverlay#updatePattern}.
   * Read in: {@link Sprite_StateOverlay#updateFrame}.
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
