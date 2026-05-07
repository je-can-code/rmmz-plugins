/**
 * Generated from project/js/rmmz_core.js
 * Class: Sprite
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite extends PIXI.Sprite
{
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: {@link Sprite#initialize}.
   * Written in: {@link Sprite#initialize}.
   * Read in: {@link Sprite#_onBitmapChange}, {@link Sprite#_onBitmapLoad}, {@link Sprite#_refresh}.
   */
  _bitmap: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `number[]`.
   * Initialized in: {@link Sprite#initialize}.
   * Written in: {@link Sprite#initialize}, {@link Sprite#setBlendColor}.
   * Read in: {@link Sprite#_updateColorFilter}, {@link Sprite#getBlendColor}, {@link Sprite#setBlendColor}.
   */
  _blendColor: number[];
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: {@link Sprite#initialize}.
   * Written in: {@link Sprite#initialize}.
   * Read in: none.
   */
  _blendMode: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `null | ColorFilter`.
   * Initialized in: {@link Sprite#initialize}.
   * Written in: {@link Sprite#_createColorFilter}, {@link Sprite#initialize}.
   * Read in: {@link Sprite#_createColorFilter}, {@link Sprite#_updateColorFilter}.
   */
  _colorFilter: null | ColorFilter;
  /**
   * Inferred engine backing field.
   *
   * Type: `number[]`.
   * Initialized in: {@link Sprite#initialize}.
   * Written in: {@link Sprite#initialize}, {@link Sprite#setColorTone}.
   * Read in: {@link Sprite#_updateColorFilter}, {@link Sprite#getColorTone}, {@link Sprite#setColorTone}.
   */
  _colorTone: number[];
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: none.
   */
  _counter: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `null`.
   * Initialized in: module init.
   * Written in: module init.
   * Read in: none.
   */
  _emptyBaseTexture: null;
  /**
   * Inferred engine backing field.
   *
   * Type: `unknown`.
   * Initialized in: {@link Sprite#initialize}.
   * Written in: {@link Sprite#initialize}.
   * Read in: {@link Sprite#_onBitmapLoad}, {@link Sprite#_refresh}, {@link Sprite#setFrame}.
   */
  _frame: unknown;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: {@link Sprite#initialize}.
   * Written in: {@link Sprite#hide}, {@link Sprite#initialize}, {@link Sprite#show}.
   * Read in: {@link Sprite#updateVisibility}.
   */
  _hidden: boolean;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link Sprite#initialize}.
   * Written in: {@link Sprite#initialize}, {@link Sprite#setHue}.
   * Read in: {@link Sprite#_updateColorFilter}, {@link Sprite#setHue}.
   */
  _hue: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `boolean`.
   * Initialized in: none.
   * Written in: {@link Sprite#_onBitmapChange}, {@link Sprite#_onBitmapLoad}, {@link Sprite#setFrame}.
   * Read in: {@link Sprite#_onBitmapLoad}.
   */
  _refreshFrame: boolean;
  /**
   * Performs create color filter.
   */
  _createColorFilter(): void;
  /**
   * Sets the color tone for the sprite.
   */
  _onBitmapChange(): void;
  /**
   * Sets the color tone for the sprite.
   * @param bitmapLoaded The bitmapLoaded parameter.
   */
  _onBitmapLoad(bitmapLoaded: Bitmap): void;
  /**
   * Performs refresh.
   */
  _refresh(): void;
  /**
   * Performs update color filter.
   */
  _updateColorFilter(): void;
  /**
   * Destroys the sprite.
   */
  destroy(): void;
  /**
   * Gets the blend color for the sprite.
   * @returns The result.
   */
  getBlendColor(): [number, number, number, number];
  /**
   * Gets the color tone for the sprite.
   * @returns The result.
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
