/**
 * Generated from project/js/rmmz_windows.js
 * Class: Window_MapName
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Window_MapName extends Window_Base
{
  /**
   * Inferred engine backing field.<br/>
   *<br/>
   * Type: `number`.<br/>
   * Initialized in: {@link Window_MapName#initialize}.<br/>
   * Written in: {@link Window_MapName#close}, {@link Window_MapName#initialize}, {@link Window_MapName#open}, {@link Window_MapName#update}.<br/>
   * Read in: {@link Window_MapName#update}.<br/>
   */
  _showCount: number;
  /**
   * Performs close.
   */
  close(): void;
  /**
   * Performs draw background.
   * @param x The x parameter.
   * @param y The y parameter.
   * @param width The width parameter.
   * @param height The height parameter.
   */
  drawBackground(x: number, y: number, width: number, height: number): void;
  /**
   * Initializes initialize.
   * @param rect The rect parameter.
   */
  initialize(rect: Rectangle): void;
  /**
   * Performs open.
   */
  open(): void;
  /**
   * Performs refresh.
   */
  refresh(): void;
  /**
   * Performs update.
   */
  update(): void;
  /**
   * Updates fade in.
   */
  updateFadeIn(): void;
  /**
   * Updates fade out.
   */
  updateFadeOut(): void;
}
