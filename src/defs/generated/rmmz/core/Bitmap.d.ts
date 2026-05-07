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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _baseTexture: null | PIXI.BaseTexture;
  _canvas: null;
  _context: null;
  _image: null | Image;
  _loadListeners: unknown[];
  _loadingState: string;
  _paintOpacity: number;
  _smooth: boolean;
  _url: string;
  _callLoadListeners(): void;
  _createBaseTexture(source: object): void;
  /**
   * Tries to load the image again.
   */
  _createCanvas(width: number, height: number): void;
  _destroyCanvas(): void;
  /**
   * Tries to load the image again.
   */
  _drawTextBody(text: string, tx: number, ty: number, maxWidth: number): void;
  /**
   * Tries to load the image again.
   */
  _drawTextOutline(text: string, tx: number, ty: number, maxWidth: number): void;
  _ensureCanvas(): void;
  /**
   * Tries to load the image again.
   */
  _makeFontNameText(): string;
  _onError(): void;
  _onLoad(): void;
  _onXhrLoad(xhr: XMLHttpRequest): void;
  _startDecrypting(): void;
  _startLoading(): void;
  _updateScaleMode(): void;
  /**
   * Adds a callback function that will be called when the bitmap is loaded.
   * @param listner The callback function.
   */
  addLoadListener(listner: () => void): void;
  /**
   * Performs a block transfer.
   * @param source The bitmap to draw.
   * @param sx The x coordinate in the source.
   * @param sy The y coordinate in the source.
   * @param sw The width of the source image.
   * @param sh The height of the source image.
   * @param dx The x coordinate in the destination.
   * @param dy The y coordinate in the destination.
   */
  blt(source: Bitmap, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
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
   */
  getAlphaPixel(x: number, y: number): string;
  /**
   * Returns pixel color at the specified point.
   * @param x The x coordinate of the pixel in the bitmap.
   * @param y The y coordinate of the pixel in the bitmap.
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
   * The basic object that represents an image.
   * @param width The width of the bitmap.
   * @param height The height of the bitmap.
   */
  initialize(width: number, height: number): void;
  /**
   * Checks whether a loading error has occurred.
   */
  isError(): boolean;
  /**
   * Checks whether the bitmap is ready to render.
   */
  isReady(): boolean;
  /**
   * Returns the width of the specified text.
   * @param text The text to be measured.
   */
  measureTextWidth(text: string): number;
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
   * Draws the specified rectangular frame.
   * @param x The x coordinate for the upper-left corner.
   * @param y The y coordinate for the upper-left corner.
   * @param width The width of the rectangle to fill.
   * @param height The height of the rectangle to fill.
   * @param color The color of the rectangle in CSS format.
   */
  strokeRect(x: number, y: number, width: number, height: number, color: string): void;
}
declare namespace Bitmap
{
  /**
   * Loads a image file.
   * @param url The image url of the texture.
   */
  function load(url: string): Bitmap;
  /**
   * Takes a snapshot of the game screen.
   * @param stage The stage object.
   */
  function snap(stage: Stage): Bitmap;
}
