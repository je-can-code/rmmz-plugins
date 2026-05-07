/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_GameEnd
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_GameEnd
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_GameEnd`.
   * Initialized in: none.
   * Written in: {@link Scene_GameEnd#createCommandWindow}.
   * Read in: {@link Scene_GameEnd#createCommandWindow}, {@link Scene_GameEnd#stop}.
   */
  _commandWindow: Window_GameEnd;
  /**
   * Performs command to title.
   */
  commandToTitle(): void;
  /**
   * Gets command window rect.
   * @returns The result.
   */
  commandWindowRect(): Rectangle;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates background.
   */
  createBackground(): void;
  /**
   * Creates command window.
   */
  createCommandWindow(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Performs stop.
   */
  stop(): void;
}
