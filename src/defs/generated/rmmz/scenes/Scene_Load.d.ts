/**
 * Generated from project/js/rmmz_scenes.js
 * Class: Scene_Load
 * Instance/static typings merge with the engine constructor + prototype in project/js.
 * Do not hand-edit; regenerate with bun run defs:generate.
 * IDE: prototype navigation is authoritative in project/js/rmmz_*.js — ambient defs are for typing.
 */
interface Scene_Load
{
  /**
   * Instance fields inferred from `this._*` assignments across vanilla engine sources.
   */
  _loadSuccess: boolean;
  executeLoad(savefileId: number): void;
  firstSavefileId(): number;
  helpWindowText(): string;
  initialize(): void;
  mode(): string;
  onLoadFailure(): void;
  onLoadSuccess(): void;
  onSavefileOk(): void;
  reloadMapIfUpdated(): void;
  terminate(): void;
}
