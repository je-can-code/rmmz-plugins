/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Destination
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Destination extends Sprite
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Sprite_Destination#initialize}.
   * Written in: {@link Sprite_Destination#initialize}, {@link Sprite_Destination#update}, {@link Sprite_Destination#updateAnimation}.
   * Read in: {@link Sprite_Destination#updateAnimation}.
   */
  _frameCount: number;
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
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates animation.
   */
  updateAnimation(): void;
  /**
   * Updates position.
   */
  updatePosition(): void;
}
