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
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _commandWindow: Window_GameEnd;
  commandToTitle(): void;
  commandWindowRect(): Rectangle;
  create(): void;
  createBackground(): void;
  createCommandWindow(): void;
  initialize(): void;
  stop(): void;
}
