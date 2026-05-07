/**
 * Generated from project/js/rmmz_core.js
 * Class: Sprite
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _bitmap: unknown;
  _blendColor: number[];
  _blendMode: unknown;
  _colorFilter: null | ColorFilter;
  _colorTone: number[];
  _counter: number;
  _emptyBaseTexture: null;
  _frame: unknown;
  _hidden: boolean;
  _hue: number;
  _refreshFrame: boolean;
  _createColorFilter(): void;
  /**
   * Sets the color tone for the sprite.
   */
  _onBitmapChange(): void;
  /**
   * Sets the color tone for the sprite.
   */
  _onBitmapLoad(bitmapLoaded: Bitmap): void;
  _refresh(): void;
  _updateColorFilter(): void;
  /**
   * Destroys the sprite.
   */
  destroy(): void;
  /**
   * Gets the blend color for the sprite.
   */
  getBlendColor(): [number, number, number, number];
  /**
   * Gets the color tone for the sprite.
   */
  getColorTone(): [number, number, number, number];
  /**
   * Makes the sprite "hidden".
   */
  hide(): void;
  /**
   * The basic object that is rendered to the game screen.
   * @param bitmap The image for the sprite.
   */
  initialize(bitmap: Bitmap): void;
  /**
   * Sets the x and y at once.
   * @param x The x coordinate of the sprite.
   * @param y The y coordinate of the sprite.
   */
  move(x: number, y: number): void;
  /**
   * Sets the blend color for the sprite.
   * @param color The blend color [r, g, b, a].
   */
  setBlendColor(color: [number, number, number, number]): void;
  /**
   * Sets the color tone for the sprite.
   * @param tone The color tone [r, g, b, gray].
   */
  setColorTone(tone: [number, number, number, number]): void;
  /**
   * Sets the rectagle of the bitmap that the sprite displays.
   * @param x The x coordinate of the frame.
   * @param y The y coordinate of the frame.
   * @param width The width of the frame.
   * @param height The height of the frame.
   */
  setFrame(x: number, y: number, width: number, height: number): void;
  /**
   * Sets the hue rotation value.
   * @param hue The hue value (-360, 360).
   */
  setHue(hue: number): void;
  /**
   * Releases the "hidden" state of the sprite.
   */
  show(): void;
  /**
   * Updates the sprite for each frame.
   */
  update(): void;
  /**
   * Reflects the "hidden" state of the sprite to the visible state.
   */
  updateVisibility(): void;
}
