/**
 * Generated from project/js/rmmz_core.js
 * Class: ColorFilter
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface ColorFilter
{
  /**
   * Sets the brightness.
   */
  _fragmentSrc(): string;
  /**
   * The color filter for WebGL.
   */
  initialize(): void;
  /**
   * Sets the blend color.
   * @param color The blend color [r, g, b, a].
   */
  setBlendColor(color: [number, number, number, number]): void;
  /**
   * Sets the brightness.
   * @param brightness The brightness (0 to 255).
   */
  setBrightness(brightness: number): void;
  /**
   * Sets the color tone.
   * @param tone The color tone [r, g, b, gray].
   */
  setColorTone(tone: [number, number, number, number]): void;
  /**
   * Sets the hue rotation value.
   * @param hue The hue value (-360, 360).
   */
  setHue(hue: number): void;
}
