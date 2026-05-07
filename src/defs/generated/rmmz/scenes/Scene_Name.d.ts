/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Name
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Name
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _actor: unknown;
  _actorId: number;
  _editWindow: Window_NameEdit;
  _inputWindow: Window_NameInput;
  _maxLength: number;
  create(): void;
  createEditWindow(): void;
  createInputWindow(): void;
  editWindowRect(): Rectangle;
  initialize(): void;
  inputWindowRect(): Rectangle;
  onInputOk(): void;
  prepare(actorId: number, maxLength: number): void;
  start(): void;
}
