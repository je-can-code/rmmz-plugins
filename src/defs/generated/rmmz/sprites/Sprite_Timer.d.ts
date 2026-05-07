/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Timer
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Timer extends Sprite
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Sprite_Timer#initialize}.
   * Written in: {@link Sprite_Timer#initialize}, {@link Sprite_Timer#updateBitmap}.
   * Read in: {@link Sprite_Timer#timerText}, {@link Sprite_Timer#updateBitmap}.
   */
  _seconds: number;
  /**
   * Creates bitmap.
   */
  createBitmap(): void;
  /**
   * Performs destroy.
   * @param options The options parameter.
   */
  destroy(options: object): void;
  /**
   * Gets font face.
   * @returns The result.
   */
  fontFace(): string;
  /**
   * Gets font size.
   * @returns The result.
   */
  fontSize(): number;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Performs redraw.
   */
  redraw(): void;
  /**
   * Gets timer text.
   * @returns The result.
   */
  timerText(): string;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates bitmap.
   */
  updateBitmap(): void;
  /**
   * Updates position.
   */
  updatePosition(): void;
  /**
   * Updates visibility.
   */
  updateVisibility(): void;
}
