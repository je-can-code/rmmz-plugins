/**
 * Generated from project/js/rmmz_core.js
 * Class: TilingSprite
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface TilingSprite
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _bitmap: unknown;
  _emptyBaseTexture: null;
  _frame: unknown;
  _height: number;
  _width: number;
  /**
   * Updates the transform on all children of this container for rendering.
   */
  _onBitmapChange(): void;
  /**
   * Updates the transform on all children of this container for rendering.
   */
  _onBitmapLoad(): void;
  /**
   * Updates the transform on all children of this container for rendering.
   */
  _refresh(): void;
  /**
   * Destroys the tiling sprite.
   */
  destroy(): void;
  /**
   * The sprite object for a tiling image.
   * @param bitmap The image for the tiling sprite.
   */
  initialize(bitmap: Bitmap): void;
  /**
   * Sets the x, y, width, and height all at once.
   * @param x The x coordinate of the tiling sprite.
   * @param y The y coordinate of the tiling sprite.
   * @param width The width of the tiling sprite.
   * @param height The height of the tiling sprite.
   */
  move(x: number, y: number, width: number, height: number): void;
  /**
   * Specifies the region of the image that the tiling sprite will use.
   * @param x The x coordinate of the frame.
   * @param y The y coordinate of the frame.
   * @param width The width of the frame.
   * @param height The height of the frame.
   */
  setFrame(x: number, y: number, width: number, height: number): void;
  /**
   * Updates the tiling sprite for each frame.
   */
  update(): void;
  /**
   * Updates the transform on all children of this container for rendering.
   */
  updateTransform(): void;
}
