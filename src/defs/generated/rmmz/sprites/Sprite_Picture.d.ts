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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Sprite_Picture#initialize}.<br/>
   * Written in: {@link Sprite_Picture#initialize}.<br/>
   * Read in: {@link Sprite_Picture#picture}.<br/>
   */
  _pictureId: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `string`.<br/>
   * Initialized in: {@link Sprite_Picture#initialize}.<br/>
   * Written in: {@link Sprite_Picture#initialize}, {@link Sprite_Picture#updateBitmap}.<br/>
   * Read in: {@link Sprite_Picture#loadBitmap}, {@link Sprite_Picture#updateBitmap}.<br/>
   */
  _pictureName: string;
  /**
   * Initializes initialize.
   * @param pictureId The pictureId parameter.
   */
  initialize(pictureId: unknown): void;
  /**
   * Performs load bitmap.
   */
  loadBitmap(): void;
  /**
   * Gets picture.
   * @returns The result.
   */
  picture(): unknown;
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
