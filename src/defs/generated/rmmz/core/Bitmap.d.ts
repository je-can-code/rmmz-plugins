/**
 * Generated from project/js/rmmz_core.js
 * Class: Bitmap
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Bitmap
{
  /**
   * Inferred engine backing field.
   *
   * Type: `null | PIXI.BaseTexture`.
   * Initialized in: {@link Bitmap#initialize}.
   * Written in: {@link Bitmap#_createBaseTexture}, {@link Bitmap#destroy}, {@link Bitmap#initialize}.
   * Read in: {@link Bitmap#_createBaseTexture}, {@link Bitmap#_updateScaleMode}, {@link Bitmap#blt}, {@link Bitmap#clearRect}, {@link Bitmap#destroy}, {@link Bitmap#drawCircle}, {@link Bitmap#drawText}, {@link Bitmap#fillRect}, {@link Bitmap#gradientFillRect}, {@link Bitmap#strokeRect}.
   */
  _baseTexture: null | PIXI.BaseTexture;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Bitmap#initialize}.
   * Written in: {@link Bitmap#_createCanvas}, {@link Bitmap#_destroyCanvas}, {@link Bitmap#initialize}.
   * Read in: {@link Bitmap#_createCanvas}, {@link Bitmap#_destroyCanvas}, {@link Bitmap#_ensureCanvas}.
   */
  _canvas: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: {@link Bitmap#initialize}.
   * Written in: {@link Bitmap#_createCanvas}, {@link Bitmap#initialize}.
   * Read in: {@link Bitmap#_ensureCanvas}.
   */
  _context: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | Image`.
   * Initialized in: {@link Bitmap#initialize}.
   * Written in: {@link Bitmap#_startLoading}, {@link Bitmap#initialize}.
   * Read in: {@link Bitmap#_ensureCanvas}, {@link Bitmap#_onLoad}, {@link Bitmap#_onXhrLoad}, {@link Bitmap#_startLoading}.
   */
  _image: null | Image;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown[]`.
   * Initialized in: {@link Bitmap#initialize}.
   * Written in: {@link Bitmap#initialize}.
   * Read in: {@link Bitmap#_callLoadListeners}, {@link Bitmap#addLoadListener}.
   *
   * Consumed by:
   * - `.length`: {@link Bitmap#_callLoadListeners}.
   * - `push()`: {@link Bitmap#addLoadListener}.
   * - `shift()`: {@link Bitmap#_callLoadListeners}.
   */
  _loadListeners: unknown[];
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: {@link Bitmap#initialize}.
   * Written in: {@link Bitmap#_onError}, {@link Bitmap#_onLoad}, {@link Bitmap#_startLoading}, {@link Bitmap#initialize}.
   * Read in: {@link Bitmap#isError}, {@link Bitmap#isReady}.
   */
  _loadingState: string;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Bitmap#initialize}.
   * Written in: {@link Bitmap#initialize}.
   * Read in: none.
   */
  _paintOpacity: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Bitmap#initialize}.
   * Written in: {@link Bitmap#initialize}.
   * Read in: {@link Bitmap#_updateScaleMode}.
   */
  _smooth: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `string`.
   * Initialized in: {@link Bitmap#initialize}.
   * Written in: {@link Bitmap#initialize}.
   * Read in: {@link Bitmap#_startDecrypting}, {@link Bitmap#_startLoading}.
   */
  _url: string;
  /**
   * Performs call load listeners.
   */
  _callLoadListeners(): void;
  /**
   * Performs create base texture.
   * @param source The source parameter.
   */
  _createBaseTexture(source: object): void;
  /**
   * Tries to load the image again.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  _createCanvas(width: number, height: number): void;
  /**
   * Performs destroy canvas.
   */
  _destroyCanvas(): void;
  /**
   * Tries to load the image again.
   * @param text The text parameter.
   * @param tx The tx parameter.
   * @param ty The ty parameter.
   * @param maxWidth The maxWidth parameter.
   */
  _drawTextBody(text: string, tx: number, ty: number, maxWidth: number): void;
  /**
   * Tries to load the image again.
   * @param text The text parameter.
   * @param tx The tx parameter.
   * @param ty The ty parameter.
   * @param maxWidth The maxWidth parameter.
   */
  _drawTextOutline(text: string, tx: number, ty: number, maxWidth: number): void;
  /**
   * Performs ensure canvas.
   */
  _ensureCanvas(): void;
  /**
   * Tries to load the image again.
   * @returns The result.
   */
  _makeFontNameText(): string;
  /**
   * Performs on error.
   */
  _onError(): void;
  /**
   * Performs on load.
   */
  _onLoad(): void;
  /**
   * Performs on xhr load.
   * @param xhr The xhr parameter.
   */
  _onXhrLoad(xhr: XMLHttpRequest): void;
  /**
   * Performs start decrypting.
   */
  _startDecrypting(): void;
  /**
   * Performs start loading.
   */
  _startLoading(): void;
  /**
   * Performs update scale mode.
   */
  _updateScaleMode(): void;
  /**
   * Adds a callback function that will be called when the bitmap is loaded.
   * @param listner The callback function.
   */
  addLoadListener(listner: () => void): void;
  /**
   * The base texture that holds the image.
   * @returns The result.
   */
  get baseTexture(): unknown;
  /**
   * Performs a block transfer.
   * @param source The bitmap to draw.
   * @param sx The x coordinate in the source.
   * @param sy The y coordinate in the source.
   * @param sw The width of the source image.
   * @param sh The height of the source image.
   * @param dx The x coordinate in the destination.
   * @param dy The y coordinate in the destination.
   * @param dw The dw parameter.
   * @param dh The dh parameter.
   */
  blt(source: Bitmap, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
  /**
   * The bitmap canvas.
   * @returns The result.
   */
  get canvas(): unknown;
  /**
   * Clears the entire bitmap.
   */
  clear(): void;
  /**
   * Clears the specified rectangle.
   * @param x The x coordinate for the upper-left corner.
   * @param y The y coordinate for the upper-left corner.
   * @param width The width of the rectangle to clear.
   * @param height The height of the rectangle to clear.
   */
  clearRect(x: number, y: number, width: number, height: number): void;
  /**
   * The 2d context of the bitmap canvas.
   * @returns The result.
   */
  get context(): unknown;
  /**
   * Destroys the bitmap.
   */
  destroy(): void;
  /**
   * Draws a bitmap in the shape of a circle.
   * @param x The x coordinate based on the circle center.
   * @param y The y coordinate based on the circle center.
   * @param radius The radius of the circle.
   * @param color The color of the circle in CSS format.
   */
  drawCircle(x: number, y: number, radius: number, color: string): void;
  /**
   * Draws the outline text to the bitmap.
   * @param text The text that will be drawn.
   * @param x The x coordinate for the left of the text.
   * @param y The y coordinate for the top of the text.
   * @param maxWidth The maximum allowed width of the text.
   * @param lineHeight The height of the text line.
   * @param align The alignment of the text.
   */
  drawText(text: string, x: number, y: number, maxWidth: number, lineHeight: number, align: string): void;
  /**
   * Fills the entire bitmap.
   * @param color The color of the rectangle in CSS format.
   */
  fillAll(color: string): void;
  /**
   * Fills the specified rectangle.
   * @param x The x coordinate for the upper-left corner.
   * @param y The y coordinate for the upper-left corner.
   * @param width The width of the rectangle to fill.
   * @param height The height of the rectangle to fill.
   * @param color The color of the rectangle in CSS format.
   */
  fillRect(x: number, y: number, width: number, height: number, color: string): void;
  /**
   * Returns alpha pixel value at the specified point.
   * @param x The x coordinate of the pixel in the bitmap.
   * @param y The y coordinate of the pixel in the bitmap.
   * @returns The result.
   */
  getAlphaPixel(x: number, y: number): string;
  /**
   * Returns pixel color at the specified point.
   * @param x The x coordinate of the pixel in the bitmap.
   * @param y The y coordinate of the pixel in the bitmap.
   * @returns The result.
   */
  getPixel(x: number, y: number): string;
  /**
   * Draws the rectangle with a gradation.
   * @param x The x coordinate for the upper-left corner.
   * @param y The y coordinate for the upper-left corner.
   * @param width The width of the rectangle to fill.
   * @param height The height of the rectangle to fill.
   * @param color1 The gradient starting color.
   * @param color2 The gradient ending color.
   * @param vertical Whether the gradient should be draw as vertical or not.
   */
  gradientFillRect(x: number, y: number, width: number, height: number, color1: string, color2: string, vertical: boolean): void;
  /**
   * The height of the bitmap.
   * @returns The result.
   */
  get height(): number;
  /**
   * The bitmap image.
   * @returns The result.
   */
  get image(): unknown;
  /**
   * The basic object that represents an image.
   * @param width The width of the bitmap.
   * @param height The height of the bitmap.
   */
  initialize(width: number, height: number): void;
  /**
   * Checks whether a loading error has occurred.
   * @returns True if error; false otherwise.
   */
  isError(): boolean;
  /**
   * Checks whether the bitmap is ready to render.
   * @returns True if ready; false otherwise.
   */
  isReady(): boolean;
  /**
   * Returns the width of the specified text.
   * @param text The text to be measured.
   * @returns The result.
   */
  measureTextWidth(text: string): number;
  /**
   * The opacity of the drawing object in the range (0, 255).
   * @returns The result.
   */
  get paintOpacity(): unknown;
  /**
   * The rectangle of the bitmap.
   * @returns The result.
   */
  get rect(): Rectangle;
  /**
   * Resizes the bitmap.
   * @param width The new width of the bitmap.
   * @param height The new height of the bitmap.
   */
  resize(width: number, height: number): void;
  /**
   * Tries to load the image again.
   */
  retry(): void;
  /**
   * Whether the smooth scaling is applied.
   * @returns The result.
   */
  get smooth(): unknown;
  /**
   * Draws the specified rectangular frame.
   * @param x The x coordinate for the upper-left corner.
   * @param y The y coordinate for the upper-left corner.
   * @param width The width of the rectangle to fill.
   * @param height The height of the rectangle to fill.
   * @param color The color of the rectangle in CSS format.
   */
  strokeRect(x: number, y: number, width: number, height: number, color: string): void;
  /**
   * The url of the image file.
   * @returns The result.
   */
  get url(): unknown;
  /**
   * The width of the bitmap.
   * @returns The result.
   */
  get width(): number;
}
declare namespace Bitmap
{
  /**
   * Loads a image file.
   * @param url The image url of the texture.
   * @returns The result.
   */
  function load(url: string): Bitmap;
  /**
   * Takes a snapshot of the game screen.
   * @param stage The stage object.
   * @returns The result.
   */
  function snap(stage: Stage): Bitmap;
}
