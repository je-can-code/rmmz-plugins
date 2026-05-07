/**
 * Generated from project/js/rmmz_core.js
 * Class: WindowLayer
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface WindowLayer
{
  /**
   * The layer which contains game windows.
   */
  initialize(): void;
  /**
   * Renders the object using the WebGL renderer.
   * @param renderer The renderer.
   */
  render(renderer: PIXI.Renderer): void;
  /**
   * Updates the window layer for each frame.
   */
  update(): void;
}
