/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Options
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Options
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _optionsWindow: Window_Options;
  create(): void;
  createOptionsWindow(): void;
  initialize(): void;
  maxCommands(): number;
  maxVisibleCommands(): number;
  optionsWindowRect(): Rectangle;
  terminate(): void;
}
