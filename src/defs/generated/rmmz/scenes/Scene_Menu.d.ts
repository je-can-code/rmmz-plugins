/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Menu
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Menu
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _commandWindow: unknown;
  _goldWindow: Window_Gold;
  _statusWindow: Window_MenuStatus;
  commandFormation(): void;
  commandGameEnd(): void;
  commandItem(): void;
  commandOptions(): void;
  commandPersonal(): void;
  commandSave(): void;
  commandWindowRect(): Rectangle;
  create(): void;
  createCommandWindow(): void;
  createGoldWindow(): void;
  createStatusWindow(): void;
  goldWindowRect(): Rectangle;
  helpAreaHeight(): number;
  initialize(): void;
  onFormationCancel(): void;
  onFormationOk(): void;
  onPersonalCancel(): void;
  onPersonalOk(): void;
  start(): void;
  statusWindowRect(): Rectangle;
}
