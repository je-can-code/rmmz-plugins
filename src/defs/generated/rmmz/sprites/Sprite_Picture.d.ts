/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Picture
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Picture extends Sprite_Clickable
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Sprite_Picture#initialize}.
   * Written in: {@link Sprite_Picture#initialize}.
   * Read in: {@link Sprite_Picture#picture}.
   */
  _pictureId: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: {@link Sprite_Picture#initialize}.
   * Written in: {@link Sprite_Picture#initialize}, {@link Sprite_Picture#updateBitmap}.
   * Read in: {@link Sprite_Picture#loadBitmap}, {@link Sprite_Picture#updateBitmap}.
   */
  _pictureName: string;
  /**
   * Initializes initialize.
   * @param pictureId The pictureId parameter.
   */
  initialize(pictureId: number): void;
  /**
   * Performs load bitmap.
   */
  loadBitmap(): void;
  /**
   * Gets picture.
   * @returns The result.
   */
  picture(): Game_Picture | null;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates bitmap.
   */
  updateBitmap(): void;
  /**
   * Updates origin.
   */
  updateOrigin(): void;
  /**
   * Updates other.
   */
  updateOther(): void;
  /**
   * Updates position.
   */
  updatePosition(): void;
  /**
   * Updates scale.
   */
  updateScale(): void;
  /**
   * Updates tone.
   */
  updateTone(): void;
}
