/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_StateIcon
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_StateIcon
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_StateIcon#initMembers}, {@link Sprite_StateIcon#setup}, {@link Sprite_StateIcon#update}.
   * Read in: {@link Sprite_StateIcon#update}.
   */
  _animationCount: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_StateIcon#initMembers}, {@link Sprite_StateIcon#updateIcon}.
   * Read in: {@link Sprite_StateIcon#updateIcon}.
   */
  _animationIndex: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Game_Battler`.
   * Initialized in: none.
   * Written in: {@link Sprite_StateIcon#initMembers}, {@link Sprite_StateIcon#setup}.
   * Read in: {@link Sprite_StateIcon#setup}, {@link Sprite_StateIcon#shouldDisplay}, {@link Sprite_StateIcon#updateIcon}.
   */
  _battler: null | Game_Battler;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: none.
   * Written in: {@link Sprite_StateIcon#initMembers}, {@link Sprite_StateIcon#updateIcon}.
   * Read in: {@link Sprite_StateIcon#updateFrame}.
   */
  _iconIndex: number;
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
   * Gets should display.
   * @returns The result.
   */
  shouldDisplay(): boolean;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates frame.
   */
  updateFrame(): void;
  /**
   * Updates icon.
   */
  updateIcon(): void;
}
