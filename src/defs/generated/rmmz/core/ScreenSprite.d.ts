/**
 * Generated from project/js/rmmz_core.js
 * Class: ScreenSprite
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface ScreenSprite
{
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link ScreenSprite#initialize}.
   * Written in: {@link ScreenSprite#initialize}, {@link ScreenSprite#setColor}.
   * Read in: {@link ScreenSprite#setColor}.
   */
  _blue: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `PIXI.Graphics`.
   * Initialized in: {@link ScreenSprite#initialize}.
   * Written in: {@link ScreenSprite#initialize}.
   * Read in: {@link ScreenSprite#initialize}, {@link ScreenSprite#setColor}.
   */
  _graphics: PIXI.Graphics;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link ScreenSprite#initialize}.
   * Written in: {@link ScreenSprite#initialize}, {@link ScreenSprite#setColor}.
   * Read in: {@link ScreenSprite#setColor}.
   */
  _green: number;
  /**
   * Inferred engine backing field.
   *
   * Type: `number`.
   * Initialized in: {@link ScreenSprite#initialize}.
   * Written in: {@link ScreenSprite#initialize}, {@link ScreenSprite#setColor}.
   * Read in: {@link ScreenSprite#setColor}.
   */
  _red: number;
  /**
   * Destroys the screen sprite.
   */
  destroy(): void;
  /**
   * The sprite which covers the entire game screen.
   */
  initialize(): void;
  /**
   * Sets black to the color of the screen sprite.
   */
  setBlack(): void;
  /**
   * Sets the color of the screen sprite by values.
   * @param r The red value in the range (0, 255).
   * @param g The green value in the range (0, 255).
   * @param b The blue value in the range (0, 255).
   */
  setColor(r: number, g: number, b: number): void;
  /**
   * Sets white to the color of the screen sprite.
   */
  setWhite(): void;
}
