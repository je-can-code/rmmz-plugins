/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Options
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Options extends Scene_MenuBase
{
  /**
   * Inferred engine backing field.
   *
   * Type: `Window_Options`.
   * Initialized in: none.
   * Written in: {@link Scene_Options#createOptionsWindow}.
   * Read in: {@link Scene_Options#createOptionsWindow}.
   */
  _optionsWindow: Window_Options;
  /**
   * Performs create.
   */
  create(): void;
  /**
   * Creates options window.
   */
  createOptionsWindow(): void;
  /**
   * Initializes initialize.
   */
  initialize(): void;
  /**
   * Gets max commands.
   * @returns The result.
   */
  maxCommands(): number;
  /**
   * Gets max visible commands.
   * @returns The result.
   */
  maxVisibleCommands(): number;
  /**
   * Gets options window rect.
   * @returns The result.
   */
  optionsWindowRect(): Rectangle;
  /**
   * Performs terminate.
   */
  terminate(): void;
}
