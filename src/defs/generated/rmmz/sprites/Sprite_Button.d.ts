/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Button
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Button extends Sprite_Clickable
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `unknown`.<br/>
   * Initialized in: {@link Sprite_Button#initialize}.<br/>
   * Written in: {@link Sprite_Button#initialize}.<br/>
   * Read in: {@link Sprite_Button#buttonData}, {@link Sprite_Button#onClick}.<br/>
   */
  _buttonType: unknown;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null`.<br/>
   * Initialized in: {@link Sprite_Button#initialize}.<br/>
   * Written in: {@link Sprite_Button#initialize}, {@link Sprite_Button#setClickHandler}.<br/>
   * Read in: {@link Sprite_Button#onClick}.<br/>
   */
  _clickHandler: null;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Rectangle`.<br/>
   * Initialized in: {@link Sprite_Button#initialize}.<br/>
   * Written in: {@link Sprite_Button#initialize}, {@link Sprite_Button#setColdFrame}.<br/>
   * Read in: {@link Sprite_Button#updateFrame}.<br/>
   */
  _coldFrame: null | Rectangle;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `null | Rectangle`.<br/>
   * Initialized in: {@link Sprite_Button#initialize}.<br/>
   * Written in: {@link Sprite_Button#initialize}, {@link Sprite_Button#setHotFrame}.<br/>
   * Read in: {@link Sprite_Button#updateFrame}.<br/>
   */
  _hotFrame: null | Rectangle;
  /**
   * Gets block height.
   * @returns The result.
   */
  blockHeight(): number;
  /**
   * Gets block width.
   * @returns The result.
   */
  blockWidth(): number;
  /**
   * Gets button data.
   * @returns The result.
   */
  buttonData(): unknown;
  /**
   * Performs check bitmap.
   */
  checkBitmap(): void;
  /**
   * Initializes initialize.
   * @param buttonType The buttonType parameter.
   */
  initialize(buttonType: unknown): void;
  /**
   * Performs load button image.
   */
  loadButtonImage(): void;
  /**
   * Performs on click.
   */
  onClick(): void;
  /**
   * Sets click handler.
   * @param method The method parameter.
   */
  setClickHandler(method: unknown): void;
  /**
   * Sets cold frame.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  setColdFrame(x: unknown, y: unknown, width: unknown, height: unknown): void;
  /**
   * Sets hot frame.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  setHotFrame(x: unknown, y: unknown, width: unknown, height: unknown): void;
  /**
   * Performs setup frames.
   */
  setupFrames(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates frame.
   */
  updateFrame(): void;
  /**
   * Updates opacity.
   */
  updateOpacity(): void;
}
