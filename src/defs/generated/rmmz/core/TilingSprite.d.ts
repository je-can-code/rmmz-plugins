/**
 * Generated from project/js/rmmz_core.js
 * Class: TilingSprite
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface TilingSprite extends PIXI.TilingSprite
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link TilingSprite#initialize}.<br/>
   * Written in: {@link TilingSprite#initialize}.<br/>
   * Read in: {@link TilingSprite#_onBitmapChange}, {@link TilingSprite#_onBitmapLoad}, {@link TilingSprite#_refresh}.<br/>
   */
  _bitmap: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: none.<br/>
   */
  _emptyBaseTexture: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link TilingSprite#initialize}.<br/>
   * Written in: {@link TilingSprite#initialize}.<br/>
   * Read in: {@link TilingSprite#_refresh}, {@link TilingSprite#setFrame}.<br/>
   */
  _frame: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link TilingSprite#initialize}.<br/>
   * Written in: {@link TilingSprite#initialize}, {@link TilingSprite#move}.<br/>
   * Read in: none.<br/>
   */
  _height: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link TilingSprite#initialize}.<br/>
   * Written in: {@link TilingSprite#initialize}, {@link TilingSprite#move}.<br/>
   * Read in: none.<br/>
   */
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
   * The image for the tiling sprite.
   * @returns The result.
   */
  get bitmap(): unknown;
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
   * The opacity of the tiling sprite (0 to 255).
   * @returns The result.
   */
  get opacity(): number;
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
