/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_File
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_File
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _helpWindow: Window_Help;
  _listWindow: Window_SavefileList;
  activateListWindow(): void;
  create(): void;
  createHelpWindow(): void;
  createListWindow(): void;
  firstSavefileId(): number;
  helpAreaHeight(): number;
  helpWindowRect(): Rectangle;
  helpWindowText(): string;
  initialize(): void;
  isSavefileEnabled(savefileId: number): boolean;
  listWindowRect(): Rectangle;
  mode(): null;
  needsAutosave(): boolean;
  onSavefileOk(): void;
  savefileId(): number;
  start(): void;
}
