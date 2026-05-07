/**
 * Generated from project/js/rmmz_sprites.js
 * Class: Sprite_Clickable
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Sprite_Clickable extends Sprite
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Sprite_Clickable#initialize}.<br/>
   * Written in: {@link Sprite_Clickable#initialize}, {@link Sprite_Clickable#processTouch}.<br/>
   * Read in: {@link Sprite_Clickable#processTouch}.<br/>
   */
  _hovered: boolean;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `boolean`.<br/>
   * Initialized in: {@link Sprite_Clickable#initialize}.<br/>
   * Written in: {@link Sprite_Clickable#initialize}, {@link Sprite_Clickable#processTouch}.<br/>
   * Read in: {@link Sprite_Clickable#isPressed}, {@link Sprite_Clickable#processTouch}.<br/>
   */
  _pressed: boolean;
  /**
   * Gets hit test.
   * @param x The x parameter.
   * @param y The y parameter.
   * @returns The result.
   */
  hitTest(x: number, y: number): boolean;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Determines whether being touched.
   * @returns True if being touched; false otherwise.
   */
  isBeingTouched(): boolean;
  /**
   * Determines whether click enabled.
   * @returns True if click enabled; false otherwise.
   */
  isClickEnabled(): boolean;
  /**
   * Determines whether pressed.
   * @returns True if pressed; false otherwise.
   */
  isPressed(): boolean;
  /**
   * Performs on click.
   */
  onClick(): void;
  /**
   * Performs on mouse enter.
   */
  onMouseEnter(): void;
  /**
   * Performs on mouse exit.
   */
  onMouseExit(): void;
  /**
   * Performs on press.
   */
  onPress(): void;
  /**
   * Performs process touch.
   */
  processTouch(): void;
  /**
   * Performs update.
   */
  update(): void;
}
