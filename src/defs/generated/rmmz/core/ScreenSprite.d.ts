/**
 * Generated from project/js/rmmz_core.js
 * Class: ScreenSprite
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface ScreenSprite extends PIXI.Container
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link ScreenSprite#initialize}.<br/>
   * Written in: {@link ScreenSprite#initialize}, {@link ScreenSprite#setColor}.<br/>
   * Read in: {@link ScreenSprite#setColor}.<br/>
   */
  _blue: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `PIXI.Graphics`.<br/>
   * Initialized in: {@link ScreenSprite#initialize}.<br/>
   * Written in: {@link ScreenSprite#initialize}.<br/>
   * Read in: {@link ScreenSprite#initialize}, {@link ScreenSprite#setColor}.<br/>
   */
  _graphics: PIXI.Graphics;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link ScreenSprite#initialize}.<br/>
   * Written in: {@link ScreenSprite#initialize}, {@link ScreenSprite#setColor}.<br/>
   * Read in: {@link ScreenSprite#setColor}.<br/>
   */
  _green: number;
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link ScreenSprite#initialize}.<br/>
   * Written in: {@link ScreenSprite#initialize}, {@link ScreenSprite#setColor}.<br/>
   * Read in: {@link ScreenSprite#setColor}.<br/>
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
   * The opacity of the sprite (0 to 255).
   * @returns The result.
   */
  get opacity(): unknown;
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
