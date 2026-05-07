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
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Sprite#initialize}.<br/>
   * Written in: {@link Sprite#initialize}.<br/>
   * Read in: {@link Sprite#_onBitmapChange}, {@link Sprite#_onBitmapLoad}, {@link Sprite#_refresh}.<br/>
   */
  _bitmap: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number[]`.<br/>
   * Initialized in: {@link Sprite#initialize}.<br/>
   * Written in: {@link Sprite#initialize}, {@link Sprite#setBlendColor}.<br/>
   * Read in: {@link Sprite#_updateColorFilter}, {@link Sprite#getBlendColor}, {@link Sprite#setBlendColor}.<br/>
   */
  _blendColor: number[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Sprite#initialize}.<br/>
   * Written in: {@link Sprite#initialize}.<br/>
   * Read in: none.<br/>
   */
  _blendMode: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | ColorFilter`.<br/>
   * Initialized in: {@link Sprite#initialize}.<br/>
   * Written in: {@link Sprite#_createColorFilter}, {@link Sprite#initialize}.<br/>
   * Read in: {@link Sprite#_createColorFilter}, {@link Sprite#_updateColorFilter}.<br/>
   */
  _colorFilter: null | ColorFilter;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number[]`.<br/>
   * Initialized in: {@link Sprite#initialize}.<br/>
   * Written in: {@link Sprite#initialize}, {@link Sprite#setColorTone}.<br/>
   * Read in: {@link Sprite#_updateColorFilter}, {@link Sprite#getColorTone}, {@link Sprite#setColorTone}.<br/>
   */
  _colorTone: number[];
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: module init.<br/>
   * Written in: module init.<br/>
   * Read in: none.<br/>
   */
  _counter: number;
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
   * Initialized in: {@link Sprite#initialize}.<br/>
   * Written in: {@link Sprite#initialize}.<br/>
   * Read in: {@link Sprite#_onBitmapLoad}, {@link Sprite#_refresh}, {@link Sprite#setFrame}.<br/>
   */
  _frame: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Sprite#initialize}.<br/>
   * Written in: {@link Sprite#hide}, {@link Sprite#initialize}, {@link Sprite#show}.<br/>
   * Read in: {@link Sprite#updateVisibility}.<br/>
   */
  _hidden: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Sprite#initialize}.<br/>
   * Written in: {@link Sprite#initialize}, {@link Sprite#setHue}.<br/>
   * Read in: {@link Sprite#_updateColorFilter}, {@link Sprite#setHue}.<br/>
   */
  _hue: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: none.<br/>
   * Written in: {@link Sprite#_onBitmapChange}, {@link Sprite#_onBitmapLoad}, {@link Sprite#setFrame}.<br/>
   * Read in: {@link Sprite#_onBitmapLoad}.<br/>
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
   * The image for the sprite.
   * @returns The result.
   */
  get bitmap(): unknown;
  /**
   * The blend mode to be applied to the sprite.
   * @returns The result.
   */
  get blendMode(): number;
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
   * The height of the sprite without the scale.
   * @returns The result.
   */
  get height(): number;
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
   * The opacity of the sprite (0 to 255).
   * @returns The result.
   */
  get opacity(): number;
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
  /**
   * The width of the sprite without the scale.
   * @returns The result.
   */
  get width(): number;
}
